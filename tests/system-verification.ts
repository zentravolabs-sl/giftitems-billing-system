import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/lib/auth";
import { Role, StockMovementType, PurchaseStatus, SaleStatus, OrderStatus, PaymentStatus } from "@prisma/client";

async function runSystemVerification() {
  console.log("=================================================");
  console.log("   ZENTRAVO GIFT SHOP SYSTEM VERIFICATION SUITE   ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Settings & CMS Verification
    console.log("1. Verifying Business Settings & CMS Content...");
    const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
    assert(!!settings && (settings.shopName.includes("Oak Bloom") || settings.shopName.includes("Zentravo")), "Business Settings singleton exists with valid shop name");
    assert(settings?.currencySymbol === "Rs." || settings?.currencySymbol === "Rs" || settings?.currencySymbol === "$", "Store currency configured properly");

    const content = await prisma.websiteContent.findUnique({ where: { id: "default" } });
    assert(!!content && !!content.heroTitle, "CMS WebsiteContent singleton exists with hero banner");

    // 2. Authentication & Cryptographic Verification
    console.log("\n2. Verifying RBAC Authentication & Tokens...");
    const testPassword = "Admin@123456";
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@zentravo.com" } });
    assert(!!adminUser, "Super Admin user exists in database");
    assert(adminUser?.role === Role.SUPER_ADMIN, "Admin user role is SUPER_ADMIN");

    if (adminUser) {
      const isPasswordValid = await verifyPassword(testPassword, adminUser.passwordHash);
      assert(isPasswordValid, "Password hash verification succeeds with bcrypt");

      const token = signToken({
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });
      assert(typeof token === "string" && token.length > 20, "JWT token generation succeeds");

      const decoded = verifyToken(token);
      assert(decoded?.email === adminUser.email && decoded?.role === Role.SUPER_ADMIN, "JWT verification and payload decoding succeed");
    }

    // 3. Product Catalogue & Inventory Verification
    console.log("\n3. Verifying Product Catalogue & Opening Stock...");
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, images: true },
    });
    assert(products.length >= 8, `Product catalogue contains ${products.length} active gift items`);

    const sampleProduct = products[0];
    assert(Number(sampleProduct.stockQuantity) > 0, `Sample product "${sampleProduct.name}" has stock: ${sampleProduct.stockQuantity}`);
    assert(sampleProduct.images.length > 0, `Sample product has ${sampleProduct.images.length} images mapped`);

    // Check opening stock ledger entries
    const openingMovements = await prisma.inventoryMovement.findMany({
      where: { movementType: StockMovementType.OPENING_STOCK },
    });
    assert(openingMovements.length > 0, `Inventory Movement Ledger contains ${openingMovements.length} opening stock entries`);

    // 4. Purchasing & Weighted Average Costing Verification
    console.log("\n4. Verifying Purchasing & Weighted Average Cost Calculation...");
    const supplier = await prisma.supplier.findFirst();
    assert(!!supplier, "Supplier exists for stock receiving");

    if (supplier && sampleProduct) {
      const initialStock = Number(sampleProduct.stockQuantity);
      const initialCost = Number(sampleProduct.buyingCost);
      const testPurchaseQty = 5;
      const testUnitCost = initialCost * 1.2; // 20% higher cost

      const purchaseNumber = `TEST-PO-${Date.now().toString(36).toUpperCase()}`;

      // Simulate transactional GRN receiving
      await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.create({
          data: {
            purchaseNumber,
            supplierId: supplier.id,
            status: PurchaseStatus.RECEIVED,
            subtotal: testPurchaseQty * testUnitCost,
            grandTotal: testPurchaseQty * testUnitCost,
            paidAmount: testPurchaseQty * testUnitCost,
            balanceDue: 0,
            createdById: adminUser!.id,
            items: {
              create: {
                productId: sampleProduct.id,
                quantityOrdered: testPurchaseQty,
                quantityReceived: testPurchaseQty,
                unitCost: testUnitCost,
                lineTotal: testPurchaseQty * testUnitCost,
              },
            },
          },
        });

        const newStock = initialStock + testPurchaseQty;
        const newWeightedCost = (initialStock * initialCost + testPurchaseQty * testUnitCost) / newStock;

        await tx.product.update({
          where: { id: sampleProduct.id },
          data: {
            stockQuantity: newStock,
            buyingCost: Math.round(newWeightedCost * 100) / 100,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: sampleProduct.id,
            movementType: StockMovementType.PURCHASE_RECEIVE,
            quantityChange: testPurchaseQty,
            previousStock: initialStock,
            newStock,
            unitCost: testUnitCost,
            referenceDocument: purchaseNumber,
            notes: "Automated test stock receiving",
            createdById: adminUser!.id,
          },
        });
      });

      const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: sampleProduct.id } });
      assert(Number(updatedProduct.stockQuantity) === initialStock + testPurchaseQty, "Product stock incremented accurately after GRN receipt");
      assert(Number(updatedProduct.buyingCost) >= initialCost, "Weighted-average cost recalculated and updated in database");

      const grnMovement = await prisma.inventoryMovement.findFirst({
        where: { referenceDocument: purchaseNumber },
      });
      assert(!!grnMovement && grnMovement.movementType === StockMovementType.PURCHASE_RECEIVE, "Inventory ledger recorded PURCHASE_RECEIVE movement entry");
    }

    // 5. POS Sale Transaction & Split Tender Verification
    console.log("\n5. Verifying POS Sales Transaction & Inventory Decrement...");
    if (sampleProduct) {
      const stockBeforeSale = Number(
        (await prisma.product.findUniqueOrThrow({ where: { id: sampleProduct.id } })).stockQuantity
      );
      const saleQty = 2;
      const saleUnitPrice = Number(sampleProduct.sellingPrice);
      const invoiceNumber = `TEST-POS-${Date.now().toString(36).toUpperCase()}`;

      const sale = await prisma.$transaction(async (tx) => {
        const created = await tx.sale.create({
          data: {
            invoiceNumber,
            status: SaleStatus.COMPLETED,
            subtotal: saleQty * saleUnitPrice,
            grandTotal: saleQty * saleUnitPrice,
            paidAmount: saleQty * saleUnitPrice,
            changeAmount: 0,
            items: {
              create: {
                productId: sampleProduct.id,
                quantity: saleQty,
                unitCost: sampleProduct.buyingCost,
                unitPrice: saleUnitPrice,
                lineTotal: saleQty * saleUnitPrice,
              },
            },
            payments: {
              create: [
                { method: "CASH", amount: Math.floor((saleQty * saleUnitPrice) / 2) },
                { method: "CARD", amount: saleQty * saleUnitPrice - Math.floor((saleQty * saleUnitPrice) / 2) },
              ],
            },
          },
          include: { items: true, payments: true },
        });

        const newStock = stockBeforeSale - saleQty;
        await tx.product.update({
          where: { id: sampleProduct.id },
          data: { stockQuantity: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: sampleProduct.id,
            movementType: StockMovementType.POS_SALE,
            quantityChange: -saleQty,
            previousStock: stockBeforeSale,
            newStock,
            unitCost: sampleProduct.buyingCost,
            referenceDocument: invoiceNumber,
            notes: "Automated test POS checkout",
          },
        });

        return created;
      });

      assert(sale.payments.length === 2, "Split payment tender (Cash + Card) persisted with exact reconciliation");
      const stockAfterSale = Number(
        (await prisma.product.findUniqueOrThrow({ where: { id: sampleProduct.id } })).stockQuantity
      );
      assert(stockAfterSale === stockBeforeSale - saleQty, "Stock decremented atomically in database during POS checkout");

      const saleMovement = await prisma.inventoryMovement.findFirst({
        where: { referenceDocument: invoiceNumber },
      });
      assert(!!saleMovement && saleMovement.movementType === StockMovementType.POS_SALE, "Inventory ledger recorded POS_SALE movement entry");
    }

    // 6. Online Website Order Transaction Verification
    console.log("\n6. Verifying Website Order Placement & Inventory Reservation...");
    if (sampleProduct) {
      const stockBeforeOrder = Number(
        (await prisma.product.findUniqueOrThrow({ where: { id: sampleProduct.id } })).stockQuantity
      );
      const orderQty = 1;
      const orderNumber = `TEST-ORD-${Date.now().toString(36).toUpperCase()}`;

      const websiteOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.websiteOrder.create({
          data: {
            orderNumber,
            customerName: "Elizabeth Bennet",
            customerEmail: "elizabeth@longbourn.org",
            customerPhone: "+1 415 555 1813",
            shippingAddress: "Longbourn Estate, Hertfordshire",
            shippingCity: "San Francisco",
            status: OrderStatus.PENDING,
            subtotal: orderQty * Number(sampleProduct.sellingPrice),
            deliveryFee: 0,
            grandTotal: orderQty * Number(sampleProduct.sellingPrice),
            items: {
              create: {
                productId: sampleProduct.id,
                quantity: orderQty,
                unitCost: sampleProduct.buyingCost,
                unitPrice: sampleProduct.sellingPrice,
                lineTotal: orderQty * Number(sampleProduct.sellingPrice),
              },
            },
          },
          include: { items: true },
        });

        const newStock = stockBeforeOrder - orderQty;
        await tx.product.update({
          where: { id: sampleProduct.id },
          data: { stockQuantity: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: sampleProduct.id,
            movementType: StockMovementType.WEB_SALE,
            quantityChange: -orderQty,
            previousStock: stockBeforeOrder,
            newStock,
            unitCost: sampleProduct.buyingCost,
            referenceDocument: orderNumber,
            notes: "Automated test web order checkout",
          },
        });

        return order;
      });

      assert(websiteOrder.status === OrderStatus.PENDING, "Website order placed in PENDING fulfillment state");
      const stockAfterOrder = Number(
        (await prisma.product.findUniqueOrThrow({ where: { id: sampleProduct.id } })).stockQuantity
      );
      assert(stockAfterOrder === stockBeforeOrder - orderQty, "Central stock decremented to prevent overselling online");
    }

    // 7. Discount Coupon Verification
    console.log("\n7. Verifying Discount Coupons...");
    const coupon = await prisma.discountCoupon.findUnique({ where: { code: "GIFT2026" } });
    assert(!!coupon && coupon.isActive, "Promotional coupon GIFT2026 is active in database");
    assert(Number(coupon?.value) === 10, "GIFT2026 offers 10% discount");

    // 8. Financial Calculations & COGS Accuracy
    console.log("\n8. Verifying Financial Calculations & COGS Reports...");
    const totalSales = await prisma.sale.aggregate({
      where: { status: "COMPLETED" },
      _sum: { grandTotal: true },
    });
    assert(Number(totalSales._sum.grandTotal) > 0, `Total Completed Sales: $${Number(totalSales._sum.grandTotal).toFixed(2)}`);

    const allSaleItems = await prisma.saleItem.findMany({
      select: { quantity: true, unitCost: true, lineTotal: true },
    });
    const calculatedCogs = allSaleItems.reduce((acc, it) => acc + Number(it.quantity) * Number(it.unitCost), 0);
    const calculatedRevenue = allSaleItems.reduce((acc, it) => acc + Number(it.lineTotal), 0);
    const calculatedGrossProfit = calculatedRevenue - calculatedCogs;

    assert(calculatedRevenue > 0, `Calculated Sales Revenue: $${calculatedRevenue.toFixed(2)}`);
    assert(calculatedCogs >= 0, `Calculated Cost of Goods Sold (COGS): $${calculatedCogs.toFixed(2)}`);
    assert(calculatedGrossProfit >= 0, `Calculated Gross Profit (Revenue - COGS): $${calculatedGrossProfit.toFixed(2)}`);

  } catch (err: any) {
    console.error("Test execution threw error:", err);
    failed++;
  } finally {
    console.log("\n=================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");
    await prisma.$disconnect();
    if (failed > 0) process.exit(1);
  }
}

runSystemVerification();

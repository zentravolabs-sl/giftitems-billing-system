import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.ACCOUNTANT, Role.INVENTORY_STAFF])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Sales metrics
    const [todaySalesData, monthSalesData, allSales] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: "COMPLETED",
        },
        _sum: { grandTotal: true, subtotal: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: "COMPLETED",
        },
        _sum: { grandTotal: true, subtotal: true },
        _count: { id: true },
      }),
      prisma.sale.findMany({
        where: { status: "COMPLETED" },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true, phone: true } },
          cashier: { select: { name: true } },
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
      }),
    ]);

    // 2. Cost of goods sold (COGS) for month to calculate true Gross Profit
    const monthSaleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: { gte: startOfMonth },
          status: "COMPLETED",
        },
      },
      select: {
        quantity: true,
        unitCost: true,
      },
    });

    const monthCogs = monthSaleItems.reduce((acc, item) => {
      return acc + Number(item.quantity) * Number(item.unitCost);
    }, 0);

    const monthRevenue = Number(monthSalesData._sum.grandTotal || 0);
    const grossProfit = monthRevenue - monthCogs;

    // 3. Operating expenses for this month
    const expensesMonth = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });
    const totalExpenses = Number(expensesMonth._sum.amount || 0);
    const netProfit = grossProfit - totalExpenses;

    // 4. Total Purchases
    const purchasesMonth = await prisma.purchase.aggregate({
      where: {
        purchaseDate: { gte: startOfMonth },
        status: "RECEIVED",
      },
      _sum: { grandTotal: true },
    });

    // 5. Inventory Valuation & Stock Alerts
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStockLevel: true,
        buyingCost: true,
        sellingPrice: true,
      },
    });

    let inventoryValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockItems: typeof products = [];

    for (const p of products) {
      const stock = Number(p.stockQuantity);
      const cost = Number(p.buyingCost);
      const minStock = Number(p.minStockLevel);

      if (stock > 0) {
        inventoryValuation += stock * cost;
      }

      if (stock <= 0) {
        outOfStockCount++;
        lowStockItems.push(p);
      } else if (stock <= minStock) {
        lowStockCount++;
        lowStockItems.push(p);
      }
    }

    // 6. Pending Website Orders
    const pendingOrdersCount = await prisma.websiteOrder.count({
      where: { status: "PENDING" },
    });

    // 7. Best selling products (grouped by saleItem quantity)
    const bestSelling = await prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const bestSellingDetailed = await Promise.all(
      bestSelling.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, sellingPrice: true, images: { take: 1 } },
        });
        return {
          product: prod,
          totalQtySold: Number(item._sum.quantity || 0),
          totalRevenue: Number(item._sum.lineTotal || 0),
        };
      })
    );

    return NextResponse.json({
      metrics: {
        todaySales: Number(todaySalesData._sum.grandTotal || 0),
        todayOrdersCount: todaySalesData._count.id,
        monthSales: monthRevenue,
        monthOrdersCount: monthSalesData._count.id,
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        monthPurchases: Number(purchasesMonth._sum.grandTotal || 0),
        inventoryValuation: Math.round(inventoryValuation * 100) / 100,
        lowStockCount,
        outOfStockCount,
        pendingOrdersCount,
      },
      recentSales: allSales,
      lowStockAlerts: lowStockItems.slice(0, 8),
      bestSellers: bestSellingDetailed,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Failed to calculate dashboard statistics" }, { status: 500 });
  }
}

import "dotenv/config";
import { Role, DiscountType, StockMovementType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "Zentravo Luxury Gifts",
      legalName: "Zentravo Boutique Pvt Ltd",
      tagline: "Curated Moments & Exquisite Gifts",
      taxNumber: "TAX-9988231-A",
      address: "108 Lotus Boulevard, Cinnamon Gardens, Colombo 07",
      phone: "+1 (800) 555-4438",
      whatsappNumber: "18005554438",
      email: "concierge@zentravogifts.com",
      openingHours: "Mon - Sun: 9:00 AM - 9:00 PM",
      currencySymbol: "$",
      currencyCode: "USD",
      invoicePrefix: "ZGB-",
      receiptFooterMessage: "Thank you for choosing Zentravo. Every gift tells a timeless story.",
      enableTax: true,
      taxPercentage: 5.0,
      enableVouchers: true,
      defaultLowStockThreshold: 5.0,
    },
  });
  console.log("✓ Settings initialized");

  // 2. Website Content (CMS)
  await prisma.websiteContent.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      heroTitle: "Artisanal Gifts for Life's Cherished Moments",
      heroSubtitle: "Hand-crafted gift hampers, bespoke jewellery, luxury candles, and personalized keepsakes curated with elegance.",
      heroButtonText: "Explore Collections",
      heroButtonLink: "/shop",
      heroImageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1400&auto=format&fit=crop",
      promoBannerActive: true,
      promoBannerText: "Special Offer: Complimentary Luxury Gift Box & Card on orders over $50 | Use Code: GIFT2026",
      promoBannerLink: "/offers",
      aboutUsTitle: "The Art of Thoughtful Gifting",
      aboutUsContent: "At Zentravo, we believe every gift should evoke emotion and wonder. Founded with a passion for exceptional craftsmanship and timeless aesthetics, our collections are carefully curated from master artisans and luxury makers around the world.",
      aboutUsImageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
      deliveryPolicy: "Standard delivery arrives in 2-4 business days. Express same-day courier service is available for orders placed before 1:00 PM.",
      returnPolicy: "We offer a 14-day hassle-free return or exchange policy on non-personalized gift items in original packaging.",
      privacyPolicy: "Your privacy is sacred. We never share your personal information with third parties and ensure bank-grade encryption on all transactions.",
      termsPolicy: "By using our services, you agree to our standard terms and conditions. Promotional codes cannot be combined with clearance pricing.",
      facebookUrl: "https://facebook.com/zentravogifts",
      instagramUrl: "https://instagram.com/zentravogifts",
      tiktokUrl: "https://tiktok.com/@zentravogifts",
      pinterestUrl: "https://pinterest.com/zentravogifts",
    },
  });
  console.log("✓ Website Content initialized");

  // 3. Users with Roles
  const adminPassword = await bcrypt.hash("Admin@123456", 10);
  const cashierPassword = await bcrypt.hash("Cashier@123456", 10);
  const inventoryPassword = await bcrypt.hash("Inventory@123456", 10);
  const accountantPassword = await bcrypt.hash("Accountant@123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@zentravo.com" },
    update: {},
    create: {
      name: "Victoria Sterling (Super Admin)",
      email: "admin@zentravo.com",
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
      phone: "+1 800 555 0100",
    },
  });

  await prisma.user.upsert({
    where: { email: "cashier@zentravo.com" },
    update: {},
    create: {
      name: "Sophia Brooks (Lead Cashier)",
      email: "cashier@zentravo.com",
      passwordHash: cashierPassword,
      role: Role.CASHIER,
      phone: "+1 800 555 0101",
    },
  });

  await prisma.user.upsert({
    where: { email: "inventory@zentravo.com" },
    update: {},
    create: {
      name: "Marcus Vance (Inventory Manager)",
      email: "inventory@zentravo.com",
      passwordHash: inventoryPassword,
      role: Role.INVENTORY_STAFF,
      phone: "+1 800 555 0102",
    },
  });

  await prisma.user.upsert({
    where: { email: "accountant@zentravo.com" },
    update: {},
    create: {
      name: "Eleanor Hayes (Finance Head)",
      email: "accountant@zentravo.com",
      passwordHash: accountantPassword,
      role: Role.ACCOUNTANT,
      phone: "+1 800 555 0103",
    },
  });
  console.log("✓ System users created (admin@zentravo.com / Admin@123456)");

  // 4. Supplier
  await prisma.supplier.upsert({
    where: { id: "supp-aura-01" },
    update: {},
    create: {
      id: "supp-aura-01",
      name: "Aura Artisanal Crafts & Fragrances",
      contactPerson: "Julian Vance",
      email: "supplies@auracrafts.com",
      phone: "+1 888 234 5678",
      address: "42 Foundry Lane, Brooklyn, NY",
      balanceDue: 0,
    },
  });

  await prisma.supplier.upsert({
    where: { id: "supp-valence-02" },
    update: {},
    create: {
      id: "supp-valence-02",
      name: "Valence Fine Chocolatiers & Botanicals",
      contactPerson: "Claire Delacroix",
      email: "orders@valencebotanicals.com",
      phone: "+1 888 876 5432",
      address: "18 Rue de la Paix, Paris / NY Imports",
      balanceDue: 0,
    },
  });
  console.log("✓ Suppliers seeded");

  // 5. Categories
  const categories = [
    {
      id: "cat-hampers",
      name: "Luxury Gift Hampers",
      slug: "luxury-gift-hampers",
      description: "Extravagant gift boxes filled with premium treasures and hand-tied ribbons.",
      imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop",
      displayOrder: 1,
    },
    {
      id: "cat-candles",
      name: "Artisanal Candles & Scents",
      slug: "scented-candles",
      description: "Hand-poured coconut-soy candles infused with botanical essential oils.",
      imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop",
      displayOrder: 2,
    },
    {
      id: "cat-blooms",
      name: "Eternal Preserved Blooms",
      slug: "eternal-blooms",
      description: "Real roses preserved to last up to 3 years in luxury display cases.",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
      displayOrder: 3,
    },
    {
      id: "cat-chocolates",
      name: "Gourmet Chocolates",
      slug: "gourmet-chocolates",
      description: "Single-origin truffles and artisanal confectionery delights.",
      imageUrl: "https://images.unsplash.com/photo-1548741487-18d16a145e80?q=80&w=600&auto=format&fit=crop",
      displayOrder: 4,
    },
    {
      id: "cat-keepsakes",
      name: "Keepsakes & Trinkets",
      slug: "keepsakes-jewellery",
      description: "Timeless mother-of-pearl trays, engraved bookmarks, and jewelry holders.",
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop",
      displayOrder: 5,
    },
    {
      id: "cat-celebration",
      name: "Celebration & Corporate",
      slug: "corporate-gifts",
      description: "Sophisticated gifting for milestones, weddings, anniversaries, and corporate clients.",
      imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop",
      displayOrder: 6,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✓ Categories seeded");

  // 6. Products with Images and Opening Stock Movements
  const products = [
    {
      id: "prod-ham-001",
      name: "Imperial Velvet Keepsake Hamper",
      slug: "imperial-velvet-keepsake-hamper",
      sku: "HAM-001",
      barcode: "8934521001",
      categoryId: "cat-hampers",
      description: "An opulent gift hamper presented in an embossed emerald-velvet keepsake trunk. Includes artisanal honey, gold-dusted chocolate truffles, organic herbal tea, and a hand-carved olive wood spoon.",
      buyingCost: 45.0,
      sellingPrice: 89.0,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.0,
      stockQuantity: 25.0,
      minStockLevel: 5.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-can-002",
      name: "Damask Rose & Oud Soy Candle",
      slug: "damask-rose-oud-soy-candle",
      sku: "CAN-002",
      barcode: "8934521002",
      categoryId: "cat-candles",
      description: "Slow-burning 100% natural soy wax candle featuring heart notes of Taif rose and velvety smoked agarwood. Hand-poured in a matte ceramic fluted vessel.",
      buyingCost: 12.0,
      sellingPrice: 28.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 50.0,
      minStockLevel: 10.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-ros-003",
      name: "Gilded Eternal Rose in Glass Bell",
      slug: "gilded-eternal-rose-glass-bell",
      sku: "ROS-003",
      barcode: "8934521003",
      categoryId: "cat-blooms",
      description: "A genuine natural Ecuadorian rose preserved at peak bloom and accented with 24k gold leaf trim, protected beneath a crystal glass cloche with a solid walnut base.",
      buyingCost: 24.0,
      sellingPrice: 58.0,
      discountType: DiscountType.FIXED,
      discountValue: 5.0,
      stockQuantity: 30.0,
      minStockLevel: 5.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-cho-004",
      name: "Grand Cru Belgian Truffle Assortment",
      slug: "grand-cru-belgian-truffle-assortment",
      sku: "CHO-004",
      barcode: "8934521004",
      categoryId: "cat-chocolates",
      description: "Sixteen hand-crafted ganache spheres featuring sea salt caramel, champagne rose, roasted pistachio, and Madagascar bourbon vanilla.",
      buyingCost: 14.5,
      sellingPrice: 34.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 40.0,
      minStockLevel: 8.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1548741487-18d16a145e80?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-dec-005",
      name: "Mother of Pearl Trinket Tray",
      slug: "mother-of-pearl-trinket-tray",
      sku: "DEC-005",
      barcode: "8934521005",
      categoryId: "cat-keepsakes",
      description: "Handcrafted mosaic tray inlaid with shimmering natural iridescent mother-of-pearl shells and brushed brass edging. Perfect for rings, watches, or dresser styling.",
      buyingCost: 18.0,
      sellingPrice: 42.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 20.0,
      minStockLevel: 4.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-box-006",
      name: "Opulent Celebrations Gift Box",
      slug: "opulent-celebrations-gift-box",
      sku: "BOX-006",
      barcode: "8934521006",
      categoryId: "cat-celebration",
      description: "Our signature multi-tiered luxury gift presentation containing sparkling cider, artisanal gold crystal stem flutes, handcrafted scented diffuser, and lavender macaroons.",
      buyingCost: 55.0,
      sellingPrice: 115.0,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15.0,
      stockQuantity: 15.0,
      minStockLevel: 3.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-spa-007",
      name: "Lavender Mist Botanical Spa Set",
      slug: "lavender-mist-botanical-spa-set",
      sku: "SPA-007",
      barcode: "8934521007",
      categoryId: "cat-hampers",
      description: "Relaxation ritual hamper with French lavender bath salts, organic body butter, natural loofah, and a soothing silk eye mask.",
      buyingCost: 20.0,
      sellingPrice: 48.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 35.0,
      minStockLevel: 5.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-bkm-008",
      name: "Vintage Brass Monogram Bookmark",
      slug: "vintage-brass-monogram-bookmark",
      sku: "BKM-008",
      barcode: "8934521008",
      categoryId: "cat-keepsakes",
      description: "Solid forged brass page marker with delicate filigree lattice work and a genuine silk tassel. An enduring gift for literary connoisseurs.",
      buyingCost: 6.0,
      sellingPrice: 16.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 60.0,
      minStockLevel: 10.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
    },
  ];

  for (const p of products) {
    const { imageUrl, ...productData } = p;
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          ...productData,
          images: {
            create: {
              url: imageUrl,
              isPrimary: true,
              displayOrder: 1,
            },
          },
        },
      });

      // Create opening stock inventory movement
      await prisma.inventoryMovement.create({
        data: {
          productId: created.id,
          movementType: StockMovementType.OPENING_STOCK,
          quantityChange: p.stockQuantity,
          previousStock: 0,
          newStock: p.stockQuantity,
          unitCost: p.buyingCost,
          referenceDocument: "INIT-OPENING-STOCK",
          notes: "Initial inventory setup on system deployment",
          createdById: admin.id,
        },
      });
    }
  }
  console.log("✓ Products and opening inventory movements seeded");

  // 7. Discount Coupons
  await prisma.discountCoupon.upsert({
    where: { code: "GIFT2026" },
    update: {},
    create: {
      code: "GIFT2026",
      description: "10% off your entire order with minimum $40 spend",
      discountType: DiscountType.PERCENTAGE,
      value: 10.0,
      minPurchase: 40.0,
      maxDiscount: 50.0,
      isActive: true,
    },
  });

  await prisma.discountCoupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      description: "$20 off on luxury purchases above $100",
      discountType: DiscountType.FIXED,
      value: 20.0,
      minPurchase: 100.0,
      isActive: true,
    },
  });
  console.log("✓ Coupons seeded (GIFT2026, WELCOME20)");

  // 8. Sample Customer
  await prisma.customer.upsert({
    where: { id: "cust-sample-01" },
    update: {},
    create: {
      id: "cust-sample-01",
      name: "Lady Catherine de Bourgh",
      email: "catherine.bourgh@highlandestates.com",
      phone: "+1 415 555 7788",
      address: "Rosings Park Manor, 77 Crestview Terrace",
      city: "San Francisco",
      postalCode: "94108",
      loyaltyPoints: 120,
    },
  });
  console.log("✓ Sample customer seeded");

  console.log("✨ All seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

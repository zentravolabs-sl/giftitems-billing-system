import "dotenv/config";
import { Role, DiscountType, StockMovementType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {
      shopName: "Oak Bloom",
      legalName: "Oak Bloom Living Pvt Ltd",
      tagline: "LIGHTS | FLOWERS | HOME DÉCOR",
      email: "hello@oakbloomdecor.com",
      receiptFooterMessage: "Glow Naturally, Bloom Beautifully. Thank you for supporting handmade & local ♥",
    },
    create: {
      id: "default",
      shopName: "Oak Bloom",
      legalName: "Oak Bloom Living Pvt Ltd",
      tagline: "LIGHTS | FLOWERS | HOME DÉCOR",
      taxNumber: "TAX-9988231-A",
      address: "108 Lotus Boulevard, Cinnamon Gardens, Colombo 07",
      phone: "+1 (800) 555-4438",
      whatsappNumber: "18005554438",
      email: "hello@oakbloomdecor.com",
      openingHours: "Mon - Sun: 9:00 AM - 9:00 PM",
      currencySymbol: "Rs.",
      currencyCode: "LKR",
      invoicePrefix: "OBG-",
      receiptFooterMessage: "Glow Naturally, Bloom Beautifully. Thank you for supporting handmade & local ♥",
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
    update: {
      heroTitle: "Handcrafted Wooden Lights, Artificial Flowers & Home Décor",
      heroSubtitle: "Oak Bloom is a thoughtfully curated collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces – designed to bring warmth, beauty, and timeless charm into your space.",
      aboutUsTitle: "What is OAK BLOOM?",
      aboutUsContent: "Oak Bloom is a thoughtfully curated collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces – designed to bring warmth, beauty, and timeless charm into your space.\n\nFrom warm ambient wooden pendants sculpted from natural timber to realistic botanical florals that bloom perpetually without maintenance, every piece is created with love for handmade craft and timeless interiors.\n\nGlow Naturally, Bloom Beautifully. ♡",
      aboutUsImageUrl: "/about-oak-bloom.jpg",
      facebookUrl: "https://facebook.com/oakbloomdecor",
      instagramUrl: "https://instagram.com/oakbloomdecor",
      tiktokUrl: "https://tiktok.com/@oakbloomdecor",
      pinterestUrl: "https://pinterest.com/oakbloomdecor",
    },
    create: {
      id: "default",
      heroTitle: "Handcrafted Wooden Lights, Artificial Flowers & Home Décor",
      heroSubtitle: "Oak Bloom is a thoughtfully curated collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces – designed to bring warmth, beauty, and timeless charm into your space.",
      heroButtonText: "Explore Collections",
      heroButtonLink: "/shop",
      heroImageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=1400&auto=format&fit=crop",
      promoBannerActive: true,
      promoBannerText: "✨ Glow Naturally, Bloom Beautifully • Free shipping on orders over Rs. 60 | Use Code: BLOOM10",
      promoBannerLink: "/offers",
      aboutUsTitle: "What is OAK BLOOM?",
      aboutUsContent: "Oak Bloom is a thoughtfully curated collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces – designed to bring warmth, beauty, and timeless charm into your space.\n\nFrom warm ambient wooden pendants sculpted from natural timber to realistic botanical florals that bloom perpetually without maintenance, every piece is created with love for handmade craft and timeless interiors.\n\nGlow Naturally, Bloom Beautifully. ♡",
      aboutUsImageUrl: "/about-oak-bloom.jpg",
      deliveryPolicy: "Standard courier delivery arrives in 2-4 business days. Fragile lighting and ceramic floral vessels are custom packed in protective, eco-friendly cushioning.",
      returnPolicy: "We offer a 14-day hassle-free return or exchange policy on all home décor and lighting items in original packaging.",
      privacyPolicy: "Your privacy is sacred. We never share your personal information with third parties and ensure bank-grade encryption on all transactions.",
      termsPolicy: "By using our services, you agree to our standard terms and conditions. Promotional codes cannot be combined with clearance pricing.",
      facebookUrl: "https://facebook.com/oakbloomdecor",
      instagramUrl: "https://instagram.com/oakbloomdecor",
      tiktokUrl: "https://tiktok.com/@oakbloomdecor",
      pinterestUrl: "https://pinterest.com/oakbloomdecor",
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
      name: "Handcrafted Wooden Lights",
      slug: "wooden-lights",
      description: "Artisan slatted timber pendant lights, organic teardrop chandeliers, and warm ambient lamps.",
      imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop",
      displayOrder: 1,
    },
    {
      id: "cat-blooms",
      name: "Artificial Flowers & Arrangements",
      slug: "artificial-flowers",
      description: "Earthy botanical faux floral arrangements, dahlias, roses, and eucalyptus in ceramic vases.",
      imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop",
      displayOrder: 2,
    },
    {
      id: "cat-keepsakes",
      name: "Artisanal Home Décor",
      slug: "home-decor",
      description: "Round oak mirrors, rustic ceramic vessels, and tabletop accents that elevate your space.",
      imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
      displayOrder: 3,
    },
    {
      id: "cat-candles",
      name: "Lanterns & Ambient Lighting",
      slug: "lanterns-ambient-lighting",
      description: "Handcrafted wooden candle lanterns, timber votives, and warm ambient home accents.",
      imageUrl: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=800&auto=format&fit=crop",
      displayOrder: 4,
    },
    {
      id: "cat-celebration",
      name: "Wooden Boards & Tableware",
      slug: "boards-tableware",
      description: "Hand-carved oak bread boards, charcuterie serving platters, and organic kitchen accents.",
      imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=800&auto=format&fit=crop",
      displayOrder: 5,
    },
    {
      id: "cat-chocolates",
      name: "Mirrors & Wall Accents",
      slug: "mirrors-wall-accents",
      description: "Minimalist round oak-framed wall mirrors and artisan hanging décor.",
      imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop",
      displayOrder: 6,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log("✓ Categories seeded");

  // 6. Products with Images and Opening Stock Movements
  const products = [
    {
      id: "prod-ham-001",
      name: "Curved Oak Slatted Pendant Lamp",
      slug: "curved-oak-slatted-pendant-lamp",
      sku: "HAM-001",
      barcode: "8934521001",
      categoryId: "cat-hampers",
      description: "As featured in our signature Oak Bloom collection. Handcrafted from sustainably harvested oak with curved timber ribs that cast a warm, ambient architectural glow.",
      buyingCost: 55.0,
      sellingPrice: 129.0,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.0,
      stockQuantity: 25.0,
      minStockLevel: 5.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-can-002",
      name: "Carved Timber Pillar Candle Lantern",
      slug: "carved-timber-pillar-candle-lantern",
      sku: "CAN-002",
      barcode: "8934521002",
      categoryId: "cat-candles",
      description: "Handcrafted rustic wooden lantern featuring detailed lattice cutout panels that disperse a gentle, comforting candlelight glow across your room.",
      buyingCost: 22.0,
      sellingPrice: 58.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 50.0,
      minStockLevel: 10.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-ros-003",
      name: "Autumn Bloom Dahlia & Rose Ceramic Floral Arrangement",
      slug: "autumn-bloom-dahlia-rose-arrangement",
      sku: "ROS-003",
      barcode: "8934521003",
      categoryId: "cat-blooms",
      description: "Artfully arranged artificial dahlias, vintage roses, and botanical eucalyptus in an earthy glazed ceramic pot. Delivers everlasting natural charm without wilting.",
      buyingCost: 28.0,
      sellingPrice: 68.0,
      discountType: DiscountType.FIXED,
      discountValue: 5.0,
      stockQuantity: 30.0,
      minStockLevel: 5.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-cho-004",
      name: "Minimalist Round Oak Frame Wall Mirror",
      slug: "minimalist-round-oak-wall-mirror",
      sku: "CHO-004",
      barcode: "8934521004",
      categoryId: "cat-chocolates",
      description: "Solid steam-bent oak circular mirror designed to reflect natural sunlight and bring warmth, balance, and organic elegance to any entryway or living room.",
      buyingCost: 35.0,
      sellingPrice: 85.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 40.0,
      minStockLevel: 8.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-dec-005",
      name: "Handcrafted Natural Oak Pedestal Tray",
      slug: "handcrafted-natural-oak-pedestal-tray",
      sku: "DEC-005",
      barcode: "8934521005",
      categoryId: "cat-keepsakes",
      description: "Sculpted from solid natural oak, this tabletop pedestal tray is designed to style small ceramics, pillar candles, or cherished personal items.",
      buyingCost: 15.0,
      sellingPrice: 38.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 20.0,
      minStockLevel: 4.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-box-006",
      name: "Solid Carved Oak Cutting & Serving Board",
      slug: "solid-carved-oak-cutting-serving-board",
      sku: "BOX-006",
      barcode: "8934521006",
      categoryId: "cat-celebration",
      description: "Handcrafted artisan kitchen essential carved with handle hole and smooth organic bevels. Finished with food-safe botanical oils.",
      buyingCost: 24.0,
      sellingPrice: 52.0,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15.0,
      stockQuantity: 15.0,
      minStockLevel: 3.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-spa-007",
      name: "Everlasting Preserved Eucalyptus & Wildflower Vase",
      slug: "everlasting-preserved-eucalyptus-wildflower-vase",
      sku: "SPA-007",
      barcode: "8934521007",
      categoryId: "cat-hampers",
      description: "Earthy textured ceramic vase filled with preserved botanicals, seed pods, and faux wild roses for an authentic rustic charm.",
      buyingCost: 20.0,
      sellingPrice: 48.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 35.0,
      minStockLevel: 5.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "prod-bkm-008",
      name: "Teardrop Ribbed Wooden Chandelier",
      slug: "teardrop-ribbed-wooden-chandelier",
      sku: "BKM-008",
      barcode: "8934521008",
      categoryId: "cat-keepsakes",
      description: "An organic teardrop silhouette created with laser-cut natural birch and oak slats. Creates breathtaking ambient shadows and architectural warmth.",
      buyingCost: 60.0,
      sellingPrice: 145.0,
      discountType: DiscountType.NONE,
      discountValue: 0.0,
      stockQuantity: 60.0,
      minStockLevel: 10.0,
      isFeatured: false,
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
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

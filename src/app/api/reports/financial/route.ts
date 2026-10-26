import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, [Role.ADMIN, Role.ACCOUNTANT])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month"; // "today", "week", "month", "all"

    const now = new Date();
    let startDate: Date;

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(2020, 0, 1);
    }

    // 1. Sales query
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "COMPLETED",
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
        payments: true,
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Aggregate sales
    let totalGrossSales = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    let totalNetSales = 0;
    let totalCOGS = 0;

    const channelBreakdown = { POS: 0, WEBSITE: 0 };
    const paymentBreakdown: Record<string, number> = {};
    const productSalesMap: Record<string, { name: string; sku: string; qty: number; revenue: number; cogs: number }> = {};
    const categorySalesMap: Record<string, { name: string; revenue: number }> = {};
    const cashierSalesMap: Record<string, { name: string; billsCount: number; revenue: number }> = {};

    for (const s of sales) {
      const gTotal = Number(s.grandTotal);
      const sTotal = Number(s.subtotal);
      const disc = Number(s.cartDiscount);
      const tax = Number(s.taxAmount);

      totalGrossSales += sTotal;
      totalDiscounts += disc;
      totalTax += tax;
      totalNetSales += gTotal;

      // Channel breakdown
      channelBreakdown[s.channel] = (channelBreakdown[s.channel] || 0) + gTotal;

      // Cashier breakdown
      const cashierName = s.cashier?.name || "Online System";
      if (!cashierSalesMap[cashierName]) {
        cashierSalesMap[cashierName] = { name: cashierName, billsCount: 0, revenue: 0 };
      }
      cashierSalesMap[cashierName].billsCount += 1;
      cashierSalesMap[cashierName].revenue += gTotal;

      // Payments breakdown
      for (const p of s.payments) {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + Number(p.amount);
      }

      // Line items COGS and Product/Category breakdown
      for (const it of s.items) {
        const qty = Number(it.quantity);
        const uCost = Number(it.unitCost || it.product.buyingCost || 0);
        const lTotal = Number(it.lineTotal);
        const itemCogs = qty * uCost;

        totalCOGS += itemCogs;

        // Product map
        const pId = it.productId;
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            name: it.product.name,
            sku: it.product.sku,
            qty: 0,
            revenue: 0,
            cogs: 0,
          };
        }
        productSalesMap[pId].qty += qty;
        productSalesMap[pId].revenue += lTotal;
        productSalesMap[pId].cogs += itemCogs;

        // Category map
        const catName = it.product.category?.name || "Uncategorized";
        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = { name: catName, revenue: 0 };
        }
        categorySalesMap[catName].revenue += lTotal;
      }
    }

    const grossProfit = totalNetSales - totalCOGS;

    // 3. Operating expenses in date range
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: startDate },
      },
    });
    const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
    const netProfit = grossProfit - totalExpenses;

    // 4. Returns & Refunds
    const returns = await prisma.return.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "APPROVED",
      },
    });
    const totalReturnsRefunded = returns.reduce((acc, r) => acc + Number(r.totalRefundAmount), 0);

    // 5. Purchases in date range
    const purchases = await prisma.purchase.findMany({
      where: {
        purchaseDate: { gte: startDate },
        status: "RECEIVED",
      },
      include: { supplier: true },
    });
    const totalPurchasesCost = purchases.reduce((acc, p) => acc + Number(p.grandTotal), 0);

    const averageBillValue = sales.length > 0 ? totalNetSales / sales.length : 0;

    return NextResponse.json({
      summary: {
        totalGrossSales: Math.round(totalGrossSales * 100) / 100,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalNetSales: Math.round(totalNetSales * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        invoicesCount: sales.length,
        averageBillValue: Math.round(averageBillValue * 100) / 100,
        totalPurchasesCost: Math.round(totalPurchasesCost * 100) / 100,
        totalReturnsRefunded: Math.round(totalReturnsRefunded * 100) / 100,
      },
      channelBreakdown,
      paymentBreakdown,
      productSales: Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue),
      categorySales: Object.values(categorySalesMap).sort((a, b) => b.revenue - a.revenue),
      cashierSales: Object.values(cashierSalesMap).sort((a, b) => b.revenue - a.revenue),
      salesList: sales,
    });
  } catch (error) {
    console.error("Financial reports error:", error);
    return NextResponse.json({ error: "Failed to generate financial reports" }, { status: 500 });
  }
}

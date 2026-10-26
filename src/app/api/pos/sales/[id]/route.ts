import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        cashier: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: { take: 1 } },
            },
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const settings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({ sale, settings });
  } catch (error) {
    console.error("Sale detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sale" }, { status: 500 });
  }
}

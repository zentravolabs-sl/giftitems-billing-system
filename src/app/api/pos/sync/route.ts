import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StockMovementType, SaleChannel, PaymentMethod, PaymentStatus, SaleStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { sales, clientId } = body as { sales: any[]; clientId?: string };

    if (!Array.isArray(sales) || sales.length === 0) {
      return NextResponse.json({ message: "No sales to sync", syncedCount: 0 });
    }

    const results: Array<{
      id: string;
      invoiceNumber: string;
      status: "SYNCED" | "DUPLICATE" | "FAILED";
      error?: string;
    }> = [];

    const settings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });

    for (const offlineSale of sales) {
      try {
        // 1. Idempotency check: see if syncId already processed
        const existing = await prisma.sale.findUnique({
          where: { syncId: offlineSale.id },
        });

        if (existing) {
          results.push({
            id: offlineSale.id,
            invoiceNumber: existing.invoiceNumber,
            status: "DUPLICATE",
          });
          continue;
        }

        // 2. Transact the sale into PostgreSQL
        await prisma.$transaction(async (tx) => {
          const created = await tx.sale.create({
            data: {
              invoiceNumber: offlineSale.invoiceNumber,
              channel: SaleChannel.POS,
              customerId: offlineSale.customerId || null,
              cashierId: user?.userId || null,
              status: SaleStatus.COMPLETED,
              subtotal: offlineSale.subtotal,
              cartDiscount: offlineSale.cartDiscount,
              taxAmount: offlineSale.taxAmount,
              grandTotal: offlineSale.grandTotal,
              paidAmount: offlineSale.amountPaid,
              changeAmount: offlineSale.changeAmount,
              notes: offlineSale.notes ? `${offlineSale.notes} (Synced from offline POS)` : "Synced from offline POS",
              syncId: offlineSale.id,
              isOfflineSynced: true,
              createdAt: new Date(offlineSale.createdAt),
              items: {
                create: offlineSale.items.map((it: any) => ({
                  productId: it.productId,
                  quantity: it.quantity,
                  unitCost: 0, // Snapshot
                  unitPrice: it.unitPrice,
                  lineDiscount: it.lineDiscount || 0,
                  lineTotal: it.lineTotal,
                })),
              },
              payments: {
                create: offlineSale.payments.map((p: any) => ({
                  method: p.method as PaymentMethod,
                  amount: p.amount,
                  status: PaymentStatus.CONFIRMED,
                  cardLast4: p.cardLast4 || null,
                  cardTerminalRef: p.cardTerminalRef || null,
                })),
              },
            },
          });

          // Stock update and ledger recording
          for (const it of offlineSale.items) {
            const product = await tx.product.findUnique({
              where: { id: it.productId },
            });

            if (product) {
              const currentStock = Number(product.stockQuantity);
              const newStock = currentStock - it.quantity;

              await tx.product.update({
                where: { id: it.productId },
                data: { stockQuantity: newStock },
              });

              await tx.inventoryMovement.create({
                data: {
                  productId: it.productId,
                  movementType: StockMovementType.POS_SALE,
                  quantityChange: -it.quantity,
                  previousStock: currentStock,
                  newStock,
                  unitCost: product.buyingCost,
                  referenceDocument: offlineSale.invoiceNumber,
                  notes: "Offline queue sync",
                  createdById: user?.userId || null,
                  createdAt: new Date(offlineSale.createdAt),
                },
              });
            }
          }

          // Record SyncLog
          await tx.syncLog.create({
            data: {
              clientId: clientId || "pos-terminal-1",
              transactionId: offlineSale.id,
              action: "OFFLINE_SALE_SYNC",
              status: "SUCCESS",
              payload: JSON.stringify({
                invoiceNumber: offlineSale.invoiceNumber,
                grandTotal: offlineSale.grandTotal,
              }),
            },
          });
        });

        results.push({
          id: offlineSale.id,
          invoiceNumber: offlineSale.invoiceNumber,
          status: "SYNCED",
        });
      } catch (err: any) {
        console.error(`Sync error on sale ${offlineSale.id}:`, err);
        results.push({
          id: offlineSale.id,
          invoiceNumber: offlineSale.invoiceNumber,
          status: "FAILED",
          error: err.message || "Sync failure",
        });

        await prisma.syncLog.create({
          data: {
            clientId: clientId || "pos-terminal-1",
            transactionId: offlineSale.id,
            action: "OFFLINE_SALE_SYNC",
            status: "FAILED",
            errorMessage: err.message,
          },
        });
      }
    }

    const syncedCount = results.filter((r) => r.status === "SYNCED" || r.status === "DUPLICATE").length;
    return NextResponse.json({ success: true, syncedCount, results });
  } catch (error) {
    console.error("Batch sync error:", error);
    return NextResponse.json({ error: "Failed to execute sync batch" }, { status: 500 });
  }
}

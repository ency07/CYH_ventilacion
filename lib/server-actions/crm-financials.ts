"use server";

import { db } from "@/lib/db";
import { crmInvoices, crmPayments, crmAccountsReceivable, crmCustomers, crmUsers } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/permissions";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Retrieves all accounts receivable (CxC) records for the CRM.
 */
export async function getAccountsReceivableAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      outstandingBalance: number;
      daysPastDue: number;
      collectionStatus: string;
      customerName: string;
      customerNit: string | null;
      invoiceNumber: string;
      invoiceAmount: number;
      invoiceDueDate: Date;
    }>
  >
> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial", "comercial"]);

    const results = await db
      .select({
        id: crmAccountsReceivable.id,
        outstandingBalance: crmAccountsReceivable.outstandingBalance,
        daysPastDue: crmAccountsReceivable.daysPastDue,
        collectionStatus: crmAccountsReceivable.collectionStatus,
        customerName: crmCustomers.name,
        customerNit: crmCustomers.nit,
        invoiceNumber: crmInvoices.invoiceNumber,
        invoiceAmount: crmInvoices.amount,
        invoiceDueDate: crmInvoices.dueDate,
      })
      .from(crmAccountsReceivable)
      .innerJoin(crmCustomers, eq(crmAccountsReceivable.customerId, crmCustomers.id))
      .innerJoin(crmInvoices, eq(crmAccountsReceivable.invoiceId, crmInvoices.id))
      .orderBy(desc(crmAccountsReceivable.daysPastDue));

    return { success: true, data: results };
  } catch (error: any) {
    console.error("Error fetching accounts receivable:", error);
    return { success: false, error: error.message || "Error al obtener CxC." };
  }
}

/**
 * Retrieves payment collections (recaudos) records.
 */
export async function getRecaudosAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      transactionId: string | null;
      createdAt: Date;
      invoiceNumber: string;
      customerName: string;
    }>
  >
> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial", "comercial"]);

    const results = await db
      .select({
        id: crmPayments.id,
        amount: crmPayments.amount,
        paymentMethod: crmPayments.paymentMethod,
        transactionId: crmPayments.transactionId,
        createdAt: crmPayments.createdAt,
        invoiceNumber: crmInvoices.invoiceNumber,
        customerName: crmCustomers.name,
      })
      .from(crmPayments)
      .innerJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id))
      .innerJoin(crmCustomers, eq(crmInvoices.customerId, crmCustomers.id))
      .orderBy(desc(crmPayments.createdAt));

    return { success: true, data: results };
  } catch (error: any) {
    console.error("Error fetching collections:", error);
    return { success: false, error: error.message || "Error al obtener recaudos." };
  }
}

/**
 * Retrieves ledger balance entries representing debits (invoices generated)
 * and credits (payments processed).
 */
export async function getLedgerAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      date: Date;
      description: string;
      type: "debit" | "credit";
      amount: number;
      reference: string;
    }>
  >
> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial", "comercial"]);

    const invoices = await db
      .select({
        id: crmInvoices.id,
        date: crmInvoices.createdAt,
        invoiceNumber: crmInvoices.invoiceNumber,
        amount: crmInvoices.amount,
        customerName: crmCustomers.name,
      })
      .from(crmInvoices)
      .innerJoin(crmCustomers, eq(crmInvoices.customerId, crmCustomers.id));

    const payments = await db
      .select({
        id: crmPayments.id,
        date: crmPayments.createdAt,
        transactionId: crmPayments.transactionId,
        amount: crmPayments.amount,
        invoiceNumber: crmInvoices.invoiceNumber,
      })
      .from(crmPayments)
      .innerJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id));

    const entries: Array<{
      id: string;
      date: Date;
      description: string;
      type: "debit" | "credit";
      amount: number;
      reference: string;
    }> = [];

    // Invoices generate Debits (CxC increases)
    for (const inv of invoices) {
      entries.push({
        id: inv.id,
        date: inv.date,
        description: `Facturación Emitida - Cliente: ${inv.customerName}`,
        type: "debit",
        amount: inv.amount,
        reference: inv.invoiceNumber,
      });
    }

    // Payments generate Credits (Cash increases / CxC decreases)
    for (const pay of payments) {
      entries.push({
        id: pay.id,
        date: pay.date,
        description: `Recaudo de Factura #${pay.invoiceNumber}`,
        type: "credit",
        amount: pay.amount,
        reference: pay.transactionId || "N/A",
      });
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { success: true, data: entries };
  } catch (error: any) {
    console.error("Error fetching general ledger:", error);
    return { success: false, error: error.message || "Error al obtener Ledger." };
  }
}

/**
 * Returns Gateway vs. Bank reconciliation discrepancies.
 */
export async function getReconciliationAction(): Promise<
  ActionResult<{
    reconciledCount: number;
    pendingCount: number;
    discrepancyCount: number;
    transactions: Array<{
      id: string;
      gatewayTxId: string;
      invoiceNumber: string;
      amount: number;
      gatewayStatus: string;
      bankStatus: "matched" | "unmatched" | "discrepancy";
      date: Date;
    }>;
  }>
> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial", "comercial"]);

    const payments = await db
      .select({
        id: crmPayments.id,
        transactionId: crmPayments.transactionId,
        amount: crmPayments.amount,
        createdAt: crmPayments.createdAt,
        invoiceNumber: crmInvoices.invoiceNumber,
      })
      .from(crmPayments)
      .innerJoin(crmInvoices, eq(crmPayments.invoiceId, crmInvoices.id))
      .limit(20);

    // Construct bank/gateway reconciliation comparison list
    const transactions = payments.map((p, i) => {
      const isReconciled = i % 5 !== 0; // Simulate 1 unmatched transaction out of 5
      return {
        id: p.id,
        gatewayTxId: p.transactionId || `TX-MOCK-${i}`,
        invoiceNumber: p.invoiceNumber,
        amount: p.amount,
        gatewayStatus: "approved",
        bankStatus: (isReconciled ? "matched" : "unmatched") as "matched" | "unmatched" | "discrepancy",
        date: p.createdAt,
      };
    });

    const reconciledCount = transactions.filter(t => t.bankStatus === "matched").length;
    const pendingCount = transactions.filter(t => t.bankStatus === "unmatched").length;

    return {
      success: true,
      data: {
        reconciledCount,
        pendingCount,
        discrepancyCount: 0,
        transactions,
      },
    };
  } catch (error: any) {
    console.error("Error fetching reconciliation:", error);
    return { success: false, error: error.message || "Error al obtener conciliación." };
  }
}

/**
 * Exports financial ledger statements (mock download).
 */
export async function exportFinancialsAction(
  format: "csv" | "excel" | "pdf",
  filters: any
): Promise<ActionResult<{ fileUrl: string; fileName: string }>> {
  try {
    await requireRole(["admin", "super_admin", "director_comercial", "comercial"]);

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `VentiTech-Finanzas-Reporte-${timestamp}.${format}`;
    const fileUrl = `/temp/exports/${fileName}`; // Mocked download endpoint

    return { success: true, data: { fileUrl, fileName } };
  } catch (error: any) {
    console.error("Error exporting financials:", error);
    return { success: false, error: error.message || "Error al exportar finanzas." };
  }
}

"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import InvoiceListComponent from "@/components/invoice/InvoiceListComponent";
import { loadRecentInvoices, searchInvoices } from "@/lib/firestore/invoices";

export default function InvoicesPage() {
  return (
    <PermissionGate module="billing">
      <div className="flex justify-end px-4 pt-4">
        <a href="/dashboard/invoices/new" className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">
          + New Invoice
        </a>
      </div>
      <InvoiceListComponent onLoadRecentInvoices={loadRecentInvoices} onSearchInvoices={searchInvoices} />
    </PermissionGate>
  );
}
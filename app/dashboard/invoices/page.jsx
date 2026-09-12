"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import InvoiceListComponent from "@/components/invoice/InvoiceListComponent";
import { loadRecentInvoices, searchInvoices, updateInvoice } from "@/lib/firestore/invoices";

export default function InvoicesPage() {
  return (
    <PermissionGate module="billing">
      <InvoiceListComponent 
        onLoadRecentInvoices={loadRecentInvoices} 
        onSearchInvoices={searchInvoices} 
        onUpdateInvoice={updateInvoice} 
      />
    </PermissionGate>
  );
}

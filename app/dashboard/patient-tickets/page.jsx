"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import PatientBillingListComponent from "@/components/patient-billing/PatientBillingListComponent";
import { loadRecentTickets, searchTickets, loadTicketsPage } from "@/lib/firestore/tickets";

export default function PatientTicketsPage() {
  return (
    <PermissionGate module="billing">
      <PatientBillingListComponent 
        onLoadTicketsPage={loadTicketsPage}
        onLoadRecentTickets={loadRecentTickets} 
        onSearchTickets={searchTickets} 
      />
    </PermissionGate>
  );
}

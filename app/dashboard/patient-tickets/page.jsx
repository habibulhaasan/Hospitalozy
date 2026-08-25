"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import PatientBillingListComponent from "@/components/patient-billing/PatientBillingListComponent";
import { loadRecentTickets, searchTickets } from "@/lib/firestore/tickets";

export default function PatientTicketsPage() {
  return (
    <PermissionGate module="billing">
      <div className="flex justify-end px-4 pt-4">
        <a href="/dashboard/patient-tickets/new" className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">
          + New Ticket
        </a>
      </div>
      <PatientBillingListComponent onLoadRecentTickets={loadRecentTickets} onSearchTickets={searchTickets} />
    </PermissionGate>
  );
}
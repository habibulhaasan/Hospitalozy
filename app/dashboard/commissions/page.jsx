"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import CommissionComponent from "@/components/commission/CommissionComponent";
import { loadActiveAgents } from "@/lib/firestore/agents";
import { loadCommissions, updateInvoiceCommission } from "@/lib/firestore/invoices";

export default function CommissionsPage() {
  return (
    <PermissionGate module="billing">
      <CommissionComponent
        onLoadAgents={loadActiveAgents}
        onLoadCommissions={loadCommissions}
        onUpdateCommission={updateInvoiceCommission}
      />
    </PermissionGate>
  );
}


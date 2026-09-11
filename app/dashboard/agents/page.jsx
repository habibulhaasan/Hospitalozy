"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import AgentComponent from "@/components/agent/AgentComponent";
import { loadAgentRecords, saveAgent, deleteAgent } from "@/lib/firestore/agents";

export default function AgentsPage() {
  return (
    <PermissionGate module="billing">
      <AgentComponent
        onLoadAgents={loadAgentRecords}
        onSaveAgent={saveAgent}
        onDeleteAgent={deleteAgent}
      />
    </PermissionGate>
  );
}


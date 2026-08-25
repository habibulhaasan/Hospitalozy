"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import TestMasterComponent from "@/components/test-master/TestMasterComponent";
import { loadTests, saveTest, deleteTest } from "@/lib/firestore/tests";

export default function TestMasterPage() {
  return (
    <PermissionGate module="testMaster">
      <TestMasterComponent onLoadTests={loadTests} onSaveTest={saveTest} onDeleteTest={deleteTest} />
    </PermissionGate>
  );
}

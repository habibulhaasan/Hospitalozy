"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import SettingsComponent from "@/components/settings/SettingsComponent";
import { loadAppConfig, saveAppConfig } from "@/lib/firestore/settings";

export default function SettingsPage() {
  return (
    <PermissionGate module="settings">
      <SettingsComponent 
        onLoadAppConfig={loadAppConfig}
        onSaveAppConfig={saveAppConfig}
      />
    </PermissionGate>
  );
}


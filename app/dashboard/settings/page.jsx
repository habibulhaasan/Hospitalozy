"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import SettingsComponent from "@/components/settings/SettingsComponent";

export default function SettingsPage() {
  return (
    <PermissionGate module="settings">
      <SettingsComponent />
    </PermissionGate>
  );
}


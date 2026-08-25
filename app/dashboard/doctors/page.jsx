"use client";

/**
 * app/dashboard/doctors/page.jsx
 * ------------------------------------------------------------------
 * The full pattern in one short file: gate by permission, wire the
 * component's props straight to lib/firestore functions. Every other
 * feature page in this app follows this exact same shape.
 * ------------------------------------------------------------------ */
import PermissionGate from "@/components/shared/PermissionGate";
import DoctorComponent from "@/components/doctor/DoctorComponent";
import { loadDoctorRecords, saveDoctor, deleteDoctor } from "@/lib/firestore/doctors";

export default function DoctorsPage() {
  return (
    <PermissionGate module="doctors">
      <DoctorComponent
        onLoadDoctors={loadDoctorRecords}
        onSaveDoctor={saveDoctor}
        onDeleteDoctor={deleteDoctor}
      />
    </PermissionGate>
  );
}

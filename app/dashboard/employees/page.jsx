"use client";

import PermissionGate from "@/components/shared/PermissionGate";
import EmployeeComponent from "@/components/employee/EmployeeComponent";
import { loadEmployees, saveEmployee, deleteEmployee, createEmployeeAccount, sendEmployeePasswordResetEmail, setEmployeeTemporaryPassword, setEmployeeAccountDisabled, loadEmployeesPage } from "@/lib/firestore/employees";

export default function EmployeesPage() {
  return (
    <PermissionGate module="employees">
      <EmployeeComponent
        onLoadEmployeesPage={loadEmployeesPage}
        onLoadEmployees={loadEmployees}
        onSaveEmployee={saveEmployee}
        onDeleteEmployee={deleteEmployee}
        onCreateEmployeeAccount={createEmployeeAccount}
        onSendPasswordResetEmail={sendEmployeePasswordResetEmail}
        onSetTemporaryPassword={setEmployeeTemporaryPassword}
        onSetAccountDisabled={setEmployeeAccountDisabled}
      />
    </PermissionGate>
  );
}

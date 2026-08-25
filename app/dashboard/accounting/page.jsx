"use client";

import { useEffect, useState } from "react";
import PermissionGate from "@/components/shared/PermissionGate";
import AccountingComponent from "@/components/accounting/AccountingComponent";
import { searchInvoices } from "@/lib/firestore/invoices";
import { loadActiveDoctorNames } from "@/lib/firestore/doctors";
import { loadTests, buildCategoryLookup } from "@/lib/firestore/tests";

export default function AccountingPage() {
  // getCategoryForTestName needs to be a synchronous function, but
  // building it requires an async Firestore read — so that read
  // happens once here, on mount, and the resulting lookup function is
  // what gets passed down. Until it's loaded, category defaults to
  // "Uncategorized" (AccountingComponent's own default), which is why
  // the Revenue-by-Category chart just doesn't appear for a moment on
  // first load rather than erroring.
  const [categoryLookup, setCategoryLookup] = useState(null);

  useEffect(() => {
    loadTests().then((tests) => setCategoryLookup(() => buildCategoryLookup(tests)));
  }, []);

  return (
    <PermissionGate module="billing">
      <AccountingComponent
        onLoadInvoices={searchInvoices}
        onLoadDoctors={loadActiveDoctorNames}
        getCategoryForTestName={categoryLookup || (() => "Uncategorized")}
      />
    </PermissionGate>
  );
}

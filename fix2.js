const fs = require('fs');

const files = [
  'components/accounting/AccountingComponent.jsx',
  'components/employee/EmployeeComponent.jsx',
  'components/patient-billing/PatientBillingComponent.jsx',
  'components/test-master/TestMasterComponent.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the inline component block
  // Using a very robust regex for the exact component body found in all of them
  const regex = /\/\*\s*-+\s*\*\s*Single-value searchable dropdown[\s\S]*?function SearchableSelect\([^)]*\)\s*{[\s\S]*?return \([\s\S]*?<\/[dD]iv>\s*\);\s*}/;
  content = content.replace(regex, '// SearchableSelect is now imported from @/components/shared/SearchableSelect');
  
  if (!content.includes('import SearchableSelect from')) {
    content = content.replace('import React', 'import SearchableSelect from "@/components/shared/SearchableSelect";\nimport React');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
}

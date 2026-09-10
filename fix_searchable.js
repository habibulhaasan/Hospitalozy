const fs = require('fs');

const files = [
  'components/accounting/AccountingComponent.jsx',
  'components/employee/EmployeeComponent.jsx',
  'components/patient-billing/PatientBillingComponent.jsx',
  'components/test-master/TestMasterComponent.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('import SearchableSelect from')) {
    content = content.replace('import React', 'import SearchableSelect from "@/components/shared/SearchableSelect";\nimport React');
  }

  // Find the start of the function
  const startIdx = content.indexOf('function SearchableSelect({');
  if (startIdx !== -1) {
    // Find the end by counting braces
    let braceCount = 0;
    let endIdx = -1;
    let started = false;
    for (let i = startIdx; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        started = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    
    if (endIdx !== -1) {
      content = content.substring(0, startIdx) + content.substring(endIdx);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed ' + file);
    }
  }
}

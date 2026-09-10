const fs = require('fs');
const files = [
  'components/accounting/AccountingComponent.jsx',
  'components/employee/EmployeeComponent.jsx',
  'components/patient-billing/PatientBillingComponent.jsx',
  'components/test-master/TestMasterComponent.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const startIdx = content.indexOf('function SearchableSelect');
  if (startIdx === -1) return;
  
  const commentStart = content.lastIndexOf('/* -----', startIdx);
  const actualStart = commentStart !== -1 && (startIdx - commentStart) < 300 ? commentStart : startIdx;
  
  // Find the `{` that starts the function body by looking for `) {`
  let bodyStartIdx = content.indexOf(') {', startIdx);
  if (bodyStartIdx === -1) {
    // try `){`
    bodyStartIdx = content.indexOf('){', startIdx);
  }
  
  if (bodyStartIdx !== -1) {
    // The actual `{` is either at bodyStartIdx + 1 or bodyStartIdx + 2
    let braceIdx = content.indexOf('{', bodyStartIdx);
    
    let braceCount = 0;
    let started = false;
    let endIdx = -1;
    
    for(let i = braceIdx; i < content.length; i++) {
      if(content[i] === '{') {
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
      const newContent = content.substring(0, actualStart) + 
        '// SearchableSelect is now imported from @/components/shared/SearchableSelect\n' + 
        content.substring(endIdx);
        
      let finalContent = newContent;
      if (!finalContent.includes('import SearchableSelect from')) {
        finalContent = finalContent.replace('import React', 'import SearchableSelect from "@/components/shared/SearchableSelect";\nimport React');
      }
      
      fs.writeFileSync(file, finalContent);
      console.log('Fixed ' + file);
    }
  }
});


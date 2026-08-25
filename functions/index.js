/**
 * functions/index.js
 * ------------------------------------------------------------------
 * Cloud Functions entry point — re-exports everything from
 * employees.js. Add future admin-only server-side actions (e.g. a
 * cascading delete that removes both the Firestore profile and the
 * Auth account together — see the note in
 * lib/firestore/employees.js::deleteEmployee) as their own file and
 * re-export it here the same way.
 * ------------------------------------------------------------------ */
const employeeFunctions = require("./employees");

exports.createEmployeeAccount = employeeFunctions.createEmployeeAccount;
exports.setTemporaryPassword = employeeFunctions.setTemporaryPassword;
exports.setAccountDisabled = employeeFunctions.setAccountDisabled;

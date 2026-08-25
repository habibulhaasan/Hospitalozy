/**
 * OPD ticket departments, their Bangla labels, and default room
 * assignment — previously embedded in PatientBillingComponent.jsx.
 * Extracted so the room plan can be edited (or eventually fetched
 * from Firestore) in one place without touching component code.
 *
 * This department list overlaps with data/staffReference.js's
 * SPECIALTIES but is intentionally kept separate: the OPD ticket only
 * ever needs the clinical departments a patient gets routed to, not
 * every specialty a doctor record might carry (Forensic Medicine,
 * Biochemistry, etc. don't see OPD walk-ins).
 */
export const OPD_DEPARTMENTS = [
  "Medicine", "Surgery", "Gynecology & Obstetrics", "Pediatrics", "Orthopedics",
  "ENT (Otolaryngology)", "Dermatology & Venereology", "Psychiatry", "Neurology",
  "Cardiology", "Nephrology", "Gastroenterology & Hepatology", "Endocrinology",
  "Ophthalmology", "Dentistry", "Physical Medicine & Rehabilitation",
  "Emergency Medicine", "General Practice / Family Medicine",
];

export const DEPARTMENT_BN = {
  "Medicine": "মেডিসিন",
  "Surgery": "সার্জারী",
  "Gynecology & Obstetrics": "স্ত্রীরোগ ও প্রসূতি বিদ্যা",
  "Pediatrics": "শিশু বিভাগ",
  "Orthopedics": "অর্থোপেডিক্স",
  "ENT (Otolaryngology)": "নাক কান গলা",
  "Dermatology & Venereology": "চর্ম ও যৌন রোগ",
  "Psychiatry": "মনোরোগ",
  "Neurology": "স্নায়ুরোগ",
  "Cardiology": "হৃদরোগ",
  "Ophthalmology": "চক্ষু",
  "Dentistry": "দন্ত বিভাগ",
  "Emergency Medicine": "জরুরী বিভাগ",
};

/* Which room a department sends patients to by default — what
 * "Assign Room" auto-fills from when a department is picked in
 * PatientBillingComponent. These room numbers are placeholders;
 * replace them with your hospital's actual room plan. Still manually
 * editable afterward for the day a room changes or a specific doctor
 * sits elsewhere.
 *
 * In production, this is a natural candidate to move into Firestore
 * (a `roomAssignments` doc admins edit from a settings screen) rather
 * than a code file — see the AuthContext/permission-gated Settings
 * page pattern in PROJECT_STRUCTURE.md.
 */
export const DEFAULT_ROOM_ASSIGNMENTS = {
  "Medicine": "101",
  "Surgery": "204",
  "Gynecology & Obstetrics": "105",
  "Pediatrics": "108",
  "Orthopedics": "110",
  "ENT (Otolaryngology)": "112",
  "Dermatology & Venereology": "114",
  "Psychiatry": "116",
  "Neurology": "117",
  "Cardiology": "118",
  "Nephrology": "119",
  "Gastroenterology & Hepatology": "121",
  "Endocrinology": "123",
  "Ophthalmology": "120",
  "Dentistry": "122",
  "Physical Medicine & Rehabilitation": "125",
  "Emergency Medicine": "Emergency",
  "General Practice / Family Medicine": "102",
};

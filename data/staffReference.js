/**
 * Reference lists for doctor/staff records — edit freely to match
 * your hospital's actual department names, designations, and
 * recognized qualifications. Previously embedded directly inside
 * DoctorComponent.jsx; extracted here so EmployeeComponent (which
 * has its own overlapping department list) and any future component
 * can import the same source instead of re-typing it.
 */
export const SPECIALTIES = [
  "Pathology",
  "Radiology & Imaging",
  "Medicine",
  "Surgery",
  "Gynecology & Obstetrics",
  "Pediatrics",
  "Orthopedics",
  "ENT (Otolaryngology)",
  "Dermatology & Venereology",
  "Psychiatry",
  "Neurology",
  "Neurosurgery",
  "Urology",
  "Oncology",
  "Cardiology",
  "Cardiac Surgery",
  "Nephrology",
  "Gastroenterology & Hepatology",
  "Endocrinology",
  "Anesthesiology",
  "Ophthalmology",
  "Dentistry",
  "Physical Medicine & Rehabilitation",
  "Forensic Medicine",
  "Microbiology",
  "Biochemistry",
  "Hematology",
  "Emergency Medicine",
  "General Practice / Family Medicine",
];

export const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Senior Consultant",
  "Consultant",
  "Junior Consultant",
  "Registrar",
  "Senior Medical Officer",
  "Medical Officer",
  "Resident Physician",
  "Resident Surgeon",
  "Specialist",
  "House Officer",
  "Intern",
];

export const QUALIFICATIONS = [
  "MBBS", "BDS", "MD", "MS", "MPhil", "PhD", "FCPS", "MRCP (UK)", "MRCS", "FRCS", "FRCP",
  "MRCOG", "FRCOG", "DGO", "DCH", "DLO", "DA", "DO", "DDV", "DCP", "DMRD", "DMRT",
  "MACP", "FACS", "FACC", "FICS", "FAAP", "MPH", "Diploma in Anaesthesia",
  "Diploma in Child Health", "Diploma in Gynae & Obs", "Diploma in Ophthalmology",
  "Diploma in Orthopedics", "Diploma in ENT", "BCS (Health)",
];

/* Non-clinical staff departments (Employee component) — deliberately
 * a separate list from SPECIALTIES above: a doctor's specialty and a
 * hospital department (e.g. "Accounts / Finance", "IT") aren't the
 * same concept, even though they overlap for clinical departments. */
export const STAFF_DEPARTMENTS = [
  "Laboratory",
  "Reception & Billing",
  "Administration",
  "Radiology",
  "Pharmacy",
  "Nursing",
  "IT",
  "Management",
  "Accounts / Finance",
  "Housekeeping",
  "Security",
  "Ambulance / Transport",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

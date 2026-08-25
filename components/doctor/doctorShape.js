/**
 * components/doctor/doctorShape.js
 * ------------------------------------------------------------------
 * The blank/default doctor record and small id helpers — split out
 * so DoctorModal, DoctorComponent, and (if ever needed) a seed script
 * can all import the same shape instead of copying it.
 * ------------------------------------------------------------------ */
export const BLANK_DOCTOR = {
  id: "",
  name: "",
  designation: "",
  specialty: "",
  qualifications: [],
  bmdc: "",
  mobile: "",
  email: "",
  chamber: "",
  fee: "",
  availableTime: "",
  status: "Active",
};

export function generateDoctorId() {
  return `DOC-${Date.now().toString().slice(-8)}`;
}

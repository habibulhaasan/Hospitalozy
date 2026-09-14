import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DOC_REF = doc(db, "settings", "app_config");

export async function loadAppConfig() {
  const snap = await getDoc(DOC_REF);
  if (snap.exists()) {
    return snap.data();
  }
  return {
    showManualTestSelector: false,
    showExtraPageSelector: false,
    hiddenNavItems: []
  };
}

export async function saveAppConfig(payload) {
  await setDoc(DOC_REF, payload, { merge: true });
  return true;
}


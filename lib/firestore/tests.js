/**
 * lib/firestore/tests.js
 * ------------------------------------------------------------------
 * Backs TestMasterComponent's onLoadTests/onSaveTest/onDeleteTest,
 * seeding the `tests` collection from data/billableItems.js on first
 * run (an empty collection means nobody's edited the master yet, so
 * fall back to the shipped seed rather than showing an empty screen).
 * Also exports the read-only helpers other components' `onLoadDoctors`-
 * style props need: a category lookup for Accounting's revenue chart,
 * and a rate/turnaround lookup for Invoice/PatientBilling's test
 * picker — so once this collection is the real source of truth,
 * nobody needs their own hardcoded catalog anymore.
 * ------------------------------------------------------------------ */
import { db } from "@/lib/firebase";
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch,
} from "firebase/firestore";
import { BILLABLE_ITEMS } from "@/data/billableItems";
import { withCache, cacheInvalidate } from "@/lib/cache";

const COLLECTION = "tests";

/** Pass directly as TestMasterComponent's onLoadTests. */
export async function loadTests() {
  return withCache("tests:all", async () => {
    const snap = await getDocs(query(collection(db, COLLECTION), orderBy("displayOrder")));
    if (snap.empty) {
      await seedTestsFromDefaults();
      const reSnap = await getDocs(query(collection(db, COLLECTION), orderBy("displayOrder")));
      return reSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
}

/** One-time seed — writes data/billableItems.js into Firestore the first
 * time the Test Master screen loads against an empty database. Safe to
 * call more than once (it only runs when the collection is empty). */
async function seedTestsFromDefaults() {
  const batch = writeBatch(db);
  BILLABLE_ITEMS.forEach((item, i) => {
    const ref = doc(collection(db, COLLECTION));
    batch.set(ref, {
      name: item.name,
      shortName: item.shortName,
      category: item.category,
      price: item.price,
      notes: "",
      sampleType: item.sampleType,
      active: true,
      searchVisible: true,
      reportTemplate: item.reportTemplate,
      turnaroundHours: item.turnaroundHours,
      reportParameters: item.reportParameters,
      fastingRequired: false,
      synonyms: "",
      specimenContainer: "",
      displayOrder: (i + 1) * 10,
    });
  });
  await batch.commit();
}

/** Pass directly as TestMasterComponent's onSaveTest. */
export async function saveTest(testData) {
  if (testData.id) {
    const ref = doc(db, COLLECTION, testData.id);
    const { id, ...rest } = testData;
    await updateDoc(ref, rest);
    cacheInvalidate("tests:all");
    return testData;
  }
  const { id, ...rest } = testData;
  const ref = await addDoc(collection(db, COLLECTION), rest);
  cacheInvalidate("tests:all");
  return { ...testData, id: ref.id };
}

/** Pass directly as TestMasterComponent's onDeleteTest. */
export async function deleteTest(test) {
  const id = typeof test === "string" ? test : test.id;
  await deleteDoc(doc(db, COLLECTION, id));
  cacheInvalidate("tests:all");
  return true;
}

/**
 * category lookup by test name — pass as AccountingComponent's
 * getCategoryForTestName once you're ready to replace the
 * "Uncategorized" default with real Test Master data.
 *
 *   const tests = await loadTests();
 *   const byName = Object.fromEntries(tests.map(t => [t.name, t.category]));
 *   <AccountingComponent getCategoryForTestName={(name) => byName[name] || "Uncategorized"} />
 */
export function buildCategoryLookup(tests) {
  const byName = Object.fromEntries(tests.map((t) => [t.name, t.category]));
  return (name) => byName[name] || "Uncategorized";
}

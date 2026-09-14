/**
 * scripts/backfill-search-tokens.js
 * One-time migration — run locally with:
 *   node scripts/backfill-search-tokens.js
 *
 * Requires: npm install firebase-admin
 * Requires: serviceAccountKey.json downloaded from Firebase Console
 *           → Project Settings → Service Accounts → Generate new private key
 */
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Copy of buildSearchTokens — must match patients.js exactly
function buildSearchTokens(patientData) {
  const tokens = new Set();
  function addPrefixes(str) {
    if (!str) return;
    const s = str.toLowerCase().trim();
    if (s.length >= 2) tokens.add(s);
    for (let i = 2; i <= s.length; i++) tokens.add(s.slice(0, i));
    s.split(/\s+/).forEach((word) => {
      if (word.length >= 2) tokens.add(word);
      for (let i = 2; i <= word.length; i++) tokens.add(word.slice(0, i));
    });
  }
  addPrefixes(patientData.name);
  addPrefixes(patientData.mobile);
  addPrefixes(patientData.patientId);
  addPrefixes(patientData.nid);
  return [...tokens];
}

async function main() {
  const snap = await db.collection("patients").get();
  console.log(`Found ${snap.size} patients. Writing in batches of 500...`);

  const docs = snap.docs;
  const BATCH_SIZE = 500;
  let processed = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i, i + BATCH_SIZE).forEach((docSnap) => {
      const searchTokens = buildSearchTokens(docSnap.data());
      batch.update(docSnap.ref, { searchTokens });
    });
    await batch.commit();
    processed += Math.min(BATCH_SIZE, docs.length - i);
    console.log(`  ✓ ${processed}/${docs.length}`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });


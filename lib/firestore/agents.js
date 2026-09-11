import { db } from "@/lib/firebase";
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy,
} from "firebase/firestore";
import { getNextSequentialId } from "@/lib/firestore/counters";

const COLLECTION = "agents";

/** Full agent records. */
export async function loadAgentRecords() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create or update an agent.
 */
export async function saveAgent(agentData) {
  if (agentData.id) {
    const ref = doc(db, COLLECTION, agentData.id);
    const { id, ...rest } = agentData;
    await updateDoc(ref, rest);
    return agentData;
  }
  const newId = await getNextSequentialId("AGT", "agents");
  const { id, ...rest } = agentData;
  await setDoc(doc(db, COLLECTION, newId), { ...rest, createdAt: new Date().toISOString() });
  return { ...agentData, id: newId };
}

export async function deleteAgent(agent) {
  const id = typeof agent === "string" ? agent : agent.id;
  await deleteDoc(doc(db, COLLECTION, id));
  return true;
}

/**
 * For the invoice "Agent / Middleman" dropdown.
 */
export async function loadActiveAgents() {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("status", "==", "Active"), orderBy("name"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(d => d.name);
}

export async function getAgentById(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}


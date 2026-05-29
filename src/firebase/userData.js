import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config.js';

function walletRef(uid) {
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', uid, 'wallet', 'main');
}

export async function fetchUserData(uid) {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(walletRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    expenses: data.expenses ?? [],
    budgets: data.budgets ?? {},
    incomes: data.incomes ?? {},
  };
}

export async function saveUserData(uid, payload) {
  if (!isFirebaseConfigured) return;
  await setDoc(
    walletRef(uid),
    {
      expenses: payload.expenses,
      budgets: payload.budgets,
      incomes: payload.incomes,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function mergeById(localList = [], remoteList = []) {
  const map = new Map();
  for (const item of remoteList) map.set(item.id, item);
  for (const item of localList) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

export function mergeUserData(local, remote) {
  if (!remote) return local;
  return {
    expenses: mergeById(local.expenses, remote.expenses),
    budgets: { ...local.budgets, ...remote.budgets },
    incomes: { ...local.incomes, ...remote.incomes },
  };
}

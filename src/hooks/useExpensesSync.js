import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { fetchUserData, mergeUserData, saveUserData } from '../firebase/userData.js';

const STORAGE_KEY = 'khali-khichha-expenses';
const BUDGET_KEY = 'khali-khichha-budgets';
const INCOME_KEY = 'khali-khichha-income';

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadLocalData() {
  return {
    expenses: loadJson(STORAGE_KEY, []),
    budgets: loadJson(BUDGET_KEY, {}),
    incomes: loadJson(INCOME_KEY, {}),
  };
}

function cacheLocally(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.expenses));
  localStorage.setItem(BUDGET_KEY, JSON.stringify(data.budgets));
  localStorage.setItem(INCOME_KEY, JSON.stringify(data.incomes));
}

export function useExpensesSync() {
  const { user, isConfigured } = useAuth();
  const initial = loadLocalData();
  const [expenses, setExpenses] = useState(initial.expenses);
  const [budgets, setBudgets] = useState(initial.budgets);
  const [incomes, setIncomes] = useState(initial.incomes);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const skipSave = useRef(false);
  const uidRef = useRef(null);

  const applyData = useCallback((data) => {
    skipSave.current = true;
    setExpenses(data.expenses);
    setBudgets(data.budgets);
    setIncomes(data.incomes);
    cacheLocally(data);
    requestAnimationFrame(() => {
      skipSave.current = false;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isConfigured || !user) {
        if (!cancelled) {
          applyData(loadLocalData());
          setSyncStatus('idle');
          setCloudLoading(false);
        }
        uidRef.current = null;
        return;
      }

      if (uidRef.current !== user.uid) {
        uidRef.current = user.uid;
        setCloudLoading(true);
      }

      try {
        const local = loadLocalData();
        const remote = await fetchUserData(user.uid);
        if (cancelled) return;
        const merged = mergeUserData(local, remote);
        applyData(merged);
        if (!remote || !(remote.expenses?.length > 0)) {
          await saveUserData(user.uid, merged);
        }
        setSyncStatus('synced');
      } catch {
        if (!cancelled) {
          applyData(loadLocalData());
          setSyncStatus('error');
        }
      } finally {
        if (!cancelled) setCloudLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isConfigured, applyData]);

  useEffect(() => {
    if (skipSave.current || cloudLoading) return;

    const payload = { expenses, budgets, incomes };
    cacheLocally(payload);

    if (!user || !isConfigured) return;

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        await saveUserData(user.uid, payload);
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [expenses, budgets, incomes, user, isConfigured, cloudLoading]);

  return {
    expenses,
    setExpenses,
    budgets,
    setBudgets,
    incomes,
    setIncomes,
    cloudLoading,
    syncStatus,
    isGuest: !user,
    isCloudUser: Boolean(user && isConfigured),
  };
}

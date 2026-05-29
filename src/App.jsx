import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth/AuthContext.jsx';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import GuestBanner from './components/GuestBanner.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Onboarding from './components/Onboarding.jsx';
import SettingsBar from './components/SettingsBar.jsx';
import Toast from './components/Toast.jsx';
import UserMenu from './components/UserMenu.jsx';
import ExpenseReports from './components/ExpenseReports.jsx';
import { useExpensesSync } from './hooks/useExpensesSync.js';
import { useLanguage } from './i18n/LanguageContext.jsx';
import {
  buildMonthOptions,
  buildYearOptions,
  monthKey,
  yearFromIso,
} from './utils/expensePeriod.js';
import { loadOnboarded } from './settings/useSettings.js';
import { useSettings } from './settings/useSettings.js';
import './App.css';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

function formatMoney(amount, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isThisWeek(iso) {
  const d = new Date(iso);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

function emptyForm() {
  return {
    title: '',
    amount: '',
    category: 'food',
    payment: 'upi',
    date: todayKey(),
  };
}

export default function App() {
  const {
    lang,
    locale,
    t,
    tCategory,
    tPayment,
    tSort,
    formatDate,
    formatMonth,
    categories,
    payments,
    sortOptions,
    csvHeader,
    favorites,
  } = useLanguage();

  const { settings } = useSettings();
  const simple = settings.simpleMode;
  const { isConfigured } = useAuth();
  const {
    expenses,
    setExpenses,
    budgets,
    setBudgets,
    incomes,
    setIncomes,
    cloudLoading,
    syncStatus,
  } = useExpensesSync();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [filterMonth, setFilterMonth] = useState(() => monthKey(new Date().toISOString()));
  const [selectedYear, setSelectedYear] = useState(() =>
    String(new Date().getFullYear())
  );
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [error, setError] = useState('');
  const [showOnboard, setShowOnboard] = useState(() => !loadOnboarded());
  const [toast, setToast] = useState(null);
  const [lastAdded, setLastAdded] = useState(null);
  const restoreInputRef = useRef(null);

  const money = (amount) => formatMoney(amount, locale);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const monthOptions = useMemo(() => buildMonthOptions(expenses), [expenses]);
  const yearOptions = useMemo(() => buildYearOptions(expenses), [expenses]);

  const [filterYear, filterMonthNum] = filterMonth.split('-');
  const monthLabel = formatMonth(filterYear, filterMonthNum);
  const isCurrentMonth = filterMonth === monthKey(new Date().toISOString());
  const isYearView = reportPeriod === 'year';

  const monthFiltered = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === filterMonth),
    [expenses, filterMonth]
  );

  const yearFiltered = useMemo(
    () => expenses.filter((e) => yearFromIso(e.date) === selectedYear),
    [expenses, selectedYear]
  );

  const periodFiltered = isYearView ? yearFiltered : monthFiltered;

  const todaySpent = useMemo(
    () =>
      monthFiltered
        .filter((e) => e.date.slice(0, 10) === todayKey())
        .reduce((s, e) => s + e.amount, 0),
    [monthFiltered]
  );

  const weekSpent = useMemo(
    () =>
      monthFiltered.filter((e) => isThisWeek(e.date)).reduce((s, e) => s + e.amount, 0),
    [monthFiltered]
  );

  const recentTitles = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const e of expenses) {
      const title = e.title.trim();
      if (!title || seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());
      list.push(title);
      if (list.length >= 12) break;
    }
    return list;
  }, [expenses]);

  const displayed = useMemo(() => {
    let list = [...periodFiltered];

    if (!isYearView) {
      if (dateFilter === 'today') {
        list = list.filter((e) => e.date.slice(0, 10) === todayKey());
      } else if (dateFilter === 'week') {
        list = list.filter((e) => isThisWeek(e.date));
      }
    }

    if (filterCategory !== 'all') {
      list = list.filter((e) => e.category === filterCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => {
        const catLabel = tCategory(e.category).label.toLowerCase();
        return e.title.toLowerCase().includes(q) || catLabel.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'title') return a.title.localeCompare(b.title, lang);
      return new Date(b.date) - new Date(a.date);
    });

    return list;
  }, [periodFiltered, dateFilter, filterCategory, search, sortBy, lang, tCategory, isYearView]);

  const total = useMemo(
    () => monthFiltered.reduce((sum, e) => sum + e.amount, 0),
    [monthFiltered]
  );

  const budget = Number(budgets[filterMonth]) || 0;
  const income = Number(incomes[filterMonth]) || 0;
  const remaining = income > 0 ? income - total : null;
  const budgetLeft = budget > 0 ? budget - total : null;
  const budgetPercent = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;

  const byCategory = useMemo(() => {
    const map = {};
    for (const e of monthFiltered) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .map(([id, amt]) => ({ ...tCategory(id), amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthFiltered, lang, tCategory]);

  const stats = useMemo(() => {
    if (!monthFiltered.length || simple) return null;
    const amounts = monthFiltered.map((e) => e.amount);
    const max = Math.max(...amounts);
    const maxItem = monthFiltered.find((e) => e.amount === max);
    const days = new Set(monthFiltered.map((e) => e.date.slice(0, 10))).size;
    return { max, maxItem, avgPerDay: total / days };
  }, [monthFiltered, total, simple]);

  const last7Days = useMemo(() => {
    if (simple) return [];
    const y = Number(filterYear);
    const m = Number(filterMonthNum);
    const lastDay = new Date(y, m, 0).getDate();
    const today = new Date();

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = isCurrentMonth ? new Date(today) : new Date(y, m - 1, lastDay);
      if (isCurrentMonth) d.setDate(today.getDate() - i);
      else d.setDate(lastDay - i);
      if (d.getMonth() + 1 !== m) continue;

      const key = d.toISOString().slice(0, 10);
      const spent = monthFiltered
        .filter((e) => e.date.slice(0, 10) === key)
        .reduce((s, e) => s + e.amount, 0);
      days.push({ key, day: d.getDate(), spent });
    }
    return days;
  }, [monthFiltered, filterYear, filterMonthNum, isCurrentMonth, simple]);

  const chartMax = useMemo(
    () => Math.max(...last7Days.map((d) => d.spent), 1),
    [last7Days]
  );

  function addExpenseDirect(payload, flash = true) {
    const entry = { id: crypto.randomUUID(), ...payload, date: payload.date ?? new Date().toISOString() };
    setExpenses((prev) => [entry, ...prev]);
    setLastAdded(entry);
    if (flash) setToast({ message: t('added'), type: 'ok' });
    return entry;
  }

  function setBudget(value) {
    const n = parseFloat(value);
    setBudgets((prev) => {
      const next = { ...prev };
      if (!n || n <= 0) delete next[filterMonth];
      else next[filterMonth] = n;
      return next;
    });
  }

  function setIncome(value) {
    const n = parseFloat(value);
    setIncomes((prev) => {
      const next = { ...prev };
      if (!n || n <= 0) delete next[filterMonth];
      else next[filterMonth] = n;
      return next;
    });
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setError('');
  }

  function scrollToForm() {
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  function startEdit(exp) {
    setEditingId(exp.id);
    setForm({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category,
      payment: exp.payment ?? 'cash',
      date: exp.date.slice(0, 10),
    });
    setError('');
    scrollToForm();
  }

  function quickAdd(fav) {
    addExpenseDirect({
      title: fav.title,
      amount: fav.amount,
      category: fav.category,
      payment: fav.payment,
      date: new Date().toISOString(),
    });
  }

  function duplicateExpense(exp) {
    addExpenseDirect({
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      payment: exp.payment ?? 'cash',
      date: new Date().toISOString(),
    });
  }

  function repeatLast() {
    if (!lastAdded) return;
    duplicateExpense(lastAdded);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmed = form.title.trim();
    const parsed = parseFloat(form.amount);

    if (!trimmed) {
      setError(t('errorTitle'));
      return;
    }
    if (!parsed || parsed <= 0) {
      setError(t('errorAmount'));
      return;
    }

    const payload = {
      title: trimmed,
      amount: parsed,
      category: form.category,
      payment: form.payment,
      date: new Date(form.date).toISOString(),
    };

    if (editingId) {
      setExpenses((prev) =>
        prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
      );
      setToast({ message: t('saveChanges'), type: 'ok' });
    } else {
      addExpenseDirect(payload, true);
    }

    resetForm();
  }

  function removeExpense(id) {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
    setToast({ message: t('deleted'), deleted: exp });
  }

  function undoDelete() {
    if (!toast?.deleted) return;
    setExpenses((prev) => [toast.deleted, ...prev]);
    setToast(null);
  }

  function clearMonth() {
    if (!monthFiltered.length) return;
    const ok = window.confirm(
      t('confirmClear', { count: monthFiltered.length, month: monthLabel })
    );
    if (ok) {
      setExpenses((prev) => prev.filter((e) => monthKey(e.date) !== filterMonth));
      resetForm();
    }
  }

  function clearYear() {
    if (!yearFiltered.length) return;
    const ok = window.confirm(
      t('confirmClearYear', { count: yearFiltered.length, year: selectedYear })
    );
    if (ok) {
      setExpenses((prev) =>
        prev.filter((e) => yearFromIso(e.date) !== selectedYear)
      );
      resetForm();
    }
  }

  function openMonthFromYear(monthKeyValue) {
    setReportPeriod('month');
    setFilterMonth(monthKeyValue);
    setDateFilter('all');
    document.querySelector('.list-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  function exportCsv(items) {
    const rows = items.map((e) => {
      const cat = tCategory(e.category).label;
      const pay = tPayment(e.payment ?? 'cash').label;
      const d = formatDate(e.date);
      const title = `"${e.title.replace(/"/g, '""')}"`;
      return `${d},${title},${cat},${pay},${e.amount}`;
    });
    const blob = new Blob([[csvHeader, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isYearView
      ? `khali-khichha-${selectedYear}.csv`
      : `khali-khichha-${filterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function backupData() {
    const data = {
      version: 1,
      expenses,
      budgets,
      incomes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khali-khichha-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: t('backupDone'), type: 'ok' });
  }

  function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.expenses)) throw new Error('invalid');
        setExpenses(data.expenses);
        if (data.budgets) setBudgets(data.budgets);
        if (data.incomes) setIncomes(data.incomes);
        setToast({ message: t('restoreDone'), type: 'ok' });
      } catch {
        setToast({ message: t('restoreError'), type: 'err' });
      }
    };
    reader.readAsText(file);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (cloudLoading) return <LoadingScreen />;

  return (
    <div className="app">
      {showOnboard && <Onboarding onDone={() => setShowOnboard(false)} />}

      <Toast
        message={toast?.message}
        actionLabel={toast?.deleted ? t('undo') : null}
        onAction={undoDelete}
        onDismiss={() => setToast(null)}
      />

      <header className="header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            🪙
          </span>
          <div>
            <h1>KHALI KHICHHA</h1>
            <p className="tagline">{t('tagline')}</p>
          </div>
        </div>
        <div className="header-actions">
          <UserMenu syncStatus={syncStatus} />
          <LanguageSwitcher />
        </div>
      </header>

      <GuestBanner />

      <SettingsBar />

      <main className="layout">
        <ExpenseReports
          reportPeriod={reportPeriod}
          setReportPeriod={setReportPeriod}
          filterMonth={filterMonth}
          setFilterMonth={(key) => {
            setFilterMonth(key);
            setDateFilter('all');
          }}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          formatMonth={formatMonth}
          t={t}
          tCategory={tCategory}
          money={money}
          locale={locale}
          simple={simple}
          monthFiltered={monthFiltered}
          yearFiltered={yearFiltered}
          total={total}
          budgets={budgets}
          incomes={incomes}
          setBudget={setBudget}
          setIncome={setIncome}
          remaining={remaining}
          budget={budget}
          budgetLeft={budgetLeft}
          budgetPercent={budgetPercent}
          byCategory={byCategory}
          stats={stats}
          last7Days={last7Days}
          chartMax={chartMax}
          todaySpent={todaySpent}
          weekSpent={weekSpent}
          isCurrentMonth={isCurrentMonth}
          onOpenMonth={openMonthFromYear}
        />

        <section className="card form-card">
          <h2>{editingId ? t('editExpense') : t('addExpense')}</h2>

          <div className="quick-section">
            <p className="field-label">{t('quickFavorites')}</p>
            <div className="fav-grid">
              {favorites.map((fav) => (
                <button
                  key={fav.title}
                  type="button"
                  className="fav-btn"
                  onClick={() => quickAdd(fav)}
                >
                  <span className="fav-icon">{fav.icon}</span>
                  <span className="fav-title">{fav.title}</span>
                  <span className="fav-amt">{money(fav.amount)}</span>
                </button>
              ))}
            </div>
          </div>

          {lastAdded && (
            <button type="button" className="repeat-btn" onClick={repeatLast}>
              ↻ {t('repeatLast')}: {lastAdded.title} ({money(lastAdded.amount)})
            </button>
          )}

          <form onSubmit={handleSubmit} className="expense-form">
            <div className="field">
              <label htmlFor="title">{t('whatSpent')}</label>
              <input
                id="title"
                list="recent-titles"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder={t('titlePlaceholder')}
                maxLength={80}
                autoComplete="off"
              />
              <datalist id="recent-titles">
                {recentTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
              {recentTitles.length > 0 && (
                <p className="field-hint">{t('recent')}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor="amount">{t('amount')}</label>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => updateForm('amount', e.target.value)}
                placeholder="0"
              />
              <div className="quick-amounts">
                {QUICK_AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="chip"
                    onClick={() => updateForm('amount', String(n))}
                  >
                    ₹{n}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="date">{t('date')}</label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="payment">{t('payment')}</label>
                <select
                  id="payment"
                  value={form.payment}
                  onChange={(e) => updateForm('payment', e.target.value)}
                >
                  {payments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {tPayment(p.id).label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="category">{t('category')}</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateForm('category', e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {tCategory(c.id).label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  {t('cancel')}
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editingId ? t('saveChanges') : t('addExpense')}
              </button>
            </div>
          </form>
        </section>

        <section className="card list-card">
          <div className="list-header">
            <h2>
              {isYearView
                ? t('yearlyExpenses', { year: selectedYear })
                : t('expenses')}
            </h2>
            <div className="list-actions">
              {periodFiltered.length > 0 && !simple && (
                <>
                  <button
                    type="button"
                    className="btn-ghost accent"
                    onClick={() =>
                      exportCsv(displayed.length ? displayed : periodFiltered)
                    }
                  >
                    {t('exportCsv')}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={isYearView ? clearYear : clearMonth}
                  >
                    {isYearView ? t('clearYear') : t('clearMonth')}
                  </button>
                </>
              )}
            </div>
          </div>

          {!isYearView && isCurrentMonth && (
            <div className="period-pills" role="tablist">
              {[
                { id: 'all', label: t('allMonth') },
                { id: 'today', label: t('today') },
                { id: 'week', label: t('thisWeek') },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={dateFilter === pill.id}
                  className={`pill ${dateFilter === pill.id ? 'active' : ''}`}
                  onClick={() => setDateFilter(pill.id)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          <div className={`list-filters ${simple ? 'simple' : ''}`}>
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('searchPlaceholder')}
            />
            {!simple && (
              <>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  aria-label={t('category')}
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {tCategory(c.id).label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label={t('expenses')}
                >
                  {sortOptions.map((id) => (
                    <option key={id} value={id}>
                      {tSort(id).label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {periodFiltered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">
                📭
              </span>
              <p>{isYearView ? t('noExpensesYear', { year: selectedYear }) : t('noExpenses')}</p>
              <p className="empty-hint">{t('noExpensesHint')}</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="empty-state">
              <p>{t('noMatches')}</p>
            </div>
          ) : (
            <ul className="expense-list">
              {displayed.map((exp) => {
                const cat = tCategory(exp.category);
                const pay = tPayment(exp.payment ?? 'cash');
                return (
                  <li
                    key={exp.id}
                    className={`expense-item ${editingId === exp.id ? 'editing' : ''}`}
                  >
                    <div className="expense-icon" aria-hidden="true">
                      {cat.icon}
                    </div>
                    <div className="expense-body">
                      <p className="expense-title">{exp.title}</p>
                      <p className="expense-meta">
                        {cat.label} · {pay.icon} {pay.label} · {formatDate(exp.date)}
                      </p>
                    </div>
                    <div className="expense-actions">
                      <span className="expense-amount">{money(exp.amount)}</span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => duplicateExpense(exp)}
                        aria-label={t('duplicate')}
                        title={t('duplicate')}
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => startEdit(exp)}
                        aria-label={t('editItem', { title: exp.title })}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => removeExpense(exp.id)}
                        aria-label={t('deleteItem', { title: exp.title })}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>KHALI KHICHHA · {t('footer')}</p>
        <div className="footer-actions">
          <button type="button" className="footer-link" onClick={() => setShowOnboard(true)}>
            {t('showTips')}
          </button>
          <button type="button" className="footer-link" onClick={backupData}>
            {t('backup')}
          </button>
          <button
            type="button"
            className="footer-link"
            onClick={() => restoreInputRef.current?.click()}
          >
            {t('restore')}
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleRestoreFile}
          />
        </div>
      </footer>

      <button
        type="button"
        className="fab"
        onClick={scrollToForm}
        aria-label={t('fabAdd')}
      >
        + {t('fabAdd')}
      </button>
    </div>
  );
}

import { useMemo } from 'react';
import {
  buildMonthlyBreakdown,
  sumForYear,
} from '../utils/expensePeriod.js';
import './ExpenseReports.css';

export default function ExpenseReports({
  reportPeriod,
  setReportPeriod,
  filterMonth,
  setFilterMonth,
  selectedYear,
  setSelectedYear,
  monthOptions,
  yearOptions,
  formatMonth,
  formatDate,
  t,
  tCategory,
  money,
  locale,
  simple,
  monthFiltered,
  yearFiltered,
  total,
  budgets,
  incomes,
  setBudget,
  setIncome,
  remaining,
  budget,
  budgetLeft,
  budgetPercent,
  byCategory,
  stats,
  last7Days,
  chartMax,
  todaySpent,
  weekSpent,
  isCurrentMonth,
  onOpenMonth,
}) {
  const isMonth = reportPeriod === 'month';
  const filtered = isMonth ? monthFiltered : yearFiltered;
  const yearExpenses = yearFiltered;

  const yearlyTotal = useMemo(
    () => yearExpenses.reduce((s, e) => s + e.amount, 0),
    [yearExpenses]
  );

  const monthlyBreakdown = useMemo(
    () => buildMonthlyBreakdown(yearExpenses, selectedYear, locale),
    [yearExpenses, selectedYear, locale]
  );

  const yearChartMax = useMemo(
    () => Math.max(...monthlyBreakdown.map((m) => m.spent), 1),
    [monthlyBreakdown]
  );

  const yearlyIncome = sumForYear(incomes, selectedYear);
  const yearlyBudget = sumForYear(budgets, selectedYear);
  const yearlyRemaining = yearlyIncome > 0 ? yearlyIncome - yearlyTotal : null;

  const yearlyByCategory = useMemo(() => {
    const map = {};
    for (const e of yearExpenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .map(([id, amt]) => ({ ...tCategory(id), amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearExpenses, tCategory]);

  const monthsWithSpend = monthlyBreakdown.filter((m) => m.spent > 0).length;
  const avgPerMonth = monthsWithSpend > 0 ? yearlyTotal / monthsWithSpend : 0;

  const busiestMonth = monthlyBreakdown.reduce(
    (best, m) => (m.spent > (best?.spent ?? 0) ? m : best),
    null
  );

  return (
    <section className="card summary-card reports-card">
      <div className="report-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isMonth}
          className={`report-tab ${isMonth ? 'active' : ''}`}
          onClick={() => setReportPeriod('month')}
        >
          {t('reportMonthly')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isMonth}
          className={`report-tab ${!isMonth ? 'active' : ''}`}
          onClick={() => setReportPeriod('year')}
        >
          {t('reportYearly')}
        </button>
      </div>

      {isMonth ? (
        <>
          <div className="summary-top">
            <label className="field-label" htmlFor="month-filter">
              {t('month')}
            </label>
            <select
              id="month-filter"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              {monthOptions.map((key) => {
                const [y, m] = key.split('-');
                return (
                  <option key={key} value={key}>
                    {formatMonth(y, m)}
                  </option>
                );
              })}
            </select>
          </div>

          {isCurrentMonth && (
            <div className="period-cards">
              <div className="period-card">
                <span className="period-label">{t('todaySpent')}</span>
                <strong>{money(todaySpent)}</strong>
              </div>
              <div className="period-card">
                <span className="period-label">{t('weekSpent')}</span>
                <strong>{money(weekSpent)}</strong>
              </div>
            </div>
          )}

          <p className="summary-label">{t('monthlyTotal')}</p>
          <p className="summary-total">{money(total)}</p>
          <p className="summary-count">
            {t('expenseCount', { count: filtered.length })}
          </p>

          <div className="money-fields">
            <div className="field compact">
              <label htmlFor="month-income">{t('monthlyIncome')}</label>
              <input
                id="month-income"
                type="number"
                min="0"
                placeholder={t('incomePlaceholder')}
                value={incomes[filterMonth] ?? ''}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>
            <div className="field compact">
              <label htmlFor="month-budget">{t('monthlyBudget')}</label>
              <input
                id="month-budget"
                type="number"
                min="0"
                placeholder={t('budgetPlaceholder')}
                value={budgets[filterMonth] ?? ''}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          {remaining !== null && (
            <p className={`balance-line ${remaining < 0 ? 'over' : 'good'}`}>
              {remaining >= 0 ? t('saved') : t('overspent')}:{' '}
              <strong>{money(Math.abs(remaining))}</strong>
            </p>
          )}

          {budget > 0 && (
            <div className="budget-block">
              <div className="budget-header">
                <span>{t('budgetUsed')}</span>
                <span className={budgetLeft < 0 ? 'over' : ''}>
                  {budgetLeft >= 0
                    ? t('budgetLeft', { amount: money(budgetLeft) })
                    : t('budgetOver', { amount: money(-budgetLeft) })}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${budgetPercent >= 100 ? 'danger' : budgetPercent >= 80 ? 'warn' : ''}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>
          )}

          {!simple && stats && (
            <div className="mini-stats">
              <div>
                <span className="mini-label">{t('dailyAvg')}</span>
                <span>{money(stats.avgPerDay)}</span>
              </div>
              <div>
                <span className="mini-label">{t('biggest')}</span>
                <span title={stats.maxItem?.title}>{money(stats.max)}</span>
              </div>
            </div>
          )}

          {!simple && last7Days.some((d) => d.spent > 0) && (
            <div className="chart-block">
              <p className="field-label">{t('last7Days')}</p>
              <div className="bar-chart">
                {last7Days.map((d) => (
                  <div key={d.key} className="bar-col" title={money(d.spent)}>
                    <div
                      className="bar"
                      style={{ height: `${(d.spent / chartMax) * 100}%` }}
                    />
                    <span className="bar-day">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {byCategory.length > 0 && (
            <ul className="category-breakdown">
              {byCategory.map((cat) => {
                const pct = total > 0 ? (cat.amount / total) * 100 : 0;
                return (
                  <li key={cat.id}>
                    <span>
                      {cat.icon} {cat.label}
                    </span>
                    <span>
                      {money(cat.amount)}
                      <small> ({Math.round(pct)}%)</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="summary-top">
            <label className="field-label" htmlFor="year-filter">
              {t('year')}
            </label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <p className="summary-label">{t('yearlyTotal')}</p>
          <p className="summary-total">{money(yearlyTotal)}</p>
          <p className="summary-count">
            {t('yearlyExpenseCount', { count: yearExpenses.length })}
          </p>

          {!simple && (
            <div className="mini-stats">
              <div>
                <span className="mini-label">{t('avgPerMonth')}</span>
                <span>{money(avgPerMonth)}</span>
              </div>
              <div>
                <span className="mini-label">{t('topMonth')}</span>
                <span title={busiestMonth?.label}>
                  {busiestMonth?.spent ? money(busiestMonth.spent) : '—'}
                </span>
              </div>
            </div>
          )}

          {(yearlyIncome > 0 || yearlyBudget > 0) && (
            <div className="year-finance">
              {yearlyIncome > 0 && (
                <p>
                  {t('yearlyIncome')}: <strong>{money(yearlyIncome)}</strong>
                </p>
              )}
              {yearlyBudget > 0 && (
                <p>
                  {t('yearlyBudget')}: <strong>{money(yearlyBudget)}</strong>
                </p>
              )}
              {yearlyRemaining !== null && (
                <p className={yearlyRemaining < 0 ? 'over' : 'good'}>
                  {yearlyRemaining >= 0 ? t('saved') : t('overspent')}:{' '}
                  <strong>{money(Math.abs(yearlyRemaining))}</strong>
                </p>
              )}
            </div>
          )}

          {!simple && monthlyBreakdown.some((m) => m.spent > 0) && (
            <div className="chart-block">
              <p className="field-label">{t('monthBreakdown')}</p>
              <div className="bar-chart year-chart">
                {monthlyBreakdown.map((m) => (
                  <div key={m.key} className="bar-col" title={money(m.spent)}>
                    <div
                      className="bar"
                      style={{ height: `${(m.spent / yearChartMax) * 100}%` }}
                    />
                    <span className="bar-day">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ul className="month-breakdown-list">
            {monthlyBreakdown.map((m) => (
              <li key={m.key}>
                <button
                  type="button"
                  className="month-row"
                  onClick={() => onOpenMonth(m.key)}
                  disabled={m.count === 0}
                >
                  <span>{formatMonth(selectedYear, m.month)}</span>
                  <span className="month-row-right">
                    {m.count > 0 ? (
                      <>
                        <span className="month-amt">{money(m.spent)}</span>
                        <small>{t('monthExpenseShort', { count: m.count })}</small>
                      </>
                    ) : (
                      <span className="month-empty">—</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {yearlyByCategory.length > 0 && (
            <ul className="category-breakdown">
              {yearlyByCategory.map((cat) => {
                const pct = yearlyTotal > 0 ? (cat.amount / yearlyTotal) * 100 : 0;
                return (
                  <li key={cat.id}>
                    <span>
                      {cat.icon} {cat.label}
                    </span>
                    <span>
                      {money(cat.amount)}
                      <small> ({Math.round(pct)}%)</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="report-hint">{t('tapMonthHint')}</p>
        </>
      )}
    </section>
  );
}

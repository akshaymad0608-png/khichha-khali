export function monthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function yearFromIso(iso) {
  return String(new Date(iso).getFullYear());
}

export function sumForYear(map, year) {
  return Object.entries(map).reduce((sum, [key, val]) => {
    if (key.startsWith(`${year}-`)) return sum + (Number(val) || 0);
    return sum;
  }, 0);
}

export function buildYearOptions(expenses) {
  const years = new Set(expenses.map((e) => Number(yearFromIso(e.date))));
  years.add(new Date().getFullYear());
  return [...years].sort((a, b) => b - a);
}

export function buildMonthOptions(expenses) {
  const keys = new Set(expenses.map((e) => monthKey(e.date)));
  keys.add(monthKey(new Date().toISOString()));
  return [...keys].sort().reverse();
}

export function buildMonthlyBreakdown(expenses, year, locale) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const inMonth = expenses.filter((e) => monthKey(e.date) === key);
    const spent = inMonth.reduce((s, e) => s + e.amount, 0);
    const label = new Date(Number(year), m - 1).toLocaleDateString(locale, {
      month: 'short',
    });
    months.push({ key, month: m, label, spent, count: inMonth.length });
  }
  return months;
}

export const TOTAL_BEDS = 74;
export const DEFAULT_THRESHOLD = 38.0; // demo assumption (°C), configurable in Reports
export const MORTALITY_BENCHMARK = 15;

const pad = (n) => String(n).padStart(2, "0");
export const uid = () => Math.random().toString(36).slice(2, 9);
export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const todayStr = () => dayKey();
export const shiftDay = (key, delta) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
};
export const fmtTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const admitted = (ps) => ps.filter((p) => p.status === "Admitted");
export const hasReadingToday = (p) => p.temps.some((t) => dayKey(t.ts) === todayStr());
export const hasVisitToday = (p) => p.visits.some((v) => dayKey(v.ts) === todayStr());
export const latestTemp = (p) => (p.temps.length ? p.temps.reduce((a, b) => (a.ts > b.ts ? a : b)) : null);
export const latestVisit = (p) => (p.visits.length ? p.visits.reduce((a, b) => (a.ts > b.ts ? a : b)) : null);

// "clear" = at least one reading and none at/above threshold; "missing" never counts as fever-free
export function dayStatus(p, key, th) {
  const r = p.temps.filter((t) => dayKey(t.ts) === key);
  if (!r.length) return "missing";
  return r.some((t) => t.temp >= th) ? "fever" : "clear";
}

// Consecutive fully completed fever-free days before today. A fever today resets to 0.
export function feverFreeStreak(p, th) {
  const today = todayStr();
  if (dayStatus(p, today, th) === "fever") return 0;
  let key = shiftDay(today, -1);
  let n = 0;
  while (dayStatus(p, key, th) === "clear") {
    n++;
    key = shiftDay(key, -1);
  }
  return n;
}
export const isEligible = (p, th) => feverFreeStreak(p, th) >= 3;

export const occupancy = (ps) => {
  const used = admitted(ps).length;
  return { used, free: TOTAL_BEDS - used, pct: Math.round((used / TOTAL_BEDS) * 100) };
};

export const freeBeds = (ps) => {
  const used = new Set(admitted(ps).map((p) => p.bed));
  return Array.from({ length: TOTAL_BEDS }, (_, i) => `B-${pad(i + 1)}`).filter((b) => !used.has(b));
};

// Pending outcomes are excluded from the denominator
export function mortality(ps) {
  const done = ps.filter((p) => p.outcome !== "Pending");
  const deaths = done.filter((p) => p.outcome === "Deceased").length;
  return {
    deaths,
    recovered: done.length - deaths,
    completed: done.length,
    pending: ps.length - done.length,
    rate: done.length ? (deaths / done.length) * 100 : 0,
  };
}

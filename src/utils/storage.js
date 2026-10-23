import { DEFAULT_THRESHOLD, dayKey, shiftDay, uid } from "./calculations";

const KEY = "caretrack:data:v1";
const FIRST = ["Aarav","Diya","Rohan","Meera","Kabir","Ananya","Vihaan","Ishita","Arjun","Saanvi","Neel","Tara","Dev","Kavya","Yash","Riya","Aditya","Nisha","Karan","Pooja","Sahil","Anika","Manav","Zoya"];
const LAST = ["Sharma","Patel","Iyer","Nair","Mehta","Reddy","Singh","Das","Kulkarni","Gupta","Joshi","Shah"];
const pad = (n) => String(n).padStart(2, "0");

function makeRng(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}
const at = (daysAgo, hour) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, Math.floor(Math.random() * 40), 0, 0);
  return d.toISOString();
};

function seed() {
  const r = makeRng(7);
  const name = (i) => `${FIRST[i % FIRST.length]} ${LAST[(i * 5 + 3) % LAST.length]}`;
  const patients = [];

  for (let i = 0; i < 74; i++) {
    const prof = i % 6; // 0,1 recovering well; 2 recent fever; 3 missed day; 4,5 ongoing
    const a = prof < 2 ? 5 + (i % 4) : 2 + (i % 6);
    const temps = [];
    const visits = [];
    for (let k = a; k >= 1; k--) {
      if (prof === 3 && k === 2) continue;
      let t = 36.5 + r() * 0.8;
      if (k === a) t = 38.3 + r() * 0.8;
      if (prof === 2 && k === 1) t = 38.4;
      if (prof >= 4 && k >= a - 1) t = 38 + r();
      temps.push({ id: uid(), temp: +t.toFixed(1), ts: at(k, 8), by: "Nurse", note: "" });
      if (k % 2 === 0) visits.push({ id: uid(), ts: at(k, 11), by: "Doctor", notes: "Patient stable. Continue monitoring." });
    }
    if (i % 2 === 0) temps.push({ id: uid(), temp: +(36.5 + r() * 0.7).toFixed(1), ts: at(0, 7), by: "Nurse", note: "" });
    if (i % 3 === 0) visits.push({ id: uid(), ts: at(0, 9), by: "Doctor", notes: "Morning round completed." });
    patients.push({
      id: `PT-${1001 + i}`, name: name(i), age: 22 + ((i * 7) % 58), bed: `B-${pad(i + 1)}`,
      admittedOn: shiftDay(dayKey(), -a), status: "Admitted", outcome: "Pending",
      recommended: false, temps, visits,
    });
  }
  for (let j = 0; j < 24; j++) {
    const dead = j % 6 === 5;
    patients.push({
      id: `PT-${900 + j}`, name: name(j + 11), age: 30 + ((j * 9) % 50), bed: null,
      admittedOn: shiftDay(dayKey(), -(14 + j)), dischargedOn: shiftDay(dayKey(), -(2 + (j % 9))),
      status: "Discharged", outcome: dead ? "Deceased" : "Recovered", recommended: false, temps: [], visits: [],
    });
  }
  return { patients, settings: { feverThreshold: DEFAULT_THRESHOLD } };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const d = seed();
  saveData(d);
  return d;
}
export function saveData(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}
export function resetData() {
  const d = seed();
  saveData(d);
  return d;
}

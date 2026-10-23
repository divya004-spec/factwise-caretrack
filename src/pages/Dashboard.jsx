import { BedDouble, Thermometer, Stethoscope, DoorOpen, Users, ShieldAlert } from "lucide-react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import {
  TOTAL_BEDS, MORTALITY_BENCHMARK, admitted, occupancy, hasReadingToday, hasVisitToday,
  isEligible, latestTemp, mortality, feverFreeStreak,
} from "../utils/calculations";

export default function Dashboard({ data, role, th, go }) {
  const ps = data.patients;
  const adm = admitted(ps);
  const occ = occupancy(ps);
  const m = mortality(ps);
  const pendT = adm.filter((p) => !hasReadingToday(p));
  const pendV = adm.filter((p) => !hasVisitToday(p));
  const ready = adm.filter((p) => isEligible(p, th));
  const awaitingAdmin = adm.filter((p) => p.recommended);

  const cellState = (p) => {
    const t = latestTemp(p);
    if (t && t.temp >= th && hasReadingToday(p)) return "red";
    if (isEligible(p, th)) return "teal";
    if (!hasReadingToday(p)) return "amber";
    return "navy";
  };
  const byBed = Object.fromEntries(adm.map((p) => [p.bed, p]));
  const beds = Array.from({ length: TOTAL_BEDS }, (_, i) => `B-${String(i + 1).padStart(2, "0")}`);

  const queues = {
    nurse: { title: "Temperature checks still to do", list: pendT, page: "temperature", cta: "Open temperature log" },
    doctor: { title: "Patients awaiting a doctor visit", list: pendV, page: "visits", cta: "Open doctor visits" },
    admin: { title: "Discharges recommended by doctors", list: awaitingAdmin, page: "discharges", cta: "Open discharges" },
  };
  const q = queues[role];

  return (
    <>
      <section className="grid stats">
        <StatCard icon={Users} label="Admitted patients" value={occ.used} hint={`of ${TOTAL_BEDS} beds`} onClick={() => go("patients")} />
        <StatCard icon={BedDouble} label="Available beds" value={occ.free} tone={occ.free === 0 ? "red" : "teal"} hint={occ.free === 0 ? "Facility is full" : "Ready for admission"} onClick={() => go("patients")} />
        <StatCard icon={Thermometer} label="Temperature pending" value={pendT.length} tone="amber" hint="Not measured today" onClick={() => role === "nurse" && go("temperature")} />
        <StatCard icon={Stethoscope} label="Doctor visits pending" value={pendV.length} tone="amber" hint="Not seen today" onClick={() => role === "doctor" && go("visits")} />
        <StatCard icon={DoorOpen} label="Discharge-ready" value={ready.length} tone="teal" hint="3 fever-free days" onClick={() => role !== "nurse" && go("discharges")} />
      </section>

      <section className="grid two">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Ward map</h2>
              <p className="muted">All {TOTAL_BEDS} beds at a glance. Hover a bed for the patient.</p>
            </div>
            <Badge tone={occ.pct >= 100 ? "red" : "blue"}>{occ.pct}% occupied</Badge>
          </div>
          <div className="ward">
            {beds.map((b) => {
              const p = byBed[b];
              return (
                <div key={b} className={`bed ${p ? cellState(p) : "free"}`} title={p ? `${b} · ${p.name} · ${latestTemp(p)?.temp ?? "–"}°C` : `${b} · vacant`}>
                  {b.slice(2)}
                </div>
              );
            })}
          </div>
          <div className="legend">
            <span><i className="bed navy" /> Checked today</span>
            <span><i className="bed amber" /> Check pending</span>
            <span><i className="bed red" /> Fever today</span>
            <span><i className="bed teal" /> Discharge-ready</span>
            <span><i className="bed free" /> Vacant</span>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h2>{q.title}</h2>
              <Badge tone="amber">{q.list.length}</Badge>
            </div>
            {q.list.length === 0 ? (
              <p className="empty">Nothing waiting. This queue is clear.</p>
            ) : (
              <ul className="queue">
                {q.list.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <span><b>{p.name}</b><small>{p.id} · Bed {p.bed}</small></span>
                    <Badge tone="grey">{feverFreeStreak(p, th)}/3 days</Badge>
                  </li>
                ))}
              </ul>
            )}
            <button className="btn ghost full" onClick={() => go(q.page)}>{q.cta}</button>
          </div>

          <div className={`card mort ${m.rate > MORTALITY_BENCHMARK ? "alert" : ""}`}>
            <div className="card-head">
              <h2>Mortality</h2>
              {m.rate > MORTALITY_BENCHMARK ? <Badge tone="red">Above {MORTALITY_BENCHMARK}% benchmark</Badge> : <Badge tone="green">Within benchmark</Badge>}
            </div>
            <div className="big">{m.rate.toFixed(1)}%</div>
            <p className="muted">{m.deaths} deaths of {m.completed} completed outcomes. {m.pending} still pending.</p>
            {role === "admin" && <button className="btn ghost full" onClick={() => go("reports")}><ShieldAlert size={16} /> View outcomes</button>}
          </div>
        </div>
      </section>
    </>
  );
}

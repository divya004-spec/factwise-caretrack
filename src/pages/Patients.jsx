import { useState } from "react";
import { Search, UserPlus, Skull } from "lucide-react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import {
  TOTAL_BEDS, admitted, freeBeds, hasReadingToday, hasVisitToday, latestTemp, fmtTime, todayStr, uid,
} from "../utils/calculations";

export default function Patients({ data, setData, role, notify, updatePatient, th }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Admitted");
  const [selId, setSelId] = useState(null);
  const [reg, setReg] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", bed: "" });
  const [confirmDeath, setConfirmDeath] = useState(false);

  const ps = data.patients;
  const free = freeBeds(ps);
  const full = admitted(ps).length >= TOTAL_BEDS;
  const rows = ps
    .filter((p) => status === "All" || p.status === status)
    .filter((p) => `${p.name} ${p.id} ${p.bed ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const sel = ps.find((p) => p.id === selId);

  const openReg = () => { setForm({ name: "", age: "", bed: free[0] ?? "" }); setReg(true); };
  const register = () => {
    const age = parseInt(form.age, 10);
    if (!form.name.trim() || !age || age < 0 || age > 120 || !form.bed) return notify("Enter a name, a valid age and a bed.", "warn");
    if (full) return notify("All 74 beds are occupied.", "warn");
    const nextNum = Math.max(1000, ...ps.map((p) => parseInt(p.id.slice(3), 10) || 0)) + 1;
    const p = {
      id: `PT-${nextNum}`, name: form.name.trim(), age, bed: form.bed, admittedOn: todayStr(),
      status: "Admitted", outcome: "Pending", recommended: false, temps: [], visits: [],
    };
    setData((d) => ({ ...d, patients: [p, ...d.patients] }));
    setReg(false);
    notify(`${p.name} admitted to bed ${p.bed}.`);
  };
  const markDeceased = () => {
    updatePatient(sel.id, (p) => ({ ...p, status: "Discharged", outcome: "Deceased", bed: null, recommended: false, dischargedOn: todayStr() }));
    notify(`Outcome recorded for ${sel.name}. Bed released.`);
    setConfirmDeath(false);
    setSelId(null);
  };

  return (
    <div className="card">
      <div className="toolbar">
        <div className="search"><Search size={16} /><input placeholder="Search name, ID or bed" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="seg">
          {["Admitted", "Discharged", "All"].map((s) => (
            <button key={s} className={status === s ? "on" : ""} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
        {role === "admin" && (
          <button className="btn primary" onClick={openReg} disabled={full} title={full ? "All beds are occupied" : ""}>
            <UserPlus size={16} /> Register patient
          </button>
        )}
      </div>
      {role === "admin" && full && <div className="note warn">All {TOTAL_BEDS} beds are occupied. Complete a discharge to free a bed before registering a new patient.</div>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Bed</th><th>Admitted</th><th>Today’s temp</th><th>Doctor visit</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const t = latestTemp(p);
              return (
                <tr key={p.id} onClick={() => setSelId(p.id)} className="click">
                  <td><b>{p.name}</b><small>{p.id} · {p.age} yrs</small></td>
                  <td>{p.bed ?? "–"}</td>
                  <td>{p.admittedOn}</td>
                  <td>{p.status !== "Admitted" ? "–" : hasReadingToday(p) ? <Badge tone={t.temp >= th ? "red" : "green"}>{t.temp}°C</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                  <td>{p.status !== "Admitted" ? "–" : hasVisitToday(p) ? <Badge tone="green">Seen</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                  <td>{p.status === "Admitted" ? <Badge tone="blue">Admitted</Badge> : <Badge tone={p.outcome === "Deceased" ? "red" : "grey"}>{p.outcome === "Deceased" ? "Deceased" : "Discharged"}</Badge>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan="6" className="empty">No patients match this search.</td></tr>}
          </tbody>
        </table>
      </div>

      {reg && (
        <Modal title="Register patient" onClose={() => setReg(false)} footer={<><button className="btn ghost" onClick={() => setReg(false)}>Cancel</button><button className="btn primary" onClick={register}>Admit patient</button></>}>
          <div className="field"><label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Synthetic patient name" /></div>
          <div className="row">
            <div className="field"><label>Age</label><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
            <div className="field"><label>Bed</label>
              <select value={form.bed} onChange={(e) => setForm({ ...form, bed: e.target.value })}>{free.map((b) => <option key={b}>{b}</option>)}</select>
            </div>
          </div>
          <p className="muted">{free.length} of {TOTAL_BEDS} beds available.</p>
        </Modal>
      )}

      {sel && (
        <Modal wide title={`${sel.name} · ${sel.id}`} onClose={() => { setSelId(null); setConfirmDeath(false); }}
          footer={role === "admin" && sel.status === "Admitted" && (confirmDeath
            ? <><span className="muted">Record death and release bed {sel.bed}?</span><button className="btn ghost" onClick={() => setConfirmDeath(false)}>Cancel</button><button className="btn danger" onClick={markDeceased}>Confirm</button></>
            : <button className="btn ghost danger-text" onClick={() => setConfirmDeath(true)}><Skull size={16} /> Record death</button>)}>
          <p className="muted">{sel.age} yrs · Bed {sel.bed ?? "–"} · Admitted {sel.admittedOn} · Outcome: {sel.outcome}</p>
          <div className="row top">
            <div>
              <h4>Temperature history</h4>
              {sel.temps.length === 0 ? <p className="empty">No readings recorded.</p> : (
                <ul className="history">{[...sel.temps].reverse().slice(0, 8).map((t) => (
                  <li key={t.id}><span>{fmtTime(t.ts)}</span><Badge tone={t.temp >= th ? "red" : "green"}>{t.temp}°C</Badge></li>
                ))}</ul>
              )}
            </div>
            <div>
              <h4>Doctor visits</h4>
              {sel.visits.length === 0 ? <p className="empty">No visits recorded.</p> : (
                <ul className="history">{[...sel.visits].reverse().slice(0, 5).map((v) => (
                  <li key={v.id} className="col"><span>{fmtTime(v.ts)}</span><small>{v.notes}</small></li>
                ))}</ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

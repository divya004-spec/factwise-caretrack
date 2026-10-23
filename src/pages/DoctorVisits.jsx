import { useState } from "react";
import { Search, Stethoscope } from "lucide-react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { admitted, hasVisitToday, latestTemp, fmtTime, feverFreeStreak, uid } from "../utils/calculations";

export default function DoctorVisits({ data, role, notify, updatePatient, th }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("pending");
  const [selId, setSelId] = useState(null);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const adm = admitted(data.patients);
  const done = adm.filter(hasVisitToday).length;
  const rows = adm
    .filter((p) => `${p.name} ${p.id} ${p.bed}`.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => (filter === "all" ? true : filter === "done" ? hasVisitToday(p) : !hasVisitToday(p)));
  const sel = data.patients.find((p) => p.id === selId);
  const canRecord = role === "doctor";

  const save = () => {
    if (notes.trim().length < 3) return setErr("Add a short clinical note before saving.");
    updatePatient(sel.id, (p) => ({ ...p, visits: [...p.visits, { id: uid(), ts: new Date().toISOString(), by: "Doctor", notes: notes.trim() }] }));
    notify(`Visit recorded for ${sel.name}.`);
    setSelId(null);
  };

  return (
    <div className="card">
      <div className="progress-row">
        <div><b>{done}</b> of {adm.length} seen today</div>
        <div className="bar"><i style={{ width: `${adm.length ? (done / adm.length) * 100 : 0}%` }} /></div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input placeholder="Search name, ID or bed" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="seg">
          {[["pending", "Awaiting visit"], ["done", "Seen"], ["all", "All"]].map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Bed</th><th>Latest temp</th><th>Fever-free</th><th>Visit</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const t = latestTemp(p);
              const s = feverFreeStreak(p, th);
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b><small>{p.id}</small></td>
                  <td>{p.bed}</td>
                  <td>{t ? <Badge tone={t.temp >= th ? "red" : "green"}>{t.temp}°C</Badge> : "–"}</td>
                  <td><Badge tone={s >= 3 ? "green" : "grey"}>{s}/3 days</Badge></td>
                  <td>{hasVisitToday(p) ? <Badge tone="green">Seen</Badge> : <Badge tone="amber">Awaiting</Badge>}</td>
                  <td className="right"><button className="btn sm primary" onClick={() => { setSelId(p.id); setNotes(""); setErr(""); }}>{canRecord ? "Record visit" : "View"}</button></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan="6" className="empty">No patients in this view.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && (
        <Modal wide title={`${sel.name} · Bed ${sel.bed}`} onClose={() => setSelId(null)}
          footer={canRecord ? <><button className="btn ghost" onClick={() => setSelId(null)}>Cancel</button><button className="btn primary" onClick={save}><Stethoscope size={16} /> Save visit</button></> : null}>
          <p className="muted">{sel.age} yrs · {feverFreeStreak(sel, th)} of 3 fever-free days completed</p>
          <div className="row top">
            <div>
              <h4>Temperature readings</h4>
              {sel.temps.length === 0 ? <p className="empty">No readings.</p> : (
                <ul className="history">{[...sel.temps].reverse().slice(0, 7).map((t) => (
                  <li key={t.id}><span>{fmtTime(t.ts)}</span><Badge tone={t.temp >= th ? "red" : "green"}>{t.temp}°C</Badge></li>
                ))}</ul>
              )}
            </div>
            <div>
              <h4>Previous visits</h4>
              {sel.visits.length === 0 ? <p className="empty">No visits yet.</p> : (
                <ul className="history">{[...sel.visits].reverse().slice(0, 4).map((v) => (
                  <li key={v.id} className="col"><span>{fmtTime(v.ts)}</span><small>{v.notes}</small></li>
                ))}</ul>
              )}
            </div>
          </div>
          {canRecord ? (
            <div className="field"><label>Clinical notes</label>
              <textarea rows="3" value={notes} onChange={(e) => { setNotes(e.target.value); setErr(""); }} placeholder="Observations, treatment, plan" />
              {err && <p className="error">{err}</p>}
            </div>
          ) : <p className="muted">Only doctors can record visits. Switch role to Doctor to record.</p>}
        </Modal>
      )}
    </div>
  );
}

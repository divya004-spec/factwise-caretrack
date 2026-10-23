import { useState } from "react";
import { Search, Thermometer, AlertTriangle } from "lucide-react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { admitted, hasReadingToday, latestTemp, fmtTime, dayKey, todayStr, uid } from "../utils/calculations";

export default function Temperature({ data, role, notify, updatePatient, th }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("pending");
  const [selId, setSelId] = useState(null);
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [err, setErr] = useState("");

  const adm = admitted(data.patients);
  const done = adm.filter(hasReadingToday).length;
  const rows = adm
    .filter((p) => `${p.name} ${p.id} ${p.bed}`.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => (filter === "all" ? true : filter === "done" ? hasReadingToday(p) : !hasReadingToday(p)));
  const sel = data.patients.find((p) => p.id === selId);
  const selDone = sel && hasReadingToday(sel);
  const num = parseFloat(val);
  const canRecord = role === "nurse";

  const open = (p) => { setSelId(p.id); setVal(""); setNote(""); setRepeat(false); setErr(""); };
  const save = () => {
    if (isNaN(num) || num < 34 || num > 43) return setErr("Enter a temperature between 34.0 and 43.0 °C.");
    if (selDone && !repeat) return setErr("A reading already exists today. Tick the box to record an authorized repeat.");
    updatePatient(sel.id, (p) => ({
      ...p, temps: [...p.temps, { id: uid(), temp: num, ts: new Date().toISOString(), by: "Nurse", note: note.trim(), repeat: !!selDone }],
    }));
    notify(`${sel.name}: ${num.toFixed(1)}°C recorded.`, num >= th ? "warn" : "ok");
    setSelId(null);
  };

  return (
    <div className="card">
      <div className="progress-row">
        <div><b>{done}</b> of {adm.length} checked today</div>
        <div className="bar"><i style={{ width: `${adm.length ? (done / adm.length) * 100 : 0}%` }} /></div>
      </div>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input placeholder="Search name, ID or bed" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="seg">
          {[["pending", "Pending"], ["done", "Completed"], ["all", "All"]].map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Bed</th><th>Latest reading</th><th>Today</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const t = latestTemp(p);
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b><small>{p.id}</small></td>
                  <td>{p.bed}</td>
                  <td>{t ? <>{t.temp >= th ? <Badge tone="red">{t.temp}°C</Badge> : <Badge tone="green">{t.temp}°C</Badge>} <small className="inline">{fmtTime(t.ts)}</small></> : "–"}</td>
                  <td>{hasReadingToday(p) ? <Badge tone="green">Completed</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                  <td className="right"><button className="btn sm primary" onClick={() => open(p)}>{canRecord ? (hasReadingToday(p) ? "Record again" : "Record") : "View"}</button></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan="5" className="empty">No patients in this view.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && (
        <Modal title={`${sel.name} · Bed ${sel.bed}`} onClose={() => setSelId(null)}
          footer={canRecord ? <><button className="btn ghost" onClick={() => setSelId(null)}>Cancel</button><button className="btn primary" onClick={save}><Thermometer size={16} /> Save reading</button></> : null}>
          {canRecord ? (
            <>
              {selDone && <div className="note warn"><AlertTriangle size={16} /> A reading was already recorded today.</div>}
              <div className="field"><label>Temperature (°C)</label>
                <input autoFocus type="number" step="0.1" value={val} onChange={(e) => { setVal(e.target.value); setErr(""); }} placeholder="36.8" />
                {!isNaN(num) && num >= th && <span className="hint red">At or above the {th.toFixed(1)}°C fever threshold.</span>}
              </div>
              <div className="field"><label>Note (optional)</label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. measured after medication" /></div>
              {selDone && <label className="check"><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> This is an authorized repeat measurement</label>}
              {err && <p className="error">{err}</p>}
            </>
          ) : <p className="muted">Only nurses can record temperatures. Switch role to Nurse to record.</p>}
          <h4>Recent readings</h4>
          {sel.temps.length === 0 ? <p className="empty">No readings yet.</p> : (
            <ul className="history">{[...sel.temps].reverse().slice(0, 5).map((t) => (
              <li key={t.id}><span>{fmtTime(t.ts)}{dayKey(t.ts) === todayStr() ? " · today" : ""}</span><Badge tone={t.temp >= th ? "red" : "green"}>{t.temp}°C</Badge></li>
            ))}</ul>
          )}
        </Modal>
      )}
    </div>
  );
}

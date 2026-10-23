import { useState } from "react";
import { DoorOpen, Undo2 } from "lucide-react";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { admitted, isEligible, feverFreeStreak, todayStr } from "../utils/calculations";

export default function Discharges({ data, role, notify, updatePatient, th }) {
  const [tab, setTab] = useState("eligible");
  const [confirm, setConfirm] = useState(null);

  const adm = admitted(data.patients);
  const eligible = adm.filter((p) => isEligible(p, th));
  const progress = adm.filter((p) => !isEligible(p, th)).sort((a, b) => feverFreeStreak(b, th) - feverFreeStreak(a, th));
  const rows = tab === "eligible" ? eligible : progress;

  const recommend = (p) => { updatePatient(p.id, (x) => ({ ...x, recommended: true })); notify(`Discharge recommended for ${p.name}.`); };
  const withdraw = (p) => { updatePatient(p.id, (x) => ({ ...x, recommended: false })); notify(`Recommendation withdrawn for ${p.name}.`, "warn"); };
  const complete = () => {
    updatePatient(confirm.id, (x) => ({ ...x, status: "Discharged", outcome: "Recovered", recommended: false, dischargedOn: todayStr(), bed: null }));
    notify(`${confirm.name} discharged. Bed ${confirm.bed} is now free.`);
    setConfirm(null);
  };

  return (
    <div className="card">
      <div className="note info">A patient is eligible after three full fever-free days (below {th.toFixed(1)}°C). A missing daily reading never counts as fever-free, and any fever resets the count.</div>
      <div className="toolbar">
        <div className="seg">
          <button className={tab === "eligible" ? "on" : ""} onClick={() => setTab("eligible")}>Eligible ({eligible.length})</button>
          <button className={tab === "progress" ? "on" : ""} onClick={() => setTab("progress")}>Not yet eligible ({progress.length})</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Bed</th><th>Fever-free days</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const s = Math.min(feverFreeStreak(p, th), 3);
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b><small>{p.id}</small></td>
                  <td>{p.bed}</td>
                  <td><span className="dots">{[0, 1, 2].map((i) => <i key={i} className={i < s ? "on" : ""} />)}</span> <small className="inline">{feverFreeStreak(p, th)} days</small></td>
                  <td>{tab !== "eligible" ? <Badge tone="grey">Monitoring</Badge> : p.recommended ? <Badge tone="blue">Doctor recommended</Badge> : <Badge tone="amber">Awaiting doctor</Badge>}</td>
                  <td className="right">
                    {tab === "eligible" && role === "doctor" && (p.recommended
                      ? <button className="btn sm ghost" onClick={() => withdraw(p)}><Undo2 size={14} /> Withdraw</button>
                      : <button className="btn sm primary" onClick={() => recommend(p)}>Recommend discharge</button>)}
                    {tab === "eligible" && role === "admin" && (
                      <button className="btn sm primary" disabled={!p.recommended} title={p.recommended ? "" : "Needs doctor recommendation"} onClick={() => setConfirm(p)}>Complete discharge</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan="5" className="empty">No patients in this list.</td></tr>}
          </tbody>
        </table>
      </div>

      {confirm && (
        <Modal title="Complete discharge" onClose={() => setConfirm(null)}
          footer={<><button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button><button className="btn primary" onClick={complete}><DoorOpen size={16} /> Discharge and release bed</button></>}>
          <p>Discharge <b>{confirm.name}</b> ({confirm.id}) as <b>Recovered</b>? Bed <b>{confirm.bed}</b> will become available for a new admission.</p>
        </Modal>
      )}
    </div>
  );
}

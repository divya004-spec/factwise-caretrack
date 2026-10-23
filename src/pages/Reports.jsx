import { RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import Badge from "../components/Badge";
import { MORTALITY_BENCHMARK, mortality } from "../utils/calculations";

export default function Reports({ data, setData, notify, reset, th }) {
  const m = mortality(data.patients);
  const over = m.rate > MORTALITY_BENCHMARK;
  const done = data.patients.filter((p) => p.outcome !== "Pending");

  return (
    <>
      <section className="grid two">
        <div className={`card mort ${over ? "alert" : ""}`}>
          <div className="card-head">
            <h2>Mortality rate</h2>
            {over ? <Badge tone="red">Above benchmark</Badge> : <Badge tone="green">Within benchmark</Badge>}
          </div>
          <div className="big">{m.rate.toFixed(1)}%</div>
          <div className="gauge">
            <i className={over ? "red" : "teal"} style={{ width: `${Math.min(m.rate, 100)}%` }} />
            <span className="mark" style={{ left: `${MORTALITY_BENCHMARK}%` }}><em>{MORTALITY_BENCHMARK}%</em></span>
          </div>
          <p className="note-line">{over ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />} {over ? `Mortality exceeds the ${MORTALITY_BENCHMARK}% benchmark. Review clinical processes.` : `Mortality is under the ${MORTALITY_BENCHMARK}% benchmark.`}</p>
        </div>
        <div className="card">
          <h2>Outcome summary</h2>
          <div className="kv"><span>Deaths</span><b>{m.deaths}</b></div>
          <div className="kv"><span>Recovered</span><b>{m.recovered}</b></div>
          <div className="kv"><span>Completed outcomes</span><b>{m.completed}</b></div>
          <div className="kv"><span>Pending (excluded)</span><b>{m.pending}</b></div>
          <p className="muted">Rate = deaths ÷ completed outcomes × 100.</p>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Fever threshold</h2>
          <p className="muted">Demo assumption used for discharge eligibility. The facility must confirm the real value.</p>
          <div className="field inline"><input type="number" step="0.1" min="36" max="41" value={th}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setData((d) => ({ ...d, settings: { ...d.settings, feverThreshold: v } })); }} /> <span>°C</span></div>
        </div>
        <div className="card">
          <h2>Demo data</h2>
          <p className="muted">Everything is synthetic and stored only in this browser. Reset to restore the starting 74 admissions.</p>
          <button className="btn ghost" onClick={() => { reset(); notify("Demo data reset."); }}><RotateCcw size={16} /> Reset demo data</button>
        </div>
      </section>

      <div className="card">
        <h2>Completed outcomes</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Admitted</th><th>Discharged</th><th>Outcome</th></tr></thead>
            <tbody>{done.map((p) => (
              <tr key={p.id}><td><b>{p.name}</b><small>{p.id}</small></td><td>{p.admittedOn}</td><td>{p.dischargedOn ?? "–"}</td>
                <td><Badge tone={p.outcome === "Deceased" ? "red" : "green"}>{p.outcome}</Badge></td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

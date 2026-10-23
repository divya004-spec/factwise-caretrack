import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Thermometer, Stethoscope, DoorOpen, BarChart3, CheckCircle2, AlertTriangle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Temperature from "./pages/Temperature";
import DoctorVisits from "./pages/DoctorVisits";
import Discharges from "./pages/Discharges";
import Reports from "./pages/Reports";
import { loadData, saveData, resetData } from "./utils/storage";

const N = {
  dashboard: { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  patients: { id: "patients", label: "Patients", icon: Users },
  temperature: { id: "temperature", label: "Temperature", icon: Thermometer },
  visits: { id: "visits", label: "Doctor visits", icon: Stethoscope },
  discharges: { id: "discharges", label: "Discharges", icon: DoorOpen },
  reports: { id: "reports", label: "Outcomes", icon: BarChart3 },
};
const NAV = {
  nurse: [N.dashboard, N.temperature, N.patients],
  doctor: [N.dashboard, N.visits, N.discharges, N.patients],
  admin: [N.dashboard, N.patients, N.discharges, N.reports],
};
const PAGES = { dashboard: Dashboard, patients: Patients, temperature: Temperature, visits: DoctorVisits, discharges: Discharges, reports: Reports };

export default function App() {
  const [data, setData] = useState(loadData);
  const [role, setRoleState] = useState(() => localStorage.getItem("caretrack:role") || "nurse");
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  useEffect(() => saveData(data), [data]);

  const setRole = (r) => {
    setRoleState(r);
    try { localStorage.setItem("caretrack:role", r); } catch {}
    if (!NAV[r].some((n) => n.id === page)) setPage("dashboard");
  };
  const notify = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const updatePatient = (id, fn) =>
    setData((d) => ({ ...d, patients: d.patients.map((p) => (p.id === id ? fn(p) : p)) }));

  const ctx = {
    data, setData, role, notify, updatePatient, go: setPage,
    th: data.settings.feverThreshold,
    reset: () => setData(resetData()),
  };
  const Page = PAGES[page];
  const title = NAV[role].find((n) => n.id === page)?.label ?? "Overview";

  return (
    <div className="app">
      <Sidebar nav={NAV[role]} page={page} setPage={setPage} role={role} />
      <div className="main">
        <Topbar title={title} role={role} setRole={setRole} />
        <main className="content"><Page {...ctx} /></main>
      </div>
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.type === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {toast.msg}
        </div>
      )}
    </div>
  );
}

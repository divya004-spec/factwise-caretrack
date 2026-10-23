import { HeartPulse } from "lucide-react";

export default function Sidebar({ nav, page, setPage, role }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><HeartPulse size={20} /></span>
        <div>
          <strong>CareTrack</strong>
          <small>by FactWise</small>
        </div>
      </div>
      <nav>
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
            <Icon size={18} /> <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="side-foot">Signed in as <b>{role}</b><br />Demo data · stored in this browser</div>
    </aside>
  );
}

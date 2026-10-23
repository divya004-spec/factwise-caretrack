import { CalendarDays } from "lucide-react";

export default function Topbar({ title, role, setRole }) {
  const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="muted"><CalendarDays size={14} /> {date}</p>
      </div>
      <label className="role-switch">
        <span>Viewing as</span>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="nurse">Nurse</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </label>
    </header>
  );
}

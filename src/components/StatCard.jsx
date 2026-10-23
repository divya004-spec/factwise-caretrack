export default function StatCard({ icon: Icon, label, value, hint, tone = "navy", onClick }) {
  return (
    <button className={`stat ${tone}`} onClick={onClick}>
      <span className="stat-icon"><Icon size={20} /></span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </button>
  );
}

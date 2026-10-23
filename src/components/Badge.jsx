export default function Badge({ tone = "grey", children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

import './StatCard.scss';

export default function StatCard({ label, value, icon = 'KPI', tone = 'indigo', hint = '' }) {
  return (
    <article className={`stat-card stat-card-modern tone-${tone}`}>
      <div className="stat-card-top">
        <p>{label}</p>
        <span className="stat-icon">{icon}</span>
      </div>
      <h3>{value}</h3>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

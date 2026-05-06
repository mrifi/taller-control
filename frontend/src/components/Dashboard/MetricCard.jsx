function MetricCard({ title, value, detail, icon: Icon, tone = 'blue' }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-main">
        <div className="metric-icon">{Icon ? <Icon size={20} /> : null}</div>
        <div>
          <p>{title}</p>
          <strong>{value}</strong>
          {detail ? <span>{detail}</span> : null}
        </div>
      </div>
      <div className="metric-sparkline" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

export default MetricCard;

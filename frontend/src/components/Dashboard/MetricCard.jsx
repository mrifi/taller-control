function MetricCard({ title, value, detail, icon: Icon, tone = 'blue' }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon">{Icon ? <Icon size={20} /> : null}</div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </article>
  );
}

export default MetricCard;

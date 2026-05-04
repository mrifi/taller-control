function PlaceholderPage({ title, description }) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-panel">
        <p className="eyebrow">Modulo</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

export default PlaceholderPage;

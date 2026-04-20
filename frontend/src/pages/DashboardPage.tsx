export function DashboardPage() {
  return (
    <section>
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Overview</p>
          <h2 className="page-header__title">POS Dashboard</h2>
        </div>
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">Today Revenue</span>
          <strong className="stat-card__value">25,400,000 d</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Orders</span>
          <strong className="stat-card__value">128</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Products</span>
          <strong className="stat-card__value">342</strong>
        </article>
      </div>
    </section>
  )
}

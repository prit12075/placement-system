/* Glassmorphic Stats Card with Hover Animation */
export function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  trend = 'up',
  color = 'accent'
}) {
  return (
    <div className="stats-card" data-color={color}>
      <div className="stats-glow"></div>
      <div className="stats-grid">
        <div className="stats-icon" data-color={color}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div className="stats-content">
          <p className="stats-label">{label}</p>
          <h3 className="stats-value">{value}</h3>
          {change && (
            <span className={`stats-change ${trend}`}>
              {trend === 'up' ? '↑' : '↓'} {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

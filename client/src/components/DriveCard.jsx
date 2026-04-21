import { MapPin, Calendar, TrendingUp, Users, ChevronRight } from 'lucide-react';

export function DriveCard({
  company,
  role,
  location,
  date,
  salaryMin,
  salaryMax,
  applications,
  positions,
  status,
  onView
}) {
  const statusColors = {
    upcoming: { bg: 'rgb(139 92 246 / 0.1)', text: 'rgb(139 124 246)', dot: '#8b7cf6' },
    ongoing: { bg: 'rgb(251 191 36 / 0.1)', text: 'rgb(251 191 36)', dot: '#fbbf24' },
    completed: { bg: 'rgb(107 114 128 / 0.1)', text: 'rgb(156 163 175)', dot: '#6b7280' }
  };

  const colors = statusColors[status] || statusColors.upcoming;

  return (
    <button
      onClick={onView}
      className="drive-card-btn"
    >
      <div className="drive-card">
        <div className="drive-header">
          <div className="drive-status-dot" style={{ backgroundColor: colors.dot }}></div>
          <span className="drive-status" style={colors}>
            {status}
          </span>
        </div>

        <div className="drive-company">{company}</div>
        <h3 className="drive-title">{role}</h3>

        <div className="drive-meta">
          <div className="meta-item">
            <MapPin size={14} />
            {location}
          </div>
          <div className="meta-item">
            <Calendar size={14} />
            {date}
          </div>
        </div>

        <div className="drive-salary">
          <div className="salary-label">Package</div>
          <div className="salary-value">
            ₹{salaryMin}L — ₹{salaryMax}L
          </div>
        </div>

        <div className="drive-stats">
          <div className="stat">
            <Users size={14} />
            <span>{applications} applied</span>
          </div>
          <div className="stat">
            <TrendingUp size={14} />
            <span>{positions} open</span>
          </div>
        </div>

        <div className="drive-action">
          View Details <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
}

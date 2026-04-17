import React from 'react';
import '../../styles/dashboard.css';

/**
 * StatsCard — reusable metric card
 *
 * Props:
 *   icon      string   — emoji or symbol
 *   label     string   — metric name
 *   value     string   — formatted value (e.g. "₹1,24,500")
 *   trend     number   — percentage change (positive = up, negative = down)
 *   trendLabel string  — e.g. "vs last month"
 *   color     string   — "green" | "red" | "purple" | "olive"
 *   subText   string   — optional bottom line
 *   loading   bool     — show skeleton
 */
const StatsCard = ({
  icon = '📊',
  label = 'Metric',
  value = '—',
  trend = null,
  trendLabel = 'vs last month',
  color = 'purple',
  subText,
  loading = false,
}) => {
  const isUp = trend > 0;
  const isDown = trend < 0;

  if (loading) {
    return (
      <div className={`stat-card ${color}`}>
        <div className="stat-top">
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 20 }} />
        </div>
        <div className="skeleton" style={{ width: '70%', height: 36, marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: '45%', height: 16, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        {trend !== null && (
          <span className={`stat-trend ${isUp ? 'up' : isDown ? 'down' : ''}`}>
            {isUp ? '↑' : isDown ? '↓' : '—'}
            {trend !== null ? ` ${Math.abs(trend)}%` : ''}
          </span>
        )}
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>

      {(subText || (trend !== null && trendLabel)) && (
        <div className="stat-sub">
          {subText || (
            <>
              <strong
                style={{ color: isUp ? 'var(--green)' : isDown ? 'var(--red)' : 'var(--text-3)' }}
              >
                {isUp ? '+' : ''}{trend}%
              </strong>{' '}
              {trendLabel}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
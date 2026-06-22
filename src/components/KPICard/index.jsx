import './KPICard.css';

/* ── Inline Circular Gauge ───────────────────────────── */
function CircularGauge({ value = 0, size = 52 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="kpi-gauge">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#E5E7EB" strokeWidth={4}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#22C55E"
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/* ── KPICard ─────────────────────────────────────────── */
/**
 * variant: 'change' | 'badge' | 'progress' | 'gauge'
 *
 * change  → changeValue (string), changeType ('positive' | 'negative')
 * badge   → badgeText, badgeType ('danger' | 'warning' | 'info')
 * progress→ progressValue (0-100), progressColor (hex)
 * gauge   → gaugeValue (0-100), subLabel, subLabelColor
 */
export default function KPICard({
  label,
  value,
  variant = 'change',
  /* change */
  changeValue,
  changeType = 'positive',
  /* badge */
  badgeText,
  badgeType = 'danger',
  /* progress */
  progressValue = 0,
  progressColor = '#22C55E',
  /* gauge */
  gaugeValue = 0,
  subLabel,
  subLabelColor,
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__label">{label}</div>

      <div className="kpi-card__body">
        <span className="kpi-card__value">{value}</span>

        {variant === 'gauge' && (
          <CircularGauge value={gaugeValue} />
        )}
      </div>

      {variant === 'change' && changeValue && (
        <div className={`kpi-card__change kpi-card__change--${changeType}`}>
          {changeValue}
        </div>
      )}

      {variant === 'badge' && badgeText && (
        <div className={`kpi-card__badge kpi-card__badge--${badgeType}`}>
          {badgeText}
        </div>
      )}

      {variant === 'progress' && (
        <div className="kpi-card__progress-track">
          <div
            className="kpi-card__progress-fill"
            style={{ width: `${progressValue}%`, background: progressColor }}
          />
        </div>
      )}

      {subLabel && (
        <div className="kpi-card__sub-label" style={{ color: subLabelColor }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

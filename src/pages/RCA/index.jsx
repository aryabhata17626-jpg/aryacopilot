import { useState } from 'react';
import KPICard from '../../components/KPICard/index.jsx';
import './RootCauseAnalysis.css';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const TIMELINE = [
  { time: '14:18', label: 'CPU Utilization', sub: '88%',      sev: 'healthy'  },
  { time: '14:20', label: 'Packet Loss',      sub: '5%',       sev: 'warning'  },
  { time: '14:22', label: 'Queue Overflow',   sub: 'Detected', sev: 'warning'  },
  { time: '14:28', label: 'Tunnel Restart',   sub: 'Failure',  sev: 'critical' },
  { time: '14:32', label: 'Failure Predicted',sub: null,       sev: 'critical' },
];

const DEP_CHAIN    = ['CORE-R2', 'CORE-R3', 'FW-01', 'APP-S2'];
const DEP_SERVICES = [
  { label: 'Telemetry', mod: 'tele' },
  { label: 'VPN',       mod: 'vpn'  },
  { label: 'MPLS',      mod: 'mpls' },
  { label: 'Database',  mod: 'db'   },
];

/* SVG Correlation Graph — viewBox 0 0 380 290 */
const GNODES = [
  /* id,  x,   y,   w,   h,   lines,                  col,       bg        tip                              */
  ['cr3',  151, 10,  76,  26,  ['CORE-R3'],            '#22C55E', '#F0FDF4', 'CORE-R3 · Incident origin'],
  ['cpu',  16,  86,  84,  38,  ['CPU','SPIKE'],         '#F59E0B', '#FFFBEB', 'CPU 95% — threshold exceeded'],
  ['pkt',  145, 86,  88,  38,  ['PACKET','LOSS'],       '#F59E0B', '#FFFBEB', 'Packet loss 7% — link degraded'],
  ['que',  285, 86,  86,  38,  ['QUEUE','OVERFLOW'],    '#FF6B00', '#FFF3E8', 'Buffer 89/100 — near exhaustion'],
  ['osp',  16,  182, 84,  38,  ['OSPF','LOSS'],         '#F59E0B', '#FFFBEB', 'OSPF adjacency lost'],
  ['tun',  145, 182, 88,  38,  ['TUNNEL','RESTART'],    '#FF6B00', '#FFF3E8', 'MPLS tunnel restarted ×4'],
  ['rot',  285, 182, 86,  38,  ['ROUTER','FAILURE'],    '#EF4444', '#FFF5F5', 'CORE-R2 — service down'],
  ['cr2',  320, 256, 60,  24,  ['CORE-R2'],             '#EF4444', '#FFF5F5', 'Downstream device'],
];

// [x1, y1, x2, y2, color, markerId, delay]
const GEDGES = [
  [189, 36,  58,  86,  '#9CA3AF', 'am-gr',  0.0],
  [100, 105, 145, 105, '#F59E0B', 'am-wa',  0.2],
  [233, 105, 285, 105, '#F59E0B', 'am-wa',  0.4],
  [58,  124, 58,  182, '#F59E0B', 'am-wa',  0.6],
  [328, 124, 328, 182, '#FF6B00', 'am-or',  0.8],
  [100, 201, 145, 201, '#FF6B00', 'am-or',  1.0],
  [233, 201, 285, 201, '#EF4444', 'am-cr',  1.2],
  [328, 220, 350, 256, '#EF4444', 'am-cr',  1.4],
];

const EVIDENCE = [
  { label: 'CPU Usage',        value: '>95%', hi: true  },
  { label: 'Packet Loss',      value: '7%',   hi: false },
  { label: 'Queue Depth',      value: '81',   hi: false },
  { label: 'Tunnel Restarts',  value: '4',    hi: false },
];

const SIMILAR = [
  { id: '044', sim: 96, res: 'Firmware Update',   col: '#22C55E' },
  { id: '031', sim: 91, res: 'Re-balancing OSPF', col: '#F59E0B' },
];

const ACTIONS = [
  'Increase Queue Buffer',
  'Restart MPLS Tunnel',
  'Reduce Polling',
  'Move Telemetry',
];

/* ══════════════════════════════════════════════════════
   IncidentTimeline
══════════════════════════════════════════════════════ */
function IncidentTimeline() {
  return (
    <section className="rca-panel" aria-label="Incident Timeline">
      <header className="rca-panel__hd">
        <h2 className="rca-panel__ttl">INCIDENT TIMELINE</h2>
      </header>
      <div className="rca-tl">
        {TIMELINE.map((ev, i) => (
          <div key={i} className="rca-tl__item">
            <div className="rca-tl__track">
              <span className={`rca-tl__dot rca-tl__dot--${ev.sev}`} />
              {i < TIMELINE.length - 1 && <span className="rca-tl__line" />}
            </div>
            <div className="rca-tl__body">
              <span className="rca-tl__time">{ev.time}</span>
              <span className={`rca-tl__label${ev.sev === 'critical' ? ' rca-tl__label--crit' : ''}`}>
                {ev.label}
              </span>
              {ev.sub && (
                <span className={`rca-tl__sub rca-tl__sub--${ev.sev}`}>{ev.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   DependencyImpact
══════════════════════════════════════════════════════ */
function DependencyImpact() {
  return (
    <section className="rca-panel" aria-label="Dependency Impact">
      <header className="rca-panel__hd">
        <h2 className="rca-panel__ttl">DEPENDENCY IMPACT</h2>
      </header>
      <div className="rca-dep">
        <div className="rca-dep__chain">
          {DEP_CHAIN.map((node, i) => (
            <span key={node} className="rca-dep__chain-item">
              <span className="rca-dep__node">{node}</span>
              {i < DEP_CHAIN.length - 1 && (
                <span className="rca-dep__arrow">→</span>
              )}
            </span>
          ))}
        </div>
        <div className="rca-dep__services">
          {DEP_SERVICES.map(s => (
            <span key={s.mod} className={`rca-svc rca-svc--${s.mod}`}>{s.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   EventCorrelationGraph — SVG flow diagram
══════════════════════════════════════════════════════ */
function EventCorrelationGraph() {
  const [hov, setHov] = useState(null);
  const hovNode = GNODES.find(n => n[0] === hov);

  return (
    <section className="rca-panel" aria-label="Event Correlation Graph">
      <header className="rca-panel__hd">
        <h2 className="rca-panel__ttl">EVENT CORRELATION GRAPH</h2>
        <div className="rca-graph__legend">
          <span className="rca-leg rca-leg--h">● Healthy</span>
          <span className="rca-leg rca-leg--w">● Warning</span>
          <span className="rca-leg rca-leg--c">● Critical</span>
        </div>
      </header>
      <div className="rca-graph__wrap">
        <svg viewBox="0 0 380 290" width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <defs>
            {[
              ['am-gr', '#9CA3AF'],
              ['am-wa', '#F59E0B'],
              ['am-or', '#FF6B00'],
              ['am-cr', '#EF4444'],
            ].map(([id, col]) => (
              <marker
                key={id} id={id}
                markerWidth="5" markerHeight="5"
                refX="4.5" refY="2.5"
                orient="auto"
              >
                <polygon points="0,0.5 4.5,2.5 0,4.5" fill={col} />
              </marker>
            ))}
          </defs>

          {/* ── Edges ── */}
          {GEDGES.map(([x1, y1, x2, y2, col, mid, delay], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={col} strokeWidth="1.5"
              strokeDasharray="6 4"
              markerEnd={`url(#${mid})`}
              className="rca-edge"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}

          {/* ── Nodes ── */}
          {GNODES.map(([id, x, y, w, h, lines, col, bg, tip]) => {
            const isHov = hov === id;
            const cx    = x + w / 2;
            const cy    = y + h / 2;
            return (
              <g
                key={id}
                onMouseEnter={() => setHov(id)}
                onMouseLeave={() => setHov(null)}
                style={{ cursor: 'pointer' }}
                aria-label={tip}
              >
                {isHov && (
                  <rect
                    x={x - 3} y={y - 3}
                    width={w + 6} height={h + 6}
                    rx="7" fill="none"
                    stroke={col} strokeWidth="1" opacity="0.35"
                  />
                )}
                <rect
                  x={x} y={y} width={w} height={h} rx="5"
                  fill={isHov ? col + '22' : bg}
                  stroke={col}
                  strokeWidth={isHov ? 2 : 1.5}
                />
                {/* Status dot */}
                <circle cx={x + w - 8} cy={y + 8} r="3" fill={col} />
                {/* Text lines */}
                {lines.map((ln, li) => (
                  <text
                    key={li}
                    x={cx - 4}
                    y={cy + (lines.length > 1 ? (li - 0.5) * 10 : 0) + 4}
                    textAnchor="middle"
                    fontSize={lines.length > 1 ? 7.5 : 8.5}
                    fontWeight="700"
                    fill={col}
                    fontFamily="Inter, system-ui, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {ln}
                  </text>
                ))}
              </g>
            );
          })}

          {/* ── SVG Tooltip ── */}
          {hovNode && (() => {
            const [id, x, y, w, h,, col,, tip] = hovNode;
            const tx  = x + w / 2;
            const tw  = Math.max(tip.length * 5.6, 120);
            const below = y < 60;
            const ty  = below ? y + h + 6 : y - 6;
            return (
              <g key="tooltip" style={{ pointerEvents: 'none' }}>
                <rect
                  x={Math.min(Math.max(tx - tw / 2, 2), 378 - tw)}
                  y={below ? ty : ty - 20}
                  width={tw} height={20} rx="4"
                  fill="#1F2937" opacity="0.92"
                />
                <text
                  x={Math.min(Math.max(tx, tw / 2 + 2), 378 - tw / 2)}
                  y={below ? ty + 14 : ty - 6}
                  textAnchor="middle"
                  fontSize="8" fill="#F9FAFB"
                  fontFamily="Inter, sans-serif"
                >
                  {tip}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   AIAnalysisPanel
══════════════════════════════════════════════════════ */
function AIAnalysisPanel() {
  return (
    <section className="rca-panel rca-ai" aria-label="AryaCopilot AI Analysis">
      <header className="rca-ai__hd">
        <span className="rca-ai__icon">⬡</span>
        <span className="rca-ai__ttl">ARYACOPILOT AI ANALYSIS</span>
        <span className="rca-ai__badge">91%</span>
      </header>
      <div className="rca-ai__body">
        <p>
          Analysis confirms a cascading failure initiated by a CPU spike on
          CORE-R3. High utilization triggered queue overflow leading to packet drops.
        </p>
        <p>
          This destabilized OSPF adjacency which resulted in repeated MPLS tunnel
          restarts. The system predicted service impact{' '}
          <strong>18&nbsp;minutes</strong> before actual outage.
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   RootCausePanel — confidence arc + evidence
══════════════════════════════════════════════════════ */
function RootCausePanel() {
  const R    = 38;
  const circ = 2 * Math.PI * R;
  const off  = circ * (1 - 0.91);

  return (
    <section className="rca-panel" aria-label="Root Cause Analysis">
      <header className="rca-panel__hd">
        <h2 className="rca-panel__ttl">ROOT CAUSE ANALYSIS</h2>
      </header>
      <div className="rca-rc__body">
        {/* Confidence Ring */}
        <div className="rca-arc-wrap">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={R} fill="none" stroke="#F3F4F6" strokeWidth="7" />
            <circle
              cx="48" cy="48" r={R}
              fill="none"
              stroke="#FF6B00"
              strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={off}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              className="rca-arc"
            />
            <text x="48" y="52" textAnchor="middle" fontSize="15" fontWeight="800" fill="#111827">91%</text>
            <text x="48" y="63" textAnchor="middle" fontSize="7" fontWeight="700" fill="#9CA3AF" fontFamily="Inter, sans-serif">CONF</text>
          </svg>
        </div>

        {/* Root Cause Name */}
        <div className="rca-rc__name">OSPF Route Flapping</div>
        <div className="rca-rc__desc">
          Triggered by resource exhaustion and repeated queue overflows.
        </div>

        {/* Evidence */}
        <div className="rca-ev__hd">EVIDENCE METRICS</div>
        <div className="rca-evidence">
          {EVIDENCE.map(e => (
            <div key={e.label} className="rca-ev__row">
              <span className="rca-ev__lbl">{e.label}</span>
              <span className={`rca-ev__val${e.hi ? ' rca-ev__val--hi' : ''}`}>
                {e.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   SimilarIncidents
══════════════════════════════════════════════════════ */
function SimilarIncidents() {
  return (
    <section className="rca-panel" aria-label="Similar Incidents">
      <header className="rca-panel__hd">
        <h2 className="rca-panel__ttl">SIMILAR INCIDENTS</h2>
      </header>
      <div className="rca-sim__body">
        {SIMILAR.map(inc => (
          <div key={inc.id} className="rca-sim__card">
            <div className="rca-sim__row">
              <span className="rca-sim__id">Incident {inc.id}</span>
              <span
                className="rca-sim__pct"
                style={{ background: inc.col + '20', color: inc.col }}
              >
                {inc.sim}% MATCH
              </span>
            </div>
            <div className="rca-sim__res">Resolution: {inc.res}</div>
            <button
              className="rca-sim__btn"
              id={`btn-view-inc-${inc.id}`}
            >
              VIEW MATCH
            </button>
          </div>
        ))}
        <button className="rca-hist__btn" id="btn-view-history">
          VIEW INCIDENT HISTORY
        </button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   MitigationPlan
══════════════════════════════════════════════════════ */
function MitigationPlan() {
  return (
    <section className="rca-panel rca-mit" aria-label="Mitigation Plan">
      <header className="rca-panel__hd">
        <h2 className="rca-panel__ttl">MITIGATION PLAN</h2>
      </header>
      <div className="rca-mit__body">
        {ACTIONS.map((action, i) => (
          <div key={i} className="rca-mit__row">
            <span className="rca-mit__bullet">○</span>
            <span className="rca-mit__lbl">{action}</span>
          </div>
        ))}
      </div>
      <div className="rca-mit__footer">
        <button id="btn-gen-report" className="rca-cta-btn">
          GENERATE INCIDENT REPORT
        </button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function RootCauseAnalysis() {
  return (
    <div className="rca-page">

      {/* ── Page Header ── */}
      <div className="rca-header">
        <h1 className="rca-header__title">ROOT CAUSE ANALYSIS</h1>
        <p className="rca-header__sub">
          Event Correlation and Explainable Diagnostics
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="rca-kpi-row">
        <KPICard
          label="Incident ID"
          value="INC-2024-104"
          variant="badge"
          badgeText="OPEN"
          badgeType="danger"
        />
        <KPICard
          label="Affected Devices"
          value="4 Nodes"
          variant="badge"
          badgeText="IMPACTED"
          badgeType="warning"
        />
        <KPICard
          label="Confidence"
          value="91%"
          variant="gauge"
          gaugeValue={91}
          subLabel="HIGH CONFIDENCE"
          subLabelColor="#22C55E"
        />
        <KPICard
          label="Downtime Avoided"
          value="18 Minutes"
          variant="badge"
          badgeText="PREVENTED"
          badgeType="info"
        />
      </div>

      {/* ── 3-Column Body ── */}
      <div className="rca-body">

        {/* Left: Timeline + Dependency */}
        <div className="rca-col rca-col--left">
          <IncidentTimeline />
          <DependencyImpact />
        </div>

        {/* Center: Graph + AI */}
        <div className="rca-col rca-col--center">
          <EventCorrelationGraph />
          <AIAnalysisPanel />
        </div>

        {/* Right: RCA + Similar + Mitigation */}
        <div className="rca-col rca-col--right">
          <RootCausePanel />
          <SimilarIncidents />
          <MitigationPlan />
        </div>

      </div>
    </div>
  );
}

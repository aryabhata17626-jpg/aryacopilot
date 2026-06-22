import { useState } from 'react';
import KPICard from '../../components/KPICard/index.jsx';
import './RootCauseAnalysis.css';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const TL_EVENTS = [
  { time:'14:18', label:'CPU Utilization',   sub:'88%',      sev:'warning' },
  { time:'14:20', label:'Packet Loss',        sub:'5%',       sev:'warning' },
  { time:'14:22', label:'Queue Overflow',     sub:'Detected', sev:'danger'  },
  { time:'14:28', label:'Tunnel Restart',     sub:'Failure',  sev:'danger'  },
  { time:'14:32', label:'Failure Predicted',  sub:null,       sev:'danger'  },
];

const DEP_CHAIN    = ['CORE-R2','CORE-R3','FW-01','APP-S2'];
const DEP_SERVICES = [
  { label:'Telemetry', cls:'tele' },
  { label:'VPN',       cls:'vpn'  },
  { label:'MPLS',      cls:'mpls' },
  { label:'Database',  cls:'db'   },
];

/* ──  SVG Graph  ─────────────────────────────────────
   viewBox: 0 0 440 310
─────────────────────────────────────────────────── */
const G_NODES = [
  { id:'core-r3', x:181, y:12,  w:78,  h:28, lines:['CORE-R3'],          col:'#22C55E', bg:'#F0FDF4', tip:'Core Router · Incident origin' },
  { id:'cpu',     x:28,  y:95,  w:88,  h:38, lines:['CPU','SPIKE'],       col:'#F59E0B', bg:'#FFFBEB', tip:'CPU 95% — threshold exceeded' },
  { id:'pkt',     x:168, y:95,  w:92,  h:38, lines:['PACKET','LOSS'],     col:'#F59E0B', bg:'#FFFBEB', tip:'Packet loss 7% — link degraded' },
  { id:'queue',   x:316, y:95,  w:92,  h:38, lines:['QUEUE','OVERFLOW'],  col:'#FF6B00', bg:'#FFF3E8', tip:'Buffer 89/100 — near exhaustion' },
  { id:'ospf',    x:28,  y:195, w:88,  h:38, lines:['OSPF','LOSS'],       col:'#F59E0B', bg:'#FFFBEB', tip:'OSPF adjacency lost' },
  { id:'tunnel',  x:168, y:195, w:92,  h:38, lines:['TUNNEL','RESTART'],  col:'#FF6B00', bg:'#FFF3E8', tip:'MPLS tunnel restarted ×4' },
  { id:'router',  x:316, y:195, w:92,  h:38, lines:['ROUTER','FAILURE'],  col:'#EF4444', bg:'#FFF5F5', tip:'CORE-R2 — service down' },
  { id:'core-r2', x:360, y:268, w:70,  h:26, lines:['CORE-R2'],           col:'#EF4444', bg:'#FFF5F5', tip:'Downstream impact' },
];

// [x1, y1, x2, y2, color, markerId, animDelay]
const G_EDGES = [
  [220, 40,  72,  95,  '#9CA3AF', 'arr-gray',   0.0],
  [116, 114, 168, 114, '#F59E0B', 'arr-warn',   0.2],
  [260, 114, 316, 114, '#F59E0B', 'arr-warn',   0.4],
  [72,  133, 72,  195, '#F59E0B', 'arr-warn',   0.6],
  [362, 133, 362, 195, '#FF6B00', 'arr-orange', 0.8],
  [116, 214, 168, 214, '#FF6B00', 'arr-orange', 1.0],
  [260, 214, 316, 214, '#EF4444', 'arr-crit',   1.2],
  [362, 233, 395, 268, '#EF4444', 'arr-crit',   1.4],
];

const EVIDENCE = [
  { label:'CPU Usage',       value:'>95%', high:true  },
  { label:'Packet Loss',     value:'7%',   high:false },
  { label:'Queue Depth',     value:'81',   high:false },
  { label:'Tunnel Restarts', value:'4',    high:false },
];

const SIMILAR = [
  { id:'044', sim:96, resolution:'Firmware Update',   col:'#22C55E' },
  { id:'031', sim:91, resolution:'Re-balancing OSPF', col:'#F59E0B' },
];

const MITIGATION = [
  'Increase Queue Buffer',
  'Restart MPLS Tunnel',
  'Reduce Polling Frequency',
  'Move Telemetry',
];

/* ══════════════════════════════════════════════════════
   IncidentTimeline
══════════════════════════════════════════════════════ */
function IncidentTimeline() {
  return (
    <div className="rca-panel">
      <div className="rca-panel__hd">
        <h3 className="rca-panel__ttl">INCIDENT TIMELINE</h3>
      </div>
      <div className="rca-tl-body">
        {TL_EVENTS.map((ev, i) => (
          <div key={i} className="rca-tl-item" title={`${ev.time} — ${ev.label}${ev.sub ? ' ' + ev.sub : ''}`}>
            <div className="rca-tl-track-col">
              <div className={`rca-tl-dot rca-tl-dot--${ev.sev}`} />
              {i < TL_EVENTS.length - 1 && <div className="rca-tl-connector" />}
            </div>
            <div className="rca-tl-content">
              <span className="rca-tl-time">{ev.time}</span>
              <span className={`rca-tl-label${ev.sev === 'danger' ? ' rca-tl-label--danger' : ''}`}>
                {ev.label}
              </span>
              {ev.sub && (
                <span className={`rca-tl-sub rca-tl-sub--${ev.sev}`}>{ev.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DependencyImpact
══════════════════════════════════════════════════════ */
function DependencyImpact() {
  return (
    <div className="rca-panel">
      <div className="rca-panel__hd">
        <h3 className="rca-panel__ttl">DEPENDENCY IMPACT</h3>
      </div>
      <div className="rca-dep-body">
        {/* Affected chain */}
        <div className="rca-dep-chain">
          {DEP_CHAIN.map((node, i) => (
            <div key={node} className="rca-dep-chain-item">
              <span className="rca-dep-node">{node}</span>
              {i < DEP_CHAIN.length - 1 && (
                <span className="rca-dep-arrow">→</span>
              )}
            </div>
          ))}
        </div>
        {/* Affected services */}
        <div className="rca-dep-label">AFFECTED SERVICES</div>
        <div className="rca-dep-services">
          {DEP_SERVICES.map(s => (
            <span key={s.cls} className={`rca-svc-badge rca-svc-badge--${s.cls}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EventCorrelationGraph — SVG flow diagram
══════════════════════════════════════════════════════ */
function EventCorrelationGraph() {
  const [hoveredId, setHoveredId] = useState(null);
  const hovered = G_NODES.find(n => n.id === hoveredId);

  return (
    <div className="rca-panel">
      <div className="rca-panel__hd">
        <h3 className="rca-panel__ttl">EVENT CORRELATION GRAPH</h3>
        <div className="rca-graph-legend">
          <span className="rca-leg rca-leg--h">● Healthy</span>
          <span className="rca-leg rca-leg--w">● Warning</span>
          <span className="rca-leg rca-leg--c">● Critical</span>
        </div>
      </div>
      <div className="rca-graph-wrap">
        <svg
          viewBox="0 0 440 310"
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {[
              ['arr-gray',   '#9CA3AF'],
              ['arr-warn',   '#F59E0B'],
              ['arr-orange', '#FF6B00'],
              ['arr-crit',   '#EF4444'],
            ].map(([id, col]) => (
              <marker
                key={id} id={id}
                markerWidth="6" markerHeight="6"
                refX="5.5" refY="3"
                orient="auto"
              >
                <polygon points="0,0.5 5.5,3 0,5.5" fill={col} />
              </marker>
            ))}
          </defs>

          {/* ── Edges ── */}
          {G_EDGES.map(([x1, y1, x2, y2, color, markerId, delay], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="7 4"
              markerEnd={`url(#${markerId})`}
              className="rca-edge"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}

          {/* ── Nodes ── */}
          {G_NODES.map(n => {
            const isHov = hoveredId === n.id;
            const cx    = n.x + n.w / 2;
            const cy    = n.y + n.h / 2;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover glow ring */}
                {isHov && (
                  <rect
                    x={n.x - 3} y={n.y - 3}
                    width={n.w + 6} height={n.h + 6}
                    rx="7"
                    fill="none"
                    stroke={n.col}
                    strokeWidth="1"
                    opacity="0.3"
                  />
                )}
                {/* Main rect */}
                <rect
                  x={n.x} y={n.y} width={n.w} height={n.h} rx="5"
                  fill={isHov ? n.col + '25' : n.bg}
                  stroke={n.col}
                  strokeWidth={isHov ? 2 : 1.5}
                />
                {/* Status dot (top-right of node) */}
                <circle cx={n.x + n.w - 9} cy={n.y + 9} r="3.5" fill={n.col} />

                {/* Labels — split into lines */}
                {n.lines.map((line, li) => (
                  <text
                    key={li}
                    x={cx - 4}
                    y={cy + (n.lines.length > 1 ? (li - 0.5) * 10 : 0) + 4}
                    textAnchor="middle"
                    fontSize={n.lines.length > 1 ? 8 : 9}
                    fontWeight="700"
                    fill={n.col}
                    fontFamily="Inter, system-ui, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* ── Hover Tooltip ── */}
          {hovered && (() => {
            const n   = hovered;
            const tx  = n.x + n.w / 2;
            const tw  = Math.max(n.tip.length * 5.8, 110);
            const below = n.y < 70;
            const ty  = below ? n.y + n.h + 6 : n.y - 6;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={tx - tw / 2} y={below ? ty : ty - 22}
                  width={tw} height={20} rx="4"
                  fill="#1F2937" opacity="0.93"
                />
                <text
                  x={tx} y={below ? ty + 14 : ty - 8}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#F9FAFB"
                  fontFamily="Inter, sans-serif"
                >
                  {n.tip}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AIAnalysis
══════════════════════════════════════════════════════ */
function AIAnalysis() {
  return (
    <div className="rca-panel rca-ai-panel">
      <div className="rca-ai-hd">
        <span className="rca-ai-icon">⬡</span>
        <span className="rca-ai-ttl">ARYACOPILOT AI ANALYSIS</span>
        <span className="rca-ai-badge">91%</span>
      </div>
      <div className="rca-ai-body">
        <p>
          Analysis confirms a cascading failure initiated by a CPU spike on
          CORE-R3. High utilization triggered queue overflow leading to
          packet drops.
        </p>
        <p>
          This destabilized OSPF adjacency which resulted in repeated MPLS
          tunnel restarts. The system predicted service impact{' '}
          <strong>18 minutes</strong> before actual outage.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RCAPanel — confidence circle + root cause + evidence
══════════════════════════════════════════════════════ */
function RCAPanel() {
  const R    = 40;
  const circ = 2 * Math.PI * R;
  const off  = circ * (1 - 0.91);
  return (
    <div className="rca-panel">
      <div className="rca-panel__hd">
        <h3 className="rca-panel__ttl">ROOT CAUSE ANALYSIS</h3>
      </div>
      <div className="rca-rca-body">
        {/* SVG confidence ring */}
        <div className="rca-conf-wrap">
          <svg width="104" height="104" viewBox="0 0 104 104">
            <circle cx="52" cy="52" r={R} fill="none" stroke="#F3F4F6" strokeWidth="7" />
            <circle
              cx="52" cy="52" r={R}
              fill="none"
              stroke="#FF6B00"
              strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={off}
              strokeLinecap="round"
              transform="rotate(-90 52 52)"
              className="rca-arc"
            />
            <text x="52" y="57" textAnchor="middle" fontSize="17" fontWeight="800" fill="#111827">91%</text>
            <text x="52" y="70" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#6B7280" fontFamily="Inter, sans-serif">CONF</text>
          </svg>
        </div>

        {/* Root cause name + description */}
        <div className="rca-rc-block">
          <div className="rca-rc-name">OSPF Route Flapping</div>
          <div className="rca-rc-desc">
            Triggered by resource exhaustion and repeated queue overflows.
          </div>
        </div>

        {/* Evidence metrics */}
        <div className="rca-ev-hd">EVIDENCE METRICS</div>
        <div className="rca-evidence">
          {EVIDENCE.map(e => (
            <div key={e.label} className="rca-ev-row">
              <span className="rca-ev-lbl">{e.label}</span>
              <span className={`rca-ev-val${e.high ? ' rca-ev-val--high' : ''}`}>
                {e.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SimilarIncidents
══════════════════════════════════════════════════════ */
function SimilarIncidents() {
  return (
    <div className="rca-panel">
      <div className="rca-panel__hd">
        <h3 className="rca-panel__ttl">SIMILAR INCIDENTS</h3>
      </div>
      <div className="rca-sim-body">
        {SIMILAR.map(inc => (
          <div key={inc.id} className="rca-sim-card">
            <div className="rca-sim-top">
              <span className="rca-sim-id">Incident {inc.id}</span>
              <span
                className="rca-sim-badge"
                style={{ background: inc.col + '22', color: inc.col }}
              >
                {inc.sim}% MATCH
              </span>
            </div>
            <div className="rca-sim-res">Resolution: {inc.resolution}</div>
            <button
              className="rca-sim-btn"
              id={`btn-view-inc-${inc.id}`}
            >
              VIEW MATCH
            </button>
          </div>
        ))}
        <button className="rca-hist-btn" id="btn-view-history">
          VIEW INCIDENT HISTORY
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MitigationPlan
══════════════════════════════════════════════════════ */
function MitigationPlan() {
  return (
    <div className="rca-panel rca-mit-panel">
      <div className="rca-panel__hd">
        <h3 className="rca-panel__ttl">MITIGATION PLAN</h3>
      </div>
      <div className="rca-mit-body">
        {MITIGATION.map((action, i) => (
          <div key={i} className="rca-mit-row">
            <span className="rca-mit-bullet">○</span>
            <span className="rca-mit-lbl">{action}</span>
          </div>
        ))}
      </div>
      <div className="rca-mit-footer">
        <button id="btn-gen-report" className="rca-cta-btn">
          GENERATE INCIDENT REPORT
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Export
══════════════════════════════════════════════════════ */
export default function RootCauseAnalysis() {
  return (
    <div className="rca-page">

      {/* Header */}
      <div className="rca-header">
        <h1 className="rca-header__title">ROOT CAUSE ANALYSIS</h1>
        <p className="rca-header__sub">
          Event Correlation and Explainable Diagnostics
        </p>
      </div>

      {/* KPI Row */}
      <div className="rca-kpi-row">
        <KPICard label="Incident ID"       value="INC-2024-104" variant="badge"  badgeText="OPEN"      badgeType="danger"  />
        <KPICard label="Affected Devices"  value="4 Nodes"      variant="badge"  badgeText="IMPACTED"  badgeType="warning" />
        <KPICard label="Confidence"        value="91%"          variant="gauge"  gaugeValue={91}        subLabel="HIGH"    subLabelColor="#22C55E" />
        <KPICard label="Downtime Avoided"  value="18 min"       variant="badge"  badgeText="PREVENTED" badgeType="info"   />
      </div>

      {/* 3-Column Body */}
      <div className="rca-body">

        {/* Left: timeline + dependency */}
        <div className="rca-left">
          <IncidentTimeline />
          <DependencyImpact />
        </div>

        {/* Center: graph + AI */}
        <div className="rca-center">
          <EventCorrelationGraph />
          <AIAnalysis />
        </div>

        {/* Right: rca panel + similar + mitigation */}
        <div className="rca-right">
          <RCAPanel />
          <SimilarIncidents />
          <MitigationPlan />
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  MdSend, MdFlashOn, MdRefresh, MdPauseCircle, MdSyncAlt,
} from 'react-icons/md';
import KPICard from '../../components/KPICard/index.jsx';
import './FailurePrediction.css';

/* ══════════════════════════════════════════════════════
   Utility
══════════════════════════════════════════════════════ */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rnd   = (lo, hi)    => Math.random() * (hi - lo) + lo;

/* ══════════════════════════════════════════════════════
   Static Seed Data
══════════════════════════════════════════════════════ */
const SEED_TABLE = [
  { id:1, device:'CORE-R2', risk:97, ttf:'18 min', conf:92, severity:'Critical',  status:'Predicted'  },
  { id:2, device:'CORE-R3', risk:74, ttf:'46 min', conf:87, severity:'Warning',   status:'Predicted'  },
  { id:3, device:'EDGE-R1', risk:52, ttf:'2 hrs',  conf:81, severity:'Moderate',  status:'Monitoring' },
];

const SEED_CHART = [
  { t:'02:00', prob:14, cpu:38, drops:6  },
  { t:'04:00', prob:22, cpu:48, drops:9  },
  { t:'06:00', prob:32, cpu:58, drops:13 },
  { t:'08:00', prob:45, cpu:68, drops:17 },
  { t:'10:00', prob:58, cpu:75, drops:20 },
  { t:'12:00', prob:68, cpu:82, drops:25 },
  { t:'14:00', prob:78, cpu:89, drops:30 },
  { t:'16:00', prob:88, cpu:93, drops:36 },
  { t:'18:00', prob:94, cpu:96, drops:40 },
  { t:'20:00', prob:90, cpu:92, drops:37 },
  { t:'22:00', prob:84, cpu:87, drops:32 },
  { t:'24:00', prob:76, cpu:82, drops:27 },
];

const SEED_METRICS = { cpuLoad:95, memory:82, pktLoss:7.0, queue:89 };
const SEED_RISKS   = [97, 74, 52];

const TIMELINE = [
  { time:'14:20', label:'Current',     color:'#22C55E', pulse:true  },
  { time:'14:32', label:'Warning',     color:'#F59E0B', pulse:false },
  { time:'14:54', label:'Degradation', color:'#FF6B00', pulse:false },
  { time:'15:10', label:'Failure',     color:'#EF4444', pulse:false },
];

const FAILURE_FACTORS = [
  { label:'CPU Thermal (MHz)',    value:94  },
  { label:'Packet Drops (7-bit)', value:53  },
  { label:'Tunnel Failures',      value:138 },
];

const AI_MODELS = [
  { label:'LSTM Model',       score:92, tip:'Recurrent network trained on 90-day device telemetry' },
  { label:'Isolation Forest', score:89, tip:'Anomaly-detection forest across 32 feature dimensions' },
  { label:'XGBoost',          score:86, tip:'Gradient boosting on historical MTBF & queue metrics'  },
];

const ACTIONS = [
  { icon:<MdFlashOn />,     label:'Increase Queue Buffer',     impact:'High',   cls:'high'   },
  { icon:<MdRefresh />,     label:'Restart MPLS Tunnel',       impact:'Medium', cls:'medium' },
  { icon:<MdPauseCircle />, label:'Delay Backup Traffic',      impact:'Medium', cls:'medium' },
  { icon:<MdSyncAlt />,     label:'Shift Telemetry to Node-C', impact:'Low',    cls:'low'    },
];

/* ══════════════════════════════════════════════════════
   ConfidenceMeter — animated SVG circular arc
══════════════════════════════════════════════════════ */
function ConfidenceMeter({ value }) {
  const R    = 40;
  const circ = 2 * Math.PI * R;
  const off  = circ * (1 - value / 100);
  const col  = value >= 88 ? '#22C55E' : value >= 75 ? '#F59E0B' : '#EF4444';

  return (
    <div className="conf-meter">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-label={`Confidence: ${value}%`}>
        {/* Track */}
        <circle cx="48" cy="48" r={R} fill="none" stroke="#F3F4F6" strokeWidth="7" />
        {/* Filled arc */}
        <circle
          cx="48" cy="48" r={R}
          fill="none"
          stroke={col}
          strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          className="conf-meter__arc"
        />
        {/* Centre value */}
        <text x="48" y="53" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">
          {Math.round(value)}%
        </text>
      </svg>
      <span className="conf-meter__lbl">AI CONFIDENCE</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PredictionTable
══════════════════════════════════════════════════════ */
const SEV_CLS  = { Critical:'fp-sev--crit', Warning:'fp-sev--warn', Moderate:'fp-sev--mod' };
const STAT_CLS = { Predicted:'fp-st--pred', Monitoring:'fp-st--mon' };

const RISK_BOUNDS = [[93,99],[68,80],[46,58]];

function PredictionTable({ liveRisks }) {
  const [sortKey, setSortKey] = useState('risk');
  const [sortDir, setSortDir] = useState('desc');
  const [filter,  setFilter]  = useState('All');

  const rows = useMemo(() => {
    // Merge live risk values
    const merged = SEED_TABLE.map((r, i) => ({ ...r, risk: Math.round(liveRisks[i]) }));
    let d = [...merged];
    if (filter !== 'All') d = d.filter(r => r.severity === filter);
    return d.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [liveRisks, sortKey, sortDir, filter]);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortArrow = ({ k }) => (
    <span className={`sort-icon${sortKey !== k ? ' sort-icon--off' : ''}`}>
      {sortKey !== k ? '↕' : sortDir === 'desc' ? '↓' : '↑'}
    </span>
  );

  const COLS = [
    { key:'device',   label:'DEVICE'          },
    { key:'risk',     label:'FAILURE RISK'    },
    { key:'ttf',      label:'TIME TO FAILURE' },
    { key:'conf',     label:'CONFIDENCE'      },
    { key:'severity', label:'SEVERITY'        },
    { key:'status',   label:'STATUS'          },
  ];

  return (
    <div className="fp-panel">
      <div className="fp-panel__hd">
        <h3 className="fp-panel__ttl">PREDICTED FAILURES (NEXT 24H)</h3>
        <div className="fp-panel__hd-right">
          <select
            className="fp-filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            id="filter-severity"
          >
            <option>All</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Moderate</option>
          </select>
          <button className="fp-link-btn" id="btn-view-report">VIEW ALL REPORT</button>
        </div>
      </div>
      <div className="fp-table-wrap">
        <table className="fp-table">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className="fp-th" onClick={() => toggleSort(c.key)}>
                  {c.label} <SortArrow k={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const riskColor  = r.risk >= 80 ? '#EF4444' : r.risk >= 60 ? '#F59E0B' : '#22C55E';
              const isCritical = r.risk >= 80;
              const tip = `Device: ${r.device} | Risk: ${r.risk}% | TTF: ${r.ttf} | Severity: ${r.severity}`;
              return (
                <tr key={r.id} className="fp-tr" title={tip}>
                  <td className="fp-td fp-td--device">{r.device}</td>
                  <td className="fp-td">
                    <div className="fp-risk">
                      <div className="fp-risk-bar">
                        <div
                          className={`fp-risk-fill${isCritical ? ' fp-risk-fill--crit' : ''}`}
                          style={{ width: r.risk + '%', background: riskColor }}
                        />
                      </div>
                      <span className="fp-risk-val" style={{ color: riskColor }}>
                        {r.risk}%
                      </span>
                    </div>
                  </td>
                  <td className="fp-td">{r.ttf}</td>
                  <td className="fp-td">
                    <div className="fp-conf-cell">
                      <div className="fp-conf-track">
                        <div className="fp-conf-fill" style={{ width: r.conf + '%' }} />
                      </div>
                      <span>{r.conf}%</span>
                    </div>
                  </td>
                  <td className="fp-td">
                    <span className={`fp-badge ${SEV_CLS[r.severity]}`}>{r.severity}</span>
                  </td>
                  <td className="fp-td">
                    <span className={`fp-badge ${STAT_CLS[r.status]}`}>{r.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TrendChart — live updating with animation
══════════════════════════════════════════════════════ */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fp-tip">
      <div className="fp-tip__lbl">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="fp-tip__row" style={{ color: p.stroke }}>
          {p.name}: <b>{p.value}%</b>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }) {
  // Find the max prob point to show a reference line
  const maxProb = data.reduce((m, d) => (d.prob > m ? d.prob : m), 0);

  return (
    <div className="fp-panel">
      <div className="fp-panel__hd">
        <h3 className="fp-panel__ttl">PROBABILITY TREND (CORE-R2)</h3>
        <div className="fp-chart-legend">
          <span className="fp-live-badge"><span className="fp-live-dot" />LIVE</span>
          <span className="fp-leg"><span className="fp-leg-line" style={{background:'#EF4444'}} />PROBABILITY</span>
          <span className="fp-leg"><span className="fp-leg-line" style={{background:'#FF6B00'}} />CPU</span>
          <span className="fp-leg"><span className="fp-leg-line fp-leg-line--dash" style={{background:'#6B7280'}} />LOSS</span>
        </div>
      </div>
      <div className="fp-chart-body">
        <ResponsiveContainer width="100%" height={185}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fontSize:9, fill:'#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize:9, fill:'#9CA3AF' }}
              tickLine={false}
              axisLine={false}
            />
            {/* Danger threshold line */}
            <ReferenceLine
              y={80}
              stroke="#EF4444"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value:'Danger', position:'right', fontSize:8, fill:'#EF4444' }}
            />
            <Tooltip content={<ChartTip />} />
            <Line
              type="monotone" dataKey="prob" name="Probability"
              stroke="#EF4444" strokeWidth={2} dot={false}
              isAnimationActive animationDuration={800} animationEasing="ease-in-out"
            />
            <Line
              type="monotone" dataKey="cpu" name="CPU"
              stroke="#FF6B00" strokeWidth={2} dot={false}
              isAnimationActive animationDuration={800} animationEasing="ease-in-out"
            />
            <Line
              type="monotone" dataKey="drops" name="Drops"
              stroke="#6B7280" strokeWidth={1.5} dot={false}
              strokeDasharray="4 2"
              isAnimationActive animationDuration={800} animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TimelineProjection — animated progression
══════════════════════════════════════════════════════ */
function TimelineProjection({ activeIndex }) {
  return (
    <div className="fp-panel">
      <div className="fp-panel__hd">
        <h3 className="fp-panel__ttl">EVENT TIMELINE PROJECTION (CORE-R2)</h3>
        <span className="fp-timeline-status">Step {activeIndex + 1} of {TIMELINE.length}</span>
      </div>
      <div className="fp-timeline">
        <div className="fp-tl-track">
          <div
            className="fp-tl-progress"
            style={{ width: `${(activeIndex / (TIMELINE.length - 1)) * 100}%` }}
          />
        </div>
        {TIMELINE.map((ev, i) => {
          const isPast    = i <  activeIndex;
          const isCurrent = i === activeIndex;
          const isFuture  = i >  activeIndex;
          return (
            <div
              key={i}
              className={`fp-tl-event${isCurrent ? ' fp-tl-event--active' : ''}${isFuture ? ' fp-tl-event--future' : ''}`}
            >
              <div
                className={`fp-tl-dot${isCurrent ? ' fp-tl-dot--pulse' : ''}${isFuture ? ' fp-tl-dot--future' : ''}`}
                style={{
                  background:  isFuture ? '#E5E7EB' : ev.color,
                  boxShadow:   isCurrent ? `0 0 0 4px ${ev.color}35` : 'none',
                }}
              />
              <span className={`fp-tl-time${isFuture ? ' fp-tl-time--dim' : ''}`}>{ev.time}</span>
              <span className={`fp-tl-label${isCurrent ? ' fp-tl-label--active' : ''}${isFuture ? ' fp-tl-label--dim' : ''}`} style={isCurrent ? { color: ev.color } : {}}>
                {ev.label}
              </span>
              {isCurrent && (
                <span className="fp-tl-badge" style={{ background: ev.color }}>NOW</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PredictionStatus  — live metrics + confidence meter
══════════════════════════════════════════════════════ */
const METRIC_TIPS = {
  cpuLoad:  'Threshold: 90% | Status: Critical — triggers OSPF instability above 95%',
  memory:   'Threshold: 85% | Status: Warning — approaching OOM zone',
  pktLoss:  'Normal range: 0–5% | Status: Elevated — correlates with tunnel instability',
  queue:    'Threshold: 85% | Status: Critical — buffer exhaustion imminent',
};

function PredictionStatus({ liveMetrics, confidence }) {
  const metrics = [
    { key:'cpuLoad',  label:'CPU LOAD',    value: Math.round(liveMetrics.cpuLoad), suffix:'%' },
    { key:'memory',   label:'MEMORY',      value: Math.round(liveMetrics.memory),  suffix:'%' },
    { key:'pktLoss',  label:'PKT LOSS',    value: liveMetrics.pktLoss.toFixed(1),  suffix:'%' },
    { key:'queue',    label:'QUEUE DEPTH', value: Math.round(liveMetrics.queue),   suffix:'%' },
  ];

  return (
    <div className="fp-panel fp-status-panel">
      <div className="fp-status-hd">
        <div>
          <span className="fp-status-sublbl">DEVICE: </span>
          <span className="fp-status-device">CORE-R2</span>
        </div>
        <span className="fp-realtime-badge">
          <span className="fp-live-dot fp-live-dot--sm" />
          REAL-TIME
        </span>
      </div>

      <div className="fp-status-body">
        <div className="fp-pred-row">
          <span className="fp-pred-lbl">PREDICTING STATUS</span>
          <span className="fp-critical-badge">CRITICAL ●</span>
        </div>

        {/* Confidence Meter */}
        <div className="fp-conf-meter-wrap">
          <ConfidenceMeter value={confidence} />
        </div>

        {/* 2 × 2 Metrics */}
        <div className="fp-metrics-grid">
          {metrics.map(m => {
            const pct = parseFloat(m.value);
            const col = pct >= 80 ? '#EF4444' : pct >= 50 ? '#F59E0B' : '#22C55E';
            return (
              <div
                key={m.key}
                className="fp-metric"
                data-tip={METRIC_TIPS[m.key]}
              >
                <span className="fp-metric__lbl">{m.label}</span>
                <span className="fp-metric__val" style={{ color: col }}>
                  {m.value}{m.suffix}
                </span>
                <div className="fp-metric__track">
                  <div
                    className="fp-metric__fill"
                    style={{ width: pct + '%', background: col }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Failure Factors */}
        <div className="fp-section-hd">TOP FAILURE FACTORS</div>
        <div className="fp-factors">
          {FAILURE_FACTORS.map(f => (
            <div key={f.label} className="fp-factor-row" title={`Score: ${f.value}`}>
              <div className="fp-factor-bar-wrap">
                <div
                  className="fp-factor-bar"
                  style={{ width: Math.min((f.value / 150) * 100, 100) + '%' }}
                />
              </div>
              <span className="fp-factor-lbl">{f.label}</span>
              <span className="fp-factor-val">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ModelPerformance — animated bars with tooltips
══════════════════════════════════════════════════════ */
function ModelPerformance({ confidence }) {
  // Scores shift slightly in sync with overall confidence
  const delta = confidence - 91;
  const scores = AI_MODELS.map(m => ({
    ...m,
    live: Math.round(clamp(m.score + delta * 0.4, m.score - 3, m.score + 3)),
  }));

  return (
    <div className="fp-panel">
      <div className="fp-panel__hd">
        <h3 className="fp-panel__ttl">ENSEMBLE MODELS</h3>
      </div>
      <div className="fp-models-body">
        {scores.map(m => (
          <div key={m.label} className="fp-model-row" title={m.tip}>
            <span className="fp-model-lbl">{m.label}</span>
            <div className="fp-model-bar-wrap">
              <div className="fp-model-track">
                <div className="fp-model-fill" style={{ width: m.live + '%' }} />
              </div>
            </div>
            <span className="fp-model-score">{m.live}%</span>
          </div>
        ))}
        <div className="fp-ensemble-row">
          <span className="fp-ensemble-lbl">WEIGHTED SCORE</span>
          <span className="fp-ensemble-val">{Math.round(confidence)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PreventiveActions
══════════════════════════════════════════════════════ */
function PreventiveActions() {
  return (
    <div className="fp-panel fp-actions-panel">
      <div className="fp-panel__hd">
        <h3 className="fp-panel__ttl">PREVENTIVE ACTIONS</h3>
      </div>
      <div className="fp-actions-body">
        {ACTIONS.map((a, i) => (
          <div
            key={i}
            className="fp-action-row"
            title={`Impact: ${a.impact} — click to apply`}
          >
            <span className="fp-action-icon">{a.icon}</span>
            <span className="fp-action-lbl">{a.label}</span>
            <span className={`fp-impact fp-impact--${a.cls}`}>{a.impact}</span>
          </div>
        ))}
      </div>
      <div className="fp-actions-footer">
        <button id="btn-gen-mitigation" className="fp-cta-btn">
          GENERATE MITIGATION PLAN
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AIAssistantCard
══════════════════════════════════════════════════════ */
function AIAssistantCard({ confidence }) {
  const [msg, setMsg] = useState('');

  return (
    <div className="fp-panel fp-ai-panel">
      <div className="fp-ai-hd">
        <span className="fp-ai-icon">⬡</span>
        <span className="fp-ai-title">ARYACOPILOT AI</span>
        <span className="fp-ai-conf-badge">{Math.round(confidence)}%</span>
      </div>
      <div className="fp-ai-body">
        <div className="fp-ai-query">Why did CORE-R2 fail?</div>
        <div className="fp-ai-bubble">
          <p>
            AryaCopilot: Analysis indicates an 18-minute window before the
            failure. CORE-R2 experiences a hard fault. This is driven by{' '}
            {Math.round(confidence)}% CPU threshold degradation and concurrent
            queue overflow in the MPLS sub-layer. Recommended action is to
            immediately traffic offload.
          </p>
        </div>
        <div className="fp-ai-conf">
          Confidence: <strong>{Math.round(confidence)}%</strong>
        </div>
      </div>
      <div className="fp-ai-input-row">
        <input
          id="ai-chat-input"
          type="text"
          className="fp-ai-input"
          placeholder="Type comment..."
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setMsg('')}
        />
        <button id="btn-ai-send" className="fp-ai-send" aria-label="Send">
          <MdSend />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Page — live state management
══════════════════════════════════════════════════════ */
export default function FailurePrediction() {
  const [chartData,    setChartData]    = useState(SEED_CHART);
  const [liveMetrics,  setLiveMetrics]  = useState(SEED_METRICS);
  const [liveRisks,    setLiveRisks]    = useState(SEED_RISKS);
  const [confidence,   setConfidence]   = useState(91);
  // Animated timeline: progresses through steps 0→3 over time
  const [timelineIdx,  setTimelineIdx]  = useState(0);

  // ── Live data simulation (every 3 s)
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveMetrics(p => ({
        cpuLoad: clamp(p.cpuLoad + rnd(-1.5, 2),   88, 99),
        memory:  clamp(p.memory  + rnd(-1.5, 1.5), 76, 88),
        pktLoss: parseFloat(clamp(p.pktLoss + rnd(-0.4, 0.5), 4, 11).toFixed(1)),
        queue:   clamp(p.queue   + rnd(-2, 2.5),   82, 97),
      }));

      setLiveRisks(prev =>
        prev.map((v, i) => clamp(v + rnd(-1.5, 1.5), RISK_BOUNDS[i][0], RISK_BOUNDS[i][1]))
      );

      setConfidence(p => parseFloat(clamp(p + rnd(-1.5, 1.5), 86, 96).toFixed(1)));

      setChartData(prev => {
        const last = prev[prev.length - 1];
        const next = {
          t:     last.t,
          prob:  Math.round(clamp(last.prob  + rnd(-4, 5), 60, 99)),
          cpu:   Math.round(clamp(last.cpu   + rnd(-3, 4), 70, 99)),
          drops: Math.round(clamp(last.drops + rnd(-3, 4), 20, 50)),
        };
        return [...prev.slice(1), next];
      });
    }, 3000);

    return () => clearInterval(iv);
  }, []);

  // ── Timeline auto-advance (every 18 s — simulates progression)
  useEffect(() => {
    const iv = setInterval(() => {
      setTimelineIdx(p => (p < TIMELINE.length - 1 ? p + 1 : 0));
    }, 18000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="fp-page">

      {/* ── Header ── */}
      <div className="fp-header">
        <div>
          <h1 className="fp-header__title">FAILURE PREDICTION</h1>
          <p className="fp-header__sub">
            Predictive Analysis and Failure Forecasting for Network Devices
          </p>
          <div className="fp-header__ts">2024-10-24 | 14:20 UTC</div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="fp-kpi-row">
        <KPICard label="Devices Monitored"        value="128"            variant="badge"  badgeText="ACTIVE"          badgeType="info"    />
        <KPICard label="High Risk Devices"         value="3"             variant="badge"  badgeText="CRITICAL"        badgeType="danger"  />
        <KPICard label="AI Prediction Confidence"  value={`${Math.round(confidence)}%`}  variant="gauge"  gaugeValue={confidence}      subLabel="HIGH CONFIDENCE" subLabelColor="#22C55E" />
        <KPICard label="Expected Downtime"         value="18 min"        variant="badge"  badgeText="ESTIMATED"       badgeType="warning" />
      </div>

      {/* ── 2-Column Body ── */}
      <div className="fp-body">

        <div className="fp-main">
          <PredictionTable liveRisks={liveRisks} />
          <TrendChart      data={chartData} />
          <TimelineProjection activeIndex={timelineIdx} />
        </div>

        <div className="fp-sidebar">
          <PredictionStatus liveMetrics={liveMetrics} confidence={confidence} />
          <ModelPerformance confidence={confidence} />
          <PreventiveActions />
          <AIAssistantCard  confidence={confidence} />
        </div>

      </div>
    </div>
  );
}

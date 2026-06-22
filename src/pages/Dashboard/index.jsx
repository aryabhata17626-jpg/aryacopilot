import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  MdSend, MdRefresh, MdFlashOn,
  MdPictureAsPdf, MdGridOn, MdDescription,
} from 'react-icons/md';
import KPICard from '../../components/KPICard/index.jsx';
import './Dashboard.css';

/* ── Prediction Timeline Data ────────────────────────── */
const predictionData = [
  { t: '00:00', prob: 12, cpu: 38, drops: 6  },
  { t: '02:00', prob: 20, cpu: 44, drops: 10 },
  { t: '04:00', prob: 32, cpu: 52, drops: 18 },
  { t: '06:00', prob: 28, cpu: 60, drops: 14 },
  { t: '08:00', prob: 45, cpu: 65, drops: 24 },
  { t: '10:00', prob: 38, cpu: 58, drops: 20 },
  { t: '12:00', prob: 62, cpu: 74, drops: 36 },
  { t: '14:00', prob: 55, cpu: 70, drops: 30 },
  { t: '16:00', prob: 72, cpu: 78, drops: 44 },
  { t: '18:00', prob: 65, cpu: 72, drops: 38 },
  { t: '20:00', prob: 80, cpu: 82, drops: 50 },
  { t: '22:00', prob: 68, cpu: 76, drops: 42 },
  { t: '24:00', prob: 58, cpu: 70, drops: 34 },
];

/* ── Digital Twin SVG Network ────────────────────────── */
const COLOR = { healthy: '#22C55E', warning: '#F59E0B', failed: '#EF4444' };

const NODES = [
  { id: 'PM-01',  x: 300, y: 70,  status: 'healthy' },
  { id: 'R5',     x: 430, y: 160, status: 'failed',  label: 'R5 (FAIL)' },
  { id: 'COM-01', x: 110, y: 190, status: 'healthy' },
  { id: 'COM-02', x: 220, y: 190, status: 'healthy' },
  { id: 'SR-01',  x: 175, y: 290, status: 'healthy' },
];

const EDGES = [
  { from: 'COM-01', to: 'COM-02', status: 'healthy' },
  { from: 'COM-02', to: 'PM-01',  status: 'healthy' },
  { from: 'PM-01',  to: 'R5',     status: 'warning'  },
  { from: 'COM-02', to: 'SR-01',  status: 'healthy'  },
  { from: 'COM-01', to: 'SR-01',  status: 'healthy'  },
];

function NetworkSVG() {
  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
  return (
    <svg viewBox="0 0 560 360" className="twin__svg" aria-label="Network Topology">
      {/* Edges */}
      {EDGES.map((e, i) => {
        const a = nodeMap[e.from];
        const b = nodeMap[e.to];
        return (
          <line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={COLOR[e.status]}
            strokeWidth={1.5}
            strokeOpacity={0.75}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map(n => (
        <g key={n.id}>
          {/* Halo */}
          <circle cx={n.x} cy={n.y} r={14} fill={COLOR[n.status]} fillOpacity={0.12} />
          {/* Core */}
          <circle cx={n.x} cy={n.y} r={6} fill={COLOR[n.status]} />
          {/* Label */}
          <text
            x={n.x} y={n.y - 20}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#374151"
            fontFamily="Inter, sans-serif"
          >
            {n.label ?? n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Similar Incidents ───────────────────────────────── */
const INCIDENTS = [
  { id: '#44', desc: 'Restart MPLS tunnel.',  score: 76 },
  { id: '#21', desc: 'Increase buffer',        score: 91 },
];

/* ── Custom Tooltip for chart ────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="chart-tooltip__row" style={{ color: p.stroke }}>
          {p.name}: <strong>{p.value}%</strong>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Dashboard
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [chatInput, setChatInput] = useState('');

  const handleSend = () => {
    if (chatInput.trim()) setChatInput('');
  };

  return (
    <div className="dashboard">

      {/* ── Status Strip ─────────────────────────────── */}
      <div className="dash-strip">
        <div className="dash-strip__info">
          <span className="dash-strip__time">Time: 14:20 UTC</span>
          <span className="dash-strip__divider" />
          <span className="dash-strip__dot dash-strip__dot--green" />
          <span>Status: Air-Gapped</span>
          <span className="dash-strip__divider" />
          <span>Health: <strong>98%</strong></span>
        </div>
        <div className="dash-strip__actions">
          <button className="strip-btn" id="btn-export-pdf"><MdPictureAsPdf /> EXPORT PDF</button>
          <button className="strip-btn" id="btn-export-csv"><MdGridOn /> EXPORT CSV</button>
          <button className="strip-btn" id="btn-report"><MdDescription /> REPORT</button>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ─────────────────────────── */}
      <div className="dash-kpi-row">
        <KPICard
          label="Active Devices"
          value="128"
          variant="change"
          changeValue="+2.4%"
          changeType="positive"
        />
        <KPICard
          label="Predicted Failures"
          value="3"
          variant="badge"
          badgeText="HIGH RISK"
          badgeType="danger"
        />
        <KPICard
          label="Network Health"
          value="96%"
          variant="progress"
          progressValue={96}
          progressColor="#22C55E"
        />
        <KPICard
          label="Model Confidence"
          value="91%"
          variant="gauge"
          gaugeValue={91}
          subLabel="HIGH CONFIDENCE"
          subLabelColor="#22C55E"
        />
      </div>

      {/* ── Row 2: Digital Twin + Assistant ──────────── */}
      <div className="dash-mid-row">

        {/* Digital Twin Panel */}
        <div className="panel twin-panel">
          <div className="panel__header">
            <h3 className="panel__title">DIGITAL TWIN PANEL: REGION-01</h3>
            <div className="twin-legend">
              <span className="leg-dot leg-dot--green" />Healthy
              <span className="leg-dot leg-dot--orange" />Warning
              <span className="leg-dot leg-dot--red" />Failed
            </div>
          </div>
          <div className="twin__body">
            <NetworkSVG />
          </div>
          <div className="twin__footer">
            LATEST SYNC: 14:18:01 &nbsp;|&nbsp; LATENCY: 12ms
          </div>
        </div>

        {/* AryaCopilot Assistant */}
        <div className="panel assistant-panel">
          <div className="assistant__header">
            <span className="assistant__logo">⬡</span>
            <span className="assistant__title">ARYACOPILOT ASSISTANT</span>
          </div>

          <div className="assistant__body">
            {/* AI message bubble */}
            <div className="assistant__msg">
              Hello Operator. I&apos;ve detected a routing anomaly in Sector 7.
              Should I run a diagnostic?
            </div>

            {/* Quick-action chips */}
            <div className="assistant__chips">
              <button className="chip-btn" id="chip-r5">Why is R5 failing?</button>
              <button className="chip-btn" id="chip-traffic">Show traffic spikes</button>
              <button className="chip-btn" id="chip-mpls">Optimize MPLS</button>
            </div>

            {/* Similar incidents */}
            <div className="assistant__section-lbl">SIMILAR INCIDENTS</div>
            <div className="incidents-list">
              {INCIDENTS.map(inc => (
                <div key={inc.id} className="incident-row">
                  <div>
                    <span className="incident-row__id">Incident {inc.id}</span>
                    <span className="incident-row__desc">{inc.desc}</span>
                  </div>
                  <span className="incident-row__score">{inc.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <div className="assistant__input-row">
            <input
              id="assistant-chat-input"
              type="text"
              className="assistant__input"
              placeholder="Ask AryaCopilot..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              id="assistant-send-btn"
              className="assistant__send-btn"
              aria-label="Send message"
              onClick={handleSend}
            >
              <MdSend />
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 3: Timeline + RCA + Recommendations ── */}
      <div className="dash-bot-row">

        {/* Prediction Timeline */}
        <div className="panel chart-panel">
          <div className="panel__header">
            <h3 className="panel__title">PREDICTION TIMELINE (24H)</h3>
          </div>
          <div className="chart-panel__body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={predictionData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="prob"  name="Prob."  stroke="#EF4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="cpu"   name="CPU"    stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="drops" name="Drops"  stroke="#FF6B00" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            <div className="chart-legend">
              <span className="chart-legend__item">
                <span className="chart-legend__line" style={{ background: '#EF4444' }} /> Prob.
              </span>
              <span className="chart-legend__item">
                <span className="chart-legend__line" style={{ background: '#3B82F6' }} /> CPU
              </span>
              <span className="chart-legend__item">
                <span className="chart-legend__line" style={{ background: '#FF6B00' }} /> Drops
              </span>
            </div>
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div className="panel rca-panel">
          <div className="panel__header">
            <h3 className="panel__title">ROOT CAUSE ANALYSIS</h3>
          </div>
          <div className="rca-panel__body">
            {/* Meta */}
            <div className="rca-meta">
              <div className="rca-meta__item">
                <span className="rca-meta__label">TARGET</span>
                <span className="rca-meta__value">Router: R5</span>
              </div>
              <div className="rca-meta__item">
                <span className="rca-meta__label">CONFIDENCE</span>
                <span className="rca-meta__value rca-meta__value--alert">91% (High)</span>
              </div>
            </div>

            {/* Identified Cause */}
            <div className="rca-cause">
              <div className="rca-cause__label">IDENTIFIED CAUSE</div>
              <div className="rca-cause__title">OSPF Route Flapping</div>
              <div className="rca-cause__desc">
                Intermittent Layer 2 Instability on Interface Gi0/0/1.
              </div>
            </div>

            {/* Supporting Observations */}
            <div className="rca-obs__label">SUPPORTING OBSERVATIONS</div>
            <div className="rca-obs-list">
              <div className="rca-obs-row">
                <span>CPU Utilization</span>
                <span className="rca-obs-row__val">
                  <span className="obs-dot obs-dot--red" />+95%
                </span>
              </div>
              <div className="rca-obs-row">
                <span>Packet Loss</span>
                <span className="rca-obs-row__val">
                  <span className="obs-dot obs-dot--orange" />7%
                </span>
              </div>
              <div className="rca-obs-row">
                <span>BGP Neighbors</span>
                <span className="rca-obs-row__val">
                  <span className="obs-dot obs-dot--green" />Stable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="panel rec-panel">
          <div className="panel__header">
            <h3 className="panel__title">AI RECOMMENDATIONS</h3>
          </div>
          <div className="rec-panel__body">
            <div className="rec-item">
              <span className="rec-item__icon"><MdFlashOn /></span>
              <span className="rec-item__text">Increase queue buffer</span>
            </div>
            <div className="rec-item">
              <span className="rec-item__icon"><MdRefresh /></span>
              <span className="rec-item__text">Restart MPLS tunnel</span>
            </div>
          </div>
          <button id="btn-mitigation-plan" className="rec-cta-btn">
            GENERATE MITIGATION PLAN
          </button>
        </div>

      </div>
    </div>
  );
}

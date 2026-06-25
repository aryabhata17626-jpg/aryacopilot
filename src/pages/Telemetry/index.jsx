import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import KPICard from '../../components/KPICard/index.jsx';
import './Telemetry.css';

/* ══════════════════════════════════════════════════════
   Static / Seed Data
══════════════════════════════════════════════════════ */
const TIME_LABELS = ['14:20', '14:25', '14:30', '14:35', '14:40', '14:45', '14:50', '14:55', '15:00', '15:05', '15:10', '15:15'];

const CHART_SEED = [
  { t: '14:20', cpu: 55,  mem: 62, queue: 22, drops: 4  },
  { t: '14:25', cpu: 62,  mem: 65, queue: 28, drops: 6  },
  { t: '14:30', cpu: 70,  mem: 68, queue: 35, drops: 9  },
  { t: '14:35', cpu: 78,  mem: 72, queue: 45, drops: 14 },
  { t: '14:40', cpu: 85,  mem: 74, queue: 55, drops: 20 },
  { t: '14:45', cpu: 95,  mem: 78, queue: 81, drops: 31 },
  { t: '14:50', cpu: 91,  mem: 76, queue: 72, drops: 26 },
  { t: '14:55', cpu: 88,  mem: 74, queue: 65, drops: 22 },
  { t: '15:00', cpu: 82,  mem: 71, queue: 58, drops: 18 },
  { t: '15:05', cpu: 79,  mem: 69, queue: 50, drops: 15 },
  { t: '15:10', cpu: 75,  mem: 67, queue: 44, drops: 12 },
  { t: '15:15', cpu: 72,  mem: 65, queue: 40, drops: 10 },
];

const NETFLOW_ROWS = [
  { src: '10.10.9.1',   dst: '10.10.9.4',   proto: 'TCP',  pkts: '14,301', bytes: '2.4 GB',  app: 'Telemetry'  },
  { src: '10.10.0.23',  dst: '192.168.1.1',  proto: 'UDP',  pkts: '8,102',  bytes: '412 MB',  app: 'Syslog'     },
  { src: '172.16.8.5',  dst: '10.10.18.2',   proto: 'ICMP', pkts: '45',     bytes: '12 kB',   app: 'Management' },
  { src: '10.0.1.1',    dst: '10.0.1.254',   proto: 'TCP',  pkts: '21,488', bytes: '5.1 GB',  app: 'MPLS-TE'    },
  { src: '192.168.10.5',dst: '10.10.0.1',    proto: 'UDP',  pkts: '3,210',  bytes: '98 MB',   app: 'NetFlow'    },
];

const SYSLOG_SEED = [
  { ts: '14:30:16', sev: 'INFO',     msg: 'OSPF Neighbor 10.1.1.1 (GiO/0/3) Established' },
  { ts: '14:31:04', sev: 'WARNING',  msg: 'Queue Depth Increased on TenO/1/0 (Threshold 80%)' },
  { ts: '14:31:31', sev: 'CRITICAL', msg: 'MPLS Tunnel ID: 402 Redistributed — BFD Triggered' },
  { ts: '14:32:18', sev: 'INFO',     msg: 'BGP session with 10.2.0.1 re-established (AS 65001)' },
  { ts: '14:33:05', sev: 'WARNING',  msg: 'Interface TenGig0/0/0/1 CRC errors exceeded threshold' },
  { ts: '14:33:47', sev: 'INFO',     msg: 'OSPF LSA update received from CORE-R3 (area 0.0.0.0)' },
  { ts: '14:34:12', sev: 'CRITICAL', msg: 'CPU utilization on CORE-R2 reached 95% — critical threshold' },
];

const AI_INSIGHTS = [
  {
    idx: '01',
    color: '#FF6B00',
    title: 'CPU Spike Correlated',
    body: 'CPU utilization increased by 12% in the last 15 minutes. This correlates with a spike in OSPF LSA updates from neighboring node DIST-R1.',
  },
  {
    idx: '02',
    color: '#F59E0B',
    title: 'Queue Depth Growth',
    body: 'Packet drops on Ten1/0/0 match the queue depth growth. Recommendation: Increase buffer size or investigate egress policing on adjacent switch.',
  },
  {
    idx: '03',
    color: '#22C55E',
    title: 'Telemetry Optimization',
    body: 'Telemetry polling optimization could save approximately 4.2 units of compute cost per hour with negligible loss in visibility.',
  },
];

/* ══════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════ */
function getTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function sevClass(sev) {
  if (sev === 'CRITICAL') return 'tel-log__sev--crit';
  if (sev === 'WARNING')  return 'tel-log__sev--warn';
  return 'tel-log__sev--info';
}

/* ══════════════════════════════════════════════════════
   Custom Chart Tooltip
══════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tel-chart-tip">
      <div className="tel-chart-tip__lbl">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="tel-chart-tip__row" style={{ color: p.stroke }}>
          {p.name}: <strong>{p.value}{p.dataKey === 'drops' ? '' : '%'}</strong>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function TelemetryExplorer() {
  const [activeNode,    setActiveNode]    = useState('CORE-R2');
  const [timeRange,     setTimeRange]     = useState('1h');
  const [optAccepted,   setOptAccepted]   = useState(false);
  const [liveTime,      setLiveTime]      = useState(getTime());
  const [logs,          setLogs]          = useState(SYSLOG_SEED);
  const logRef = useRef(null);

  /* Tick the live clock */
  useEffect(() => {
    const id = setInterval(() => setLiveTime(getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Simulate streaming log entries */
  useEffect(() => {
    const msgs = [
      { sev: 'INFO',     msg: 'NetFlow export to collector 10.255.0.5 successful' },
      { sev: 'WARNING',  msg: 'Latency on MPLS tunnel Te0/0/0/2 exceeded 25ms SLA' },
      { sev: 'INFO',     msg: 'Telemetry agent reconnected to gRPC server' },
      { sev: 'CRITICAL', msg: 'OSPF adjacency dropped on CORE-R2 interface GiO/1/2' },
    ];
    let i = 0;
    const id = setInterval(() => {
      const m = msgs[i % msgs.length];
      setLogs(prev => [...prev.slice(-20), { ts: getTime(), ...m }]);
      i++;
    }, 4000);
    return () => clearInterval(id);
  }, []);

  /* Auto-scroll logs */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const TIME_BTNS = ['1h', '6h', '24h', '7d'];

  return (
    <div className="tel-page">

      {/* ── Page Header ────────────────────────────── */}
      <div className="tel-page-hd">
        <div>
          <h1 className="tel-page-hd__title">TELEMETRY EXPLORER</h1>
          <p  className="tel-page-hd__sub">Real-Time Network Telemetry and Device Monitoring</p>
        </div>
        <div className="tel-hd-chips">
          <span className="tel-chip tel-chip--time">⏱ Time: {liveTime} UTC</span>
          <span className="tel-chip tel-chip--status">● Status: Air-Gapped</span>
          <span className="tel-chip tel-chip--health">Health: 99%</span>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ───────────────────────── */}
      <div className="tel-kpi-row">
        <KPICard
          label="Total Devices"
          value="524"
          variant="change"
          changeValue="UNITS"
          changeType="positive"
        />
        <KPICard
          label="OSPF Neighbors"
          value="10,622"
          variant="badge"
          badgeText="YN"
          badgeType="info"
        />
        <KPICard
          label="NetFlow Records"
          value="2.4 Million"
          variant="change"
          changeValue="+18.3%"
          changeType="positive"
        />
        <KPICard
          label="Average Latency"
          value="14 MS"
          variant="gauge"
          gaugeValue={72}
          subLabel="ACCEPTABLE"
          subLabelColor="#22C55E"
        />
      </div>

      {/* ── Control Bar ────────────────────────────── */}
      <div className="tel-ctrl-bar">
        <div className="tel-ctrl-bar__left">
          <div className="tel-ctrl-group">
            <label className="tel-ctrl-lbl" htmlFor="tel-node-select">ACTIVE NODE</label>
            <select
              id="tel-node-select"
              className="tel-ctrl-select"
              value={activeNode}
              onChange={e => setActiveNode(e.target.value)}
            >
              {['CORE-R2', 'CORE-R3', 'EDGE-R1', 'EDGE-R2', 'DIST-R1'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="tel-ctrl-group">
            <span className="tel-ctrl-lbl">TIME RANGE</span>
            <div className="tel-time-btns">
              {TIME_BTNS.map(t => (
                <button
                  key={t}
                  id={`btn-time-${t}`}
                  className={`tel-time-btn${timeRange === t ? ' tel-time-btn--active' : ''}`}
                  onClick={() => setTimeRange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="tel-ctrl-bar__right">
          <div className="tel-ctrl-group">
            <span className="tel-ctrl-lbl">REFRESH RATE</span>
            <span className="tel-ctrl-val">5 SEC</span>
          </div>
          <span className="tel-live-badge">● LIVE TELEMETRY STREAM</span>
        </div>
      </div>

      {/* ── Main Telemetry Chart ────────────────────── */}
      <div className="tel-panel tel-chart-panel">
        <div className="tel-panel__hd">
          <h2 className="tel-panel__ttl">LIVE TELEMETRY CANVAS — {activeNode}</h2>
          <div className="tel-chart-legend">
            <span className="tel-leg-item"><span className="tel-leg-dot" style={{ background: '#FF6B00' }} />CPU</span>
            <span className="tel-leg-item"><span className="tel-leg-dot" style={{ background: '#3B82F6' }} />MEM</span>
            <span className="tel-leg-item"><span className="tel-leg-dot" style={{ background: '#22C55E' }} />QD</span>
            <span className="tel-leg-item"><span className="tel-leg-dot" style={{ background: '#EF4444' }} />DROP</span>
          </div>
        </div>
        <div className="tel-chart-body">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CHART_SEED} margin={{ top: 8, right: 16, bottom: 0, left: -20 }}>
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
                domain={[0, 100]}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="cpu"   name="CPU"        stroke="#FF6B00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mem"   name="Memory"     stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="queue" name="Queue Depth" stroke="#22C55E" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="drops" name="Pkt Drops"  stroke="#EF4444" strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Middle Row: Device Telemetry + NetFlow + Protocol Health ── */}
      <div className="tel-mid-row">

        {/* Device Telemetry */}
        <div className="tel-panel">
          <div className="tel-panel__hd">
            <h2 className="tel-panel__ttl">SNMP TELEMETRY</h2>
            <span className="tel-health-badge tel-health-badge--ok">● Healthy</span>
          </div>
          <div className="tel-device-body">
            {[
              { lbl: 'CPU Utilization', val: '82%',    pct: 82, sev: 'crit' },
              { lbl: 'Memory Usage',    val: '74%',    pct: 74, sev: 'warn' },
              { lbl: 'Temperature',     val: '44°C',   pct: 58, sev: 'ok'   },
              { lbl: 'Queue Depth',     val: '81',     pct: 81, sev: 'warn' },
              { lbl: 'Uptime',          val: '27 DAYS', pct: 100, sev: 'ok' },
            ].map(m => (
              <div key={m.lbl} className="tel-dev-row">
                <div className="tel-dev-row__top">
                  <span className="tel-dev-row__lbl">{m.lbl}</span>
                  <span className={`tel-dev-row__val tel-dev-row__val--${m.sev}`}>{m.val}</span>
                </div>
                <div className="tel-dev-track">
                  <div className={`tel-dev-fill tel-dev-fill--${m.sev}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NetFlow Analysis */}
        <div className="tel-panel">
          <div className="tel-panel__hd">
            <h2 className="tel-panel__ttl">NETFLOW ANALYSIS</h2>
          </div>
          <div className="tel-nf-body">
            <table className="tel-nf-table">
              <thead>
                <tr>
                  <th>SRC ADDRESS</th>
                  <th>DST ADDRESS</th>
                  <th>PROT</th>
                  <th>PKTS</th>
                  <th>BYTES</th>
                  <th>APP</th>
                </tr>
              </thead>
              <tbody>
                {NETFLOW_ROWS.map((r, i) => (
                  <tr key={i}>
                    <td className="tel-nf-mono">{r.src}</td>
                    <td className="tel-nf-mono">{r.dst}</td>
                    <td>
                      <span className={`tel-proto tel-proto--${r.proto.toLowerCase()}`}>{r.proto}</span>
                    </td>
                    <td>{r.pkts}</td>
                    <td>{r.bytes}</td>
                    <td>
                      <span className="tel-app-link">{r.app}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Protocol Health */}
        <div className="tel-panel">
          <div className="tel-panel__hd">
            <h2 className="tel-panel__ttl">PROTOCOL HEALTH</h2>
          </div>
          <div className="tel-proto-body">

            {/* OSPF */}
            <div className="tel-proto-card">
              <div className="tel-proto-card__hd">
                <span className="tel-proto-card__name">⬡ OSPF STATUS</span>
                <span className="tel-status-badge tel-status-badge--ok">FULL</span>
              </div>
              <div className="tel-proto-grid">
                <div><span className="tel-pg-lbl">NEIGHBORS</span><span className="tel-pg-val">5</span></div>
                <div><span className="tel-pg-lbl">STATE</span><span className="tel-pg-val">FULL</span></div>
                <div><span className="tel-pg-lbl">LSA COUNT</span><span className="tel-pg-val">382</span></div>
                <div><span className="tel-pg-lbl">CONVERGENCE</span><span className="tel-pg-val">1.8s</span></div>
              </div>
            </div>

            {/* MPLS */}
            <div className="tel-proto-card">
              <div className="tel-proto-card__hd">
                <span className="tel-proto-card__name">⇆ MPLS STATUS</span>
                <span className="tel-status-badge tel-status-badge--ok">ACTIVE</span>
              </div>
              <div className="tel-proto-grid">
                <div><span className="tel-pg-lbl">STATUS</span><span className="tel-pg-val">ACTIVE</span></div>
                <div><span className="tel-pg-lbl">LABELS</span><span className="tel-pg-val">38</span></div>
                <div><span className="tel-pg-lbl">CHANGES</span><span className="tel-pg-val">2</span></div>
                <div><span className="tel-pg-lbl">LATENCY</span><span className="tel-pg-val">32ms</span></div>
              </div>
            </div>

            {/* NetFlow */}
            <div className="tel-proto-card">
              <div className="tel-proto-card__hd">
                <span className="tel-proto-card__name">⊞ NETFLOW STATUS</span>
                <span className="tel-status-badge tel-status-badge--ok">EXPORTING</span>
              </div>
              <div className="tel-proto-grid">
                <div><span className="tel-pg-lbl">FLOWS/SEC</span><span className="tel-pg-val">8,420</span></div>
                <div><span className="tel-pg-lbl">COLLECTOR</span><span className="tel-pg-val">UP</span></div>
                <div><span className="tel-pg-lbl">VERSION</span><span className="tel-pg-val">v9</span></div>
                <div><span className="tel-pg-lbl">EXPORT INT</span><span className="tel-pg-val">60s</span></div>
              </div>
            </div>

            {/* Latency */}
            <div className="tel-proto-card tel-proto-card--latency">
              <div className="tel-proto-card__hd">
                <span className="tel-proto-card__name">◎ LATENCY</span>
                <span className="tel-status-badge tel-status-badge--warn">14 MS AVG</span>
              </div>
              <div className="tel-proto-grid">
                <div><span className="tel-pg-lbl">MIN</span><span className="tel-pg-val">4ms</span></div>
                <div><span className="tel-pg-lbl">MAX</span><span className="tel-pg-val">38ms</span></div>
                <div><span className="tel-pg-lbl">P95</span><span className="tel-pg-val">29ms</span></div>
                <div><span className="tel-pg-lbl">JITTER</span><span className="tel-pg-val">3ms</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Syslog + Adaptive Engine + AI Insights ── */}
      <div className="tel-bot-row">

        {/* Live Syslog */}
        <div className="tel-panel tel-log-panel">
          <div className="tel-panel__hd tel-panel__hd--dark">
            <h2 className="tel-panel__ttl tel-panel__ttl--light">LIVE SYSLOG STREAM</h2>
            <span className="tel-rec-badge">● RECORDING</span>
          </div>
          <div className="tel-log-body" ref={logRef}>
            {logs.map((l, i) => (
              <div key={i} className="tel-log-row">
                <span className="tel-log__ts">{l.ts}</span>
                <span className={`tel-log__sev ${sevClass(l.sev)}`}>{l.sev}</span>
                <span className="tel-log__msg">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Adaptive Telemetry Engine */}
        <div className="tel-panel tel-adapt-panel">
          <div className="tel-panel__hd">
            <h2 className="tel-panel__ttl">⚡ ADAPTIVE TELEMETRY ENGINE</h2>
          </div>
          <div className="tel-adapt-body">
            <div className="tel-adapt-stats">
              <div className="tel-adapt-stat">
                <span className="tel-adapt-stat__lbl">CURRENT POLLING</span>
                <span className="tel-adapt-stat__val">90s</span>
              </div>
              <div className="tel-adapt-stat">
                <span className="tel-adapt-stat__lbl">ENGINE RECOMMEND.</span>
                <span className="tel-adapt-stat__val tel-adapt-stat__val--prim">10s</span>
              </div>
              <div className="tel-adapt-stat">
                <span className="tel-adapt-stat__lbl">BW SAVED</span>
                <span className="tel-adapt-stat__val tel-adapt-stat__val--green">90%</span>
              </div>
              <div className="tel-adapt-stat">
                <span className="tel-adapt-stat__lbl">CONFIDENCE</span>
                <span className="tel-adapt-stat__val tel-adapt-stat__val--prim">89%</span>
              </div>
            </div>

            <div className="tel-adapt-rec">
              Anomaly detection suggests stable traffic. Increasing polling interval to optimize control plane resources.
            </div>

            <button
              id="btn-accept-optimization"
              className={`tel-adapt-cta${optAccepted ? ' tel-adapt-cta--accepted' : ''}`}
              onClick={() => setOptAccepted(true)}
              disabled={optAccepted}
            >
              {optAccepted ? '✓ OPTIMIZATION ACCEPTED' : 'ACCEPT OPTIMIZATION'}
            </button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="tel-panel tel-ai-panel">
          <div className="tel-panel__hd">
            <h2 className="tel-panel__ttl">⬡ AI INSIGHTS</h2>
          </div>
          <div className="tel-ai-body">
            {AI_INSIGHTS.map(ins => (
              <div key={ins.idx} className="tel-ai-item">
                <div className="tel-ai-item__num" style={{ background: ins.color }}>{ins.idx}</div>
                <div className="tel-ai-item__content">
                  <div className="tel-ai-item__title">{ins.title}</div>
                  <p className="tel-ai-item__body">{ins.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import KPICard from '../../components/KPICard/index.jsx';
import './Alerts.css';
import { MdWarning, MdInfo, MdError, MdCheckCircle } from 'react-icons/md';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const FEED_ITEMS = [
  {
    id: 'ALERT-2024-4',
    device: 'CORE-R2',
    title: 'Predicted failure within 18 minutes',
    desc: 'Confidence: 91% | Impact: High | Source: AryaAIEngine',
    severity: 'Critical',
    tags: ['CRITICAL', 'PREDICTION'],
    time: '14:22 UTC',
  },
  {
    id: 'ALERT-2024-5',
    device: 'EDGE-R1',
    title: 'Queue depth exceeded threshold',
    desc: 'Confidence: 84% | Impact: Medium',
    severity: 'Warning',
    tags: ['WARNING', 'NETWORK'],
    time: '14:20 UTC',
  },
  {
    id: 'ALERT-2024-6',
    device: 'DB-SW1',
    title: 'NetFlow export completed',
    desc: 'Duration: 4m 12s | Status: Success',
    severity: 'Info',
    tags: ['INFO', 'SYSTEM'],
    time: '14:18 UTC',
  },
];

const TIMELINE = [
  { time: '14:18', title: 'CPU Utilization Increased', msg: 'Threshold exceeded', status: 'warn' },
  { time: '14:20', title: 'Packet Loss Detected', msg: 'Threshold of 2% exceeded', status: 'warn' },
  { time: '14:22', title: 'Queue Overflow', msg: 'Buffer exhaustion imminent', status: 'warn' },
  { time: '14:28', title: 'Critical Alert Generated', msg: 'Failure prediction confirmed', status: 'crit' },
];

/* ══════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════ */
function getSevIcon(sev) {
  if (sev === 'Critical') return <MdError className="alerts-feed-icon alerts-feed-icon--crit" />;
  if (sev === 'Warning')  return <MdWarning className="alerts-feed-icon alerts-feed-icon--warn" />;
  return <MdInfo className="alerts-feed-icon alerts-feed-icon--info" />;
}

function getTagClass(tag) {
  if (tag === 'CRITICAL') return 'alerts-feed-tag--crit';
  if (tag === 'WARNING')  return 'alerts-feed-tag--warn';
  if (tag === 'INFO')     return 'alerts-feed-tag--info';
  return 'alerts-feed-tag--plain';
}

/* ══════════════════════════════════════════════════════
   Severity Donut Chart component
══════════════════════════════════════════════════════ */
function SeverityChart() {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 15%, 35%, 40%, 10%
  const critOffset = circumference;
  const warnOffset = circumference - (0.15 * circumference);
  const infoOffset = circumference - (0.50 * circumference);
  const resOffset  = circumference - (0.90 * circumference);

  return (
    <div className="alerts-sev-svg">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        
        {/* Info (40%) */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#22C55E" strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={infoOffset} />
                
        {/* Warning (35%) */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#F59E0B" strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={warnOffset} />
                
        {/* Critical (15%) */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#DC2626" strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={critOffset} />
      </svg>
      <div className="alerts-sev-center">
        <div className="alerts-sev-num">27</div>
        <div className="alerts-sev-lbl">TOTAL</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function AlertsCenter() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [timeRange, setTimeRange] = useState('24 Hours');
  const [selectedId, setSelectedId] = useState(FEED_ITEMS[0].id);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="alerts-page">
      
      {/* ── Page Header ────────────────────────────── */}
      <div className="alerts-page-hd">
        <div>
          <h1 className="alerts-page-hd__title">ALERTS CENTER</h1>
          <p className="alerts-page-hd__sub">Real-Time Alert Monitoring and Incident Prioritization</p>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────── */}
      <div className="alerts-kpi-row">
        <KPICard label="Active Alerts" value="27" variant="change" changeValue="" />
        <KPICard label="Critical Alerts" value="4" variant="change" changeValue="" changeType="negative" />
        <KPICard label="Predicted Failures" value="3" variant="change" changeValue="" changeType="negative" />
        <KPICard label="Resolved Today" value="18" variant="progress" progressValue={100} progressColor="#22C55E" />
      </div>

      {/* ── Filter Bar ─────────────────────────────── */}
      <div className="alerts-filter-bar">
        <input
          type="text"
          className="alerts-search-input"
          placeholder="Search alerts, routers, incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="alerts-filter-group">
          <span className="alerts-filter-lbl">CATEGORY:</span>
          <select className="alerts-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Info</option>
          </select>
        </div>
        <div className="alerts-filter-group">
          <span className="alerts-filter-lbl">TIME:</span>
          <select className="alerts-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option>24 Hours</option>
            <option>7 Days</option>
            <option>30 Days</option>
          </select>
        </div>
        <button className="alerts-export-btn">EXPORT ALERTS</button>
      </div>

      {/* ── Main Layout ────────────────────────────── */}
      <div className="alerts-main">
        
        {/* Left Section (65%) */}
        <div className="alerts-left">
          
          {/* Live Alert Feed */}
          <div className="alerts-panel">
            <div className="alerts-panel__hd">
              <h2 className="alerts-panel__ttl">LIVE ALERT FEED</h2>
              <span style={{ fontSize: '0.6rem', color: '#6B7280' }}>Last Update: {clock} UTC</span>
            </div>
            <div className="alerts-feed-body">
              {FEED_ITEMS.map((item) => (
                <div 
                  key={item.id} 
                  className={`alerts-feed-item ${selectedId === item.id ? 'alerts-feed-item--selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  {getSevIcon(item.severity)}
                  <div className="alerts-feed-content">
                    <div className="alerts-feed-meta">
                      <div className="alerts-feed-tags">
                        {item.tags.map(t => (
                          <span key={t} className={`alerts-feed-tag ${getTagClass(t)}`}>{t}</span>
                        ))}
                      </div>
                      <span className="alerts-feed-time">{item.time}</span>
                    </div>
                    <div className="alerts-feed-title">{item.device}: {item.title}</div>
                    <div className="alerts-feed-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Timeline */}
          <div className="alerts-panel">
            <div className="alerts-panel__hd">
              <h2 className="alerts-panel__ttl">ALERT TIMELINE</h2>
            </div>
            <div className="alerts-tl-body">
              <div className="alerts-timeline">
                {TIMELINE.map((item, i) => (
                  <div className={`alerts-tl-item alerts-tl-item--${item.status}`} key={i}>
                    <div className="alerts-tl-dot" />
                    <div className="alerts-tl-title">
                      <span className="alerts-tl-time">{item.time}</span>
                      {item.title}
                    </div>
                    <div className="alerts-tl-msg">{item.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Section (35%) */}
        <div className="alerts-right">
          
          {/* Alert Details Panel */}
          <div className="alerts-panel">
            <div className="alerts-panel__hd alerts-panel__hd--red">
              <h2 className="alerts-panel__ttl">{selectedId} · SELECTED</h2>
              <span style={{ color: '#FFFFFF', cursor: 'pointer', fontSize: '0.8rem' }}>✕</span>
            </div>
            <div className="alerts-details-body">
              <div className="alerts-det-title">CORE-R2 Details</div>
              
              <div className="alerts-det-grid">
                <div className="alerts-det-item">
                  <span className="alerts-det-lbl">Severity</span>
                  <span className="alerts-det-val alerts-det-val--crit">CRITICAL</span>
                </div>
                <div className="alerts-det-item">
                  <span className="alerts-det-lbl">Status</span>
                  <span className="alerts-det-val">OPEN</span>
                </div>
                <div className="alerts-det-item">
                  <span className="alerts-det-lbl">Prediction</span>
                  <span className="alerts-det-val">18 Minutes</span>
                </div>
                <div className="alerts-det-item">
                  <span className="alerts-det-lbl">Confidence</span>
                  <span className="alerts-det-val">91%</span>
                </div>
              </div>

              <div className="alerts-impact">
                <span className="alerts-impact-lbl">Impact Analysis</span>
                <div className="alerts-impact-row">
                  Affected Devices <span>4 Nodes</span>
                </div>
                <div className="alerts-impact-devices">
                  <span className="alerts-impact-tag">TELEMETRY</span>
                  <span className="alerts-impact-tag">VPN</span>
                  <span className="alerts-impact-tag">MPLS</span>
                  <span className="alerts-impact-tag">DATABASE</span>
                </div>
                <span className="alerts-impact-lbl">Business Impact</span>
                <div className="alerts-biz-impact">CRITICAL / HIGH REVENUE RISK</div>
              </div>

              <div className="alerts-sev-chart">
                <SeverityChart />
                <div className="alerts-sev-legend">
                  <div className="alerts-sev-leg-item">
                    <span className="alerts-sev-leg-dot" style={{ background: '#DC2626' }} /> Critical (15%)
                  </div>
                  <div className="alerts-sev-leg-item">
                    <span className="alerts-sev-leg-dot" style={{ background: '#F59E0B' }} /> Warning (35%)
                  </div>
                  <div className="alerts-sev-leg-item">
                    <span className="alerts-sev-leg-dot" style={{ background: '#22C55E' }} /> Info (40%)
                  </div>
                  <div className="alerts-sev-leg-item">
                    <span className="alerts-sev-leg-dot" style={{ background: '#9CA3AF' }} /> Resolved (10%)
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Remediation Plan */}
          <div className="alerts-panel">
            <div className="alerts-panel__hd">
              <h2 className="alerts-panel__ttl" style={{ color: 'var(--color-primary)' }}>⬡ AryaCopilot Remediation Plan</h2>
            </div>
            <div className="alerts-rem-body">
              
              <div className="alerts-rem-grid">
                <div className="alerts-rem-item">
                  <div className="alerts-rem-title">Increase Queue Buffer</div>
                  <div className="alerts-rem-risk">Risk: <span className="red">91%</span> → <span className="green">43%</span></div>
                  <button className="alerts-rem-exec-btn">EXECUTE</button>
                </div>
                <div className="alerts-rem-item">
                  <div className="alerts-rem-title">Restart MPLS Tunnel</div>
                  <div className="alerts-rem-risk">Risk: <span className="red">43%</span> → <span className="green">16%</span></div>
                  <button className="alerts-rem-exec-btn">EXECUTE</button>
                </div>
                <div className="alerts-rem-item">
                  <div className="alerts-rem-title">Reduce Polling Freq.</div>
                  <div className="alerts-rem-risk">Risk: <span className="red">16%</span> → <span className="green">12%</span></div>
                  <button className="alerts-rem-exec-btn">EXECUTE</button>
                </div>
              </div>

              <div className="alerts-rem-actions">
                <button className="alerts-btn-outline">OPEN RCA</button>
                <button className="alerts-btn-outline">VIEW TOPOLOGY</button>
                <button className="alerts-btn-outline">VIEW INCIDENT HISTORY</button>
                <button className="alerts-btn-solid" style={{ width: '100%', marginTop: '6px' }}>GENERATE MITIGATION PLAN</button>
              </div>

            </div>
          </div>

          {/* AryaCopilot Insight */}
          <div className="alerts-panel">
            <div className="alerts-insight-body">
              <div className="alerts-insight-icon">⬡</div>
              <div>
                <div className="alerts-insight-header">AryaAI · Now</div>
                <div className="alerts-insight-txt">
                  I've detected a recurring pattern. This is the 4th time CORE-R2 has shown queue congestion in the last 72 hours. Correlations suggest that this coincides with peak traffic from the VPN gateway during telemetry syncs. Implementing Recommendation 1 should reduce total downtime by an estimated 22 minutes today.
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

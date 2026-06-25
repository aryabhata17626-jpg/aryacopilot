import { useState } from 'react';
import KPICard from '../../components/KPICard/index.jsx';
import './Logs.css';
import { MdSearch, MdFilterList, MdOutlineSystemUpdateAlt, MdClose } from 'react-icons/md';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const LIVE_LOGS = [
  { id: 'l1', time: '14:22:14', sev: 'INFO',     dev: 'CORE-R2',  proto: 'OSPF', msg: 'Neighbor Established' },
  { id: 'l2', time: '14:23:05', sev: 'WARNING',  dev: 'EDGE-R1',  proto: 'SNMP', msg: 'Queue Depth Exceeded Threshold' },
  { id: 'l3', time: '14:24:12', sev: 'CRITICAL', dev: 'CORE-R2',  proto: 'MPLS', msg: 'Tunnel Restart Count Reached 4' },
  { id: 'l4', time: '14:25:01', sev: 'INFO',     dev: 'DIST-SW1', proto: 'STP',  msg: 'Root Bridge Updated' },
];

const TIMELINE = [
  { label: 'CPU Spike',         status: 'warn' },
  { label: 'Packet Loss',       status: 'warn' },
  { label: 'Queue Overflow',    status: 'warn' },
  { label: 'OSPF Lost',         status: 'warn' },
  { label: 'Tunnel Restart',    status: 'crit' },
  { label: 'Failure Predicted', status: 'grey' },
];

const INSIGHTS = [
  "\"The MPLS tunnel failure at 14:24:12 correlates with the SNMP Queue Depth alerts on EDGE-R1 (14:23:05).\"",
  "\"Recommend checking path MTU between 10.10.0.1 and 10.10.0.4 due to repeated keepalive timeouts.\"",
  "\"Probability of full service disruption in next 12 minutes: 82%.\""
];

/* ══════════════════════════════════════════════════════
   Chart Component
══════════════════════════════════════════════════════ */
function DistributionChart() {
  const size = 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // 45%, 22%, 18%, 10%, 5%
  const offset1 = circumference;
  const offset2 = circumference - (0.45 * circumference);
  const offset3 = circumference - ((0.45 + 0.22) * circumference);
  const offset4 = circumference - ((0.45 + 0.22 + 0.18) * circumference);
  const offset5 = circumference - ((0.45 + 0.22 + 0.18 + 0.10) * circumference);

  return (
    <div className="logs-dist-svg">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#FED7AA" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset5} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#FDBA74" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset4} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#FB923C" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset3} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#F97316" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset2} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#FF6B00" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset1} />
      </svg>
      <div className="logs-dist-center">100%</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function LogsExplorer() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Last 24 Hours');
  const [selectedLogId, setSelectedLogId] = useState('l3'); // Default to critical alert

  return (
    <div className="logs-page">

      {/* ── Page Header ────────────────────────────── */}
      <div className="logs-page-hd">
        <div>
          <h1 className="logs-page-hd__title">LOGS EXPLORER</h1>
          <p className="logs-page-hd__sub">Real-Time Log Analytics and Event Inspection</p>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────── */}
      <div className="logs-kpi-row">
        <KPICard label="Syslog Messages" value="18,492" variant="change" changeValue="+2.4%" changeType="positive" />
        <KPICard label="SNMP Traps" value="3,128" variant="badge" badgeText="STABLE" badgeType="default" />
        <div className="logs-kpi-crit" style={{ borderRadius: 'var(--radius-md)' }}>
          <KPICard label="Critical Events" value="184" variant="badge" badgeText="ALERT" badgeType="danger" />
        </div>
        <KPICard label="Avg Search Time" value="14 ms" variant="badge" badgeText="OPTIMAL" badgeType="success" />
      </div>

      {/* ── Filter Toolbar ─────────────────────────── */}
      <div className="logs-filter-bar">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <MdSearch style={{ position: 'absolute', left: '10px', color: '#9CA3AF' }} />
          <input
            type="text"
            className="logs-search-input"
            style={{ paddingLeft: '32px' }}
            placeholder="FILTER LOGS (e.g. device:CORE-R2 severity:CRITICAL)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="logs-filter-group">
          <span className="logs-filter-lbl">TY:</span>
          <select className="logs-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option>ALL</option>
            <option>Syslog</option>
            <option>SNMP</option>
            <option>NetFlow</option>
            <option>Telemetry</option>
          </select>
        </div>
        <div className="logs-filter-group">
          <select className="logs-select" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option>LAST 24 HOURS</option>
            <option>LAST 7 DAYS</option>
            <option>LAST 30 DAYS</option>
          </select>
        </div>
        <button className="logs-export-btn">EXPORT LOGS</button>
      </div>

      {/* ── Main Layout ────────────────────────────── */}
      <div className="logs-main">
        
        {/* ── Left Section ─────────────────────────── */}
        <div className="logs-left">
          
          {/* Live Log Stream */}
          <div className="logs-panel">
            <div className="logs-panel__hd">
              <h2 className="logs-panel__ttl">LIVE LOG STREAM</h2>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '2px 6px', borderRadius: '10px' }}>
                ● AUTO-REFRESH ACTIVE
              </span>
            </div>
            <div className="logs-table-wrap">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>SEVERITY</th>
                    <th>DEVICE</th>
                    <th>PROTOCOL</th>
                    <th>MESSAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {LIVE_LOGS.map((log) => (
                    <tr 
                      key={log.id} 
                      className={selectedLogId === log.id ? 'logs-row--selected' : ''}
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <td className="logs-time">{log.time}</td>
                      <td>
                        <span className={`logs-sev logs-sev--${log.sev.toLowerCase().substring(0,4)}`}>
                          <span className="logs-sev-dot" /> {log.sev}
                        </span>
                      </td>
                      <td>{log.dev}</td>
                      <td>{log.proto}</td>
                      <td className="logs-msg-col">{log.msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="logs-load-more">LOAD MORE LOGS (420 PENDING)</button>
            </div>
          </div>

          {/* Event Correlation Timeline */}
          <div className="logs-panel">
            <div className="logs-panel__hd">
              <h2 className="logs-panel__ttl">EVENT CORRELATION TIMELINE</h2>
            </div>
            <div className="logs-hz-tl-body">
              <div className="logs-hz-tl">
                {TIMELINE.map((node, i) => (
                  <div key={i} className={`logs-hz-item logs-hz-item--${node.status}`}>
                    <div className="logs-hz-dot" />
                    <span className="logs-hz-lbl">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Section ────────────────────────── */}
        <div className="logs-right">

          {/* Log Inspector */}
          <div className="logs-panel">
            <div className="logs-panel__hd logs-panel__hd--red">
              <h2 className="logs-panel__ttl">LOG INSPECTOR</h2>
              <MdClose style={{ cursor: 'pointer', color: '#DC2626' }} />
            </div>
            <div className="logs-insp-body">
              
              <div>
                <div className="logs-insp-lbl" style={{ marginBottom: '4px' }}>EVENT SUMMARY</div>
                <div className="logs-insp-ev-title">Tunnel Restart Count<br/>Reached 4</div>
              </div>

              <div className="logs-insp-grid">
                <div className="logs-insp-col">
                  <span className="logs-insp-lbl">EVENT ID</span>
                  <div className="logs-insp-val-box">MPLS-084</div>
                </div>
                <div className="logs-insp-col">
                  <span className="logs-insp-lbl">SEVERITY</span>
                  <div className="logs-insp-val-box logs-insp-val-box--crit">CRITICAL</div>
                </div>
              </div>

              <div>
                <div className="logs-insp-lbl" style={{ marginBottom: '4px' }}>NETWORK CONTEXT</div>
                <div className="logs-ctx">
                  <div className="logs-ctx-row"><span>Source IP:</span><span>10.10.0.1</span></div>
                  <div className="logs-ctx-row"><span>Dest IP:</span><span>10.10.0.4</span></div>
                  <div className="logs-ctx-row"><span>Interface:</span><span>Gi0/0/1</span></div>
                </div>
              </div>

              <div>
                <div className="logs-insp-lbl" style={{ marginBottom: '4px' }}>RAW LOG PAYLOAD</div>
                <div className="logs-raw">
                  &lt;132&gt; Jul 24 14:24:12 CORE-R2 %MPLS-3-TUNNEL_ERROR: MPLS Tunnel (Te0/0) state changed to DOWN. Restart attempt 4 of 5. Reason: Keepalive timeout, CorrelationID: x-9922-mpt
                </div>
              </div>

            </div>
          </div>

          {/* AryaCopilot Insights */}
          <div className="logs-panel">
            <div className="logs-panel__hd">
              <h2 className="logs-panel__ttl" style={{ color: 'var(--color-primary)' }}>⬡ ARYACOPILOT INSIGHTS</h2>
            </div>
            <div className="logs-insights-body">
              {INSIGHTS.map((text, i) => (
                <div key={i} className="logs-insight-item">
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Log Distribution */}
          <div className="logs-panel">
            <div className="logs-panel__hd">
              <h2 className="logs-panel__ttl">LOG DISTRIBUTION</h2>
            </div>
            <div className="logs-dist-body">
              <DistributionChart />
              <div className="logs-dist-legend">
                <div className="logs-dist-leg-item"><span className="logs-dist-dot" style={{ background: '#FF6B00' }} /> Syslog (45%)</div>
                <div className="logs-dist-leg-item"><span className="logs-dist-dot" style={{ background: '#F97316' }} /> SNMP (22%)</div>
                <div className="logs-dist-leg-item"><span className="logs-dist-dot" style={{ background: '#FB923C' }} /> NetFlow (18%)</div>
                <div className="logs-dist-leg-item"><span className="logs-dist-dot" style={{ background: '#FDBA74' }} /> OSPF (10%)</div>
                <div className="logs-dist-leg-item"><span className="logs-dist-dot" style={{ background: '#FED7AA' }} /> MPLS (5%)</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Actions ─────────────────────────── */}
      <div className="logs-actions">
        <button className="logs-action-btn">⬡ OPEN RCA</button>
        <button className="logs-action-btn">⬡ VIEW TOPOLOGY</button>
        <button className="logs-action-btn">⬡ SIMILAR INCIDENTS</button>
        <button className="logs-action-btn">⬡ RAW LOGS</button>
      </div>

    </div>
  );
}

import { useState } from 'react';
import KPICard from '../../components/KPICard/index.jsx';
import './IncidentHistory.css';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const INCIDENTS = [
  { id: 'INC-2024-844', device: 'CORE-R2',   cause: 'OSPF Route Flapping',   sev: 'Critical', sim: '96%' },
  { id: 'INC-2024-031', device: 'EDGE-R1',   cause: 'Queue Overflow',        sev: 'Warning',  sim: '91%' },
  { id: 'INC-2024-018', device: 'DIST-SW1',  cause: 'STP Convergence Error', sev: 'Critical', sim: '89%' },
];

const TIMELINE = [
  { time: '14:10', msg: 'CPU Spike Detected',        status: 'default' },
  { time: '14:20', msg: 'Packet Loss Warning',       status: 'warn' },
  { time: '14:24', msg: 'Queue Overflow Critical',   status: 'crit' },
  { time: '14:32', msg: 'Failure Predicted',         status: 'prim' },
  { time: '14:35', msg: 'Mitigation Applied',        status: 'default' },
  { time: '14:38', msg: 'Recovered',                 status: 'ok' },
];

/* ══════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════ */
function getSevDot(sev) {
  if (sev === 'Critical') return 'ih-sev-dot--crit';
  if (sev === 'Warning')  return 'ih-sev-dot--warn';
  return 'ih-sev-dot--ok';
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function IncidentHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [rangeFilter, setRangeFilter] = useState('Past 24h');

  return (
    <div className="ih-page">
      
      {/* ── Page Header ────────────────────────────── */}
      <div className="ih-page-hd">
        <div>
          <h1 className="ih-page-hd__title">INCIDENT HISTORY</h1>
          <p className="ih-page-hd__sub">Historical Incident Analysis and Similarity Search</p>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────── */}
      <div className="ih-kpi-row">
        <KPICard
          label="Total Incidents"
          value="124"
          variant="change"
          changeValue=""
          changeType="positive"
        />
        <KPICard
          label="Critical Incidents"
          value="18"
          variant="badge"
          badgeText=""
          badgeType="danger"
        />
        <KPICard
          label="Avg Resolution Time"
          value="14 min"
          variant="change"
          changeValue=""
          changeType="positive"
        />
        <KPICard
          label="Similarity Match"
          value="96%"
          variant="progress"
          progressValue={96}
          progressColor="#FF6B00"
        />
      </div>

      {/* ── Search & Filter Bar ────────────────────── */}
      <div className="ih-filter-bar">
        <input
          type="text"
          className="ih-search-input"
          placeholder="Search by Router ID, Incident ID, Root Cause..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ih-filter-group">
          <span className="ih-filter-lbl">STATUS:</span>
          <select 
            className="ih-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Resolved</option>
          </select>
        </div>
        <div className="ih-filter-group">
          <span className="ih-filter-lbl">RANGE:</span>
          <select 
            className="ih-select"
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
          >
            <option>Past 24h</option>
            <option>Past 7d</option>
            <option>Past 30d</option>
          </select>
        </div>
      </div>

      {/* ── Main Layout ────────────────────────────── */}
      <div className="ih-main">
        
        {/* Left Section */}
        <div className="ih-left">
          
          {/* Historical Records Table */}
          <div className="ih-panel">
            <div className="ih-panel__hd">
              <h2 className="ih-panel__ttl">HISTORICAL RECORDS</h2>
            </div>
            <div className="ih-table-body">
              <table className="ih-table">
                <thead>
                  <tr>
                    <th>INCIDENT ID</th>
                    <th>DEVICE</th>
                    <th>ROOT CAUSE</th>
                    <th>SEVERITY</th>
                    <th>SIMILARITY</th>
                  </tr>
                </thead>
                <tbody>
                  {INCIDENTS.map((inc) => (
                    <tr key={inc.id}>
                      <td className="ih-id">{inc.id}</td>
                      <td>{inc.device}</td>
                      <td>{inc.cause}</td>
                      <td>
                        <span className={`ih-sev-dot ${getSevDot(inc.sev)}`} />
                        {inc.sev}
                      </td>
                      <td className="ih-sim">{inc.sim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AryaCopilot Memory Panel */}
          <div className="ih-panel ih-memory-panel">
            <div className="ih-panel__hd ih-panel__hd--primary">
              <h2 className="ih-panel__ttl">ARYACOPILOT MEMORY</h2>
            </div>
            <div className="ih-memory-body">
              <div className="ih-memory-icon">⬡</div>
              <div className="ih-memory-txt">
                Yes. Incident <span className="ih-highlight">INC-2024-844</span> has a 96% similarity score with the current OSPF instability. Historical data indicates this is likely triggered by a firmware bug in the MPLS module. Mitigation involved restarting the MPLS tunnel and applying a micro-code patch. Resolved in 12 minutes during last occurrence.
              </div>
            </div>
          </div>

        </div>

        {/* Right Section */}
        <div className="ih-right">
          
          {/* Incident Details Card */}
          <div className="ih-panel">
            <div className="ih-panel__hd">
              <h2 className="ih-panel__ttl">INCIDENT DETAILS</h2>
            </div>
            <div className="ih-details-body">
              <div className="ih-detail-row">
                <span className="ih-detail-lbl">Router</span>
                <span className="ih-detail-val">CORE-R2</span>
              </div>
              <div className="ih-detail-row">
                <span className="ih-detail-lbl">Timestamp</span>
                <span className="ih-detail-val">2024-10-24 14:22 UTC</span>
              </div>
              <div className="ih-detail-row">
                <span className="ih-detail-lbl">Confidence</span>
                <span className="ih-detail-val ih-detail-val--prim">91%</span>
              </div>
              <div className="ih-detail-row">
                <span className="ih-detail-lbl">Affected Devices</span>
                <span className="ih-detail-val">4 Nodes</span>
              </div>
              <div className="ih-detail-row">
                <span className="ih-detail-lbl">Resolution</span>
                <span className="ih-detail-val ih-detail-val--green">12 min</span>
              </div>
            </div>
          </div>

          {/* Similar Incidents Card */}
          <div className="ih-panel">
            <div className="ih-panel__hd">
              <h2 className="ih-panel__ttl">SIMILAR INCIDENTS</h2>
            </div>
            <div className="ih-sim-body">
              {['INC-844', 'INC-031', 'INC-018'].map((id, i) => (
                <div className="ih-sim-item" key={id}>
                  <div className="ih-sim-info">
                    <span className="ih-sim-id">{id}</span>
                    <span className="ih-sim-status">SUCCESSFUL RECOVERY</span>
                  </div>
                  <span className="ih-sim-pct">{[96, 91, 89][i]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline View Card */}
          <div className="ih-panel">
            <div className="ih-panel__hd">
              <h2 className="ih-panel__ttl">TIMELINE VIEW</h2>
            </div>
            <div className="ih-tl-body">
              <div className="ih-timeline">
                {TIMELINE.map((item, i) => (
                  <div className={`ih-tl-item ih-tl-item--${item.status}`} key={i}>
                    <div className="ih-tl-dot" />
                    <div className="ih-tl-time">{item.time}</div>
                    <div className="ih-tl-msg">{item.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

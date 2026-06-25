import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MdDownload, MdTableChart, MdArticle, MdDescription, MdSpeed } from 'react-icons/md';
import KPICard from '../../components/KPICard/index.jsx';
import './Reports.css';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const FAILURE_DATA = [
  { day: 'Day 01', predicted: 8,  actual: 6,  prevented: 5  },
  { day: 'Day 08', predicted: 12, actual: 9,  prevented: 8  },
  { day: 'Day 15', predicted: 7,  actual: 5,  prevented: 6  },
  { day: 'Day 22', predicted: 15, actual: 11, prevented: 12 },
  { day: 'Day 30', predicted: 10, actual: 7,  prevented: 9  },
];

const MIT_ITEMS = [
  { label: 'Restart MPLS Tunnel',       pct: 91 },
  { label: 'Increase Queue Buffer',     pct: 84 },
  { label: 'Reduce Polling Frequency',  pct: 78 },
  { label: 'Reroute Telemetry Traffic', pct: 73 },
];

const HEALTH_ROWS = [
  { lbl: 'Network Availability', val: '99.84%', cls: 'rpt-health-val--prim'  },
  { lbl: 'Critical Alerts',      val: '04',     cls: 'rpt-health-val--crit'  },
  { lbl: 'Average Latency',      val: '14 ms',  cls: 'rpt-health-val--green' },
  { lbl: 'Packet Loss',          val: '0.7%',   cls: 'rpt-health-val--prim'  },
  { lbl: 'Queue Utilization',    val: '82%',    cls: 'rpt-health-val'        },
  { lbl: 'Prediction Confidence',val: '91%',    cls: 'rpt-health-val--green' },
];

const RECENT_REPORTS = [
  { file: 'DHS-2024-05-12.pdf',  type: 'Health Summary',     date: '12-MAY-2024 06:00', size: '4.2 MB', status: 'Ready'      },
  { file: 'VIA-2024-118.csv',    type: 'Incident Analysis',  date: '11-MAY-2024 23:45', size: '1.8 MB', status: 'Ready'      },
  { file: 'RCA-24-2024.pdf',     type: 'Executive Summary',  date: '09-MAY-2024 10:00', size: '3.1 MB', status: 'Ready'      },
];

const EXPORT_BUTTONS = [
  { icon: '📄', label: 'EXPORT PDF',              primary: false },
  { icon: '📊', label: 'EXPORT CSV',              primary: false },
  { icon: '{ }',label: 'EXPORT JSON',             primary: false },
  { icon: '⚠️', label: 'INCIDENT REPORT',        primary: false },
  { icon: '📡', label: 'TELEMETRY SUMM.',         primary: false },
  { icon: '⬡',  label: 'GEN EXEC REPORT',        primary: true  },
];

/* ══════════════════════════════════════════════════════
   Custom Chart Tooltip
══════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-chart-tip">
      <div className="rpt-chart-tip__lbl">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="rpt-chart-tip__row" style={{ color: p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function Reports() {
  const [reportType, setReportType] = useState('Daily Health Summary');
  const [dateRange,  setDateRange]  = useState('Past 24 Hours');

  return (
    <div className="rpt-page">

      {/* ── Page Header ────────────────────────────── */}
      <div className="rpt-page-hd">
        <div>
          <h1 className="rpt-page-hd__title">REPORTS</h1>
          <p  className="rpt-page-hd__sub">Analytics, Reporting and Operational Insights</p>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────── */}
      <div className="rpt-kpi-row">
        <KPICard
          label="Reports Generated"
          value="284"
          variant="change"
          changeValue="+12.4%"
          changeType="positive"
        />
        <KPICard
          label="Predicted Incidents"
          value="42"
          variant="badge"
          badgeText="AI PREDICTED"
          badgeType="warning"
        />
        <KPICard
          label="Average Availability"
          value="99.84%"
          variant="progress"
          progressValue={99.84}
          progressColor="#22C55E"
          subLabel="TARGET: 99.9%"
          subLabelColor="#9CA3AF"
        />
        <KPICard
          label="Mitigation Success"
          value="91%"
          variant="gauge"
          gaugeValue={91}
          subLabel="ACTIVE"
          subLabelColor="#22C55E"
        />
      </div>

      {/* ── Body Grid: 3 columns ───────────────────── */}
      <div className="rpt-body-grid">

        {/* ── LEFT COLUMN ─────────────────────────── */}
        <div className="rpt-left">

          {/* Generate Report */}
          <div className="rpt-panel">
            <div className="rpt-panel__hd">
              <h2 className="rpt-panel__ttl">📄 GENERATE REPORT</h2>
            </div>
            <div className="rpt-gen-body">
              <div className="rpt-form-group">
                <label className="rpt-form-lbl" htmlFor="rpt-type">Report Type</label>
                <select
                  id="rpt-type"
                  className="rpt-select"
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                >
                  <option>Daily Health Summary</option>
                  <option>Weekly Operations Report</option>
                  <option>Incident Analysis</option>
                  <option>RCA Summary</option>
                </select>
              </div>
              <div className="rpt-form-group">
                <label className="rpt-form-lbl" htmlFor="rpt-range">Date Range</label>
                <select
                  id="rpt-range"
                  className="rpt-select"
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                >
                  <option>Past 24 Hours</option>
                  <option>Past 7 Days</option>
                  <option>Past 30 Days</option>
                </select>
              </div>
              <button id="btn-generate-report" className="rpt-gen-btn">
                GENERATE REPORT
              </button>
            </div>
          </div>

          {/* System Health Summary */}
          <div className="rpt-panel">
            <div className="rpt-panel__hd">
              <h2 className="rpt-panel__ttl">SYSTEM HEALTH SUMMARY</h2>
            </div>
            <div className="rpt-health-body">
              {HEALTH_ROWS.map(r => (
                <div key={r.lbl} className="rpt-health-row">
                  <span className="rpt-health-lbl">{r.lbl}</span>
                  <span className={`rpt-health-val ${r.cls}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mitigation Effectiveness */}
          <div className="rpt-panel">
            <div className="rpt-panel__hd">
              <h2 className="rpt-panel__ttl">MITIGATION EFFECTIVENESS</h2>
            </div>
            <div className="rpt-mit-body">
              {MIT_ITEMS.map(m => (
                <div key={m.label} className="rpt-mit-row">
                  <div className="rpt-mit-top">
                    <span className="rpt-mit-lbl">{m.label}</span>
                    <span className="rpt-mit-pct">{m.pct}%</span>
                  </div>
                  <div className="rpt-mit-track">
                    <div className="rpt-mit-fill" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── CENTER COLUMN ────────────────────────── */}
        <div className="rpt-center">

          {/* Executive Summary */}
          <div className="rpt-panel">
            <div className="rpt-panel__hd">
              <h2 className="rpt-panel__ttl">📊 EXECUTIVE SUMMARY</h2>
            </div>
            <div className="rpt-exec-body">
              <p className="rpt-exec-text">
                AryaCopilot identified <span className="rpt-hi-orange">42 potential failures</span> across the
                regional mesh during this operational period. Through autonomous intervention,{' '}
                <span className="rpt-hi-green">36 incidents were mitigated</span> before reaching critical
                thresholds. Overall network availability remained stable at{' '}
                <span className="rpt-hi-orange">99.84%</span>. Proactive optimisation reduced telemetry
                overhead by <span className="rpt-hi-orange">18%</span> without loss of granularity.
              </p>
              <div className="rpt-exec-badges">
                <span className="rpt-badge rpt-badge--green">● Real-time Monitoring Active</span>
                <span className="rpt-badge rpt-badge--blue">✓ Data Integrity Verified</span>
              </div>
            </div>
          </div>

          {/* Failure Analytics Chart */}
          <div className="rpt-panel">
            <div className="rpt-panel__hd">
              <h2 className="rpt-panel__ttl">FAILURE ANALYTICS (30 DAY TREND)</h2>
              <div className="rpt-chart-legend">
                <span className="rpt-leg-item"><span className="rpt-leg-dot" style={{ background: '#FF6B00' }} />Predicted</span>
                <span className="rpt-leg-item"><span className="rpt-leg-dot" style={{ background: '#EF4444' }} />Actual</span>
                <span className="rpt-leg-item"><span className="rpt-leg-dot" style={{ background: '#22C55E' }} />Prevented</span>
              </div>
            </div>
            <div className="rpt-chart-body">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={FAILURE_DATA}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  barCategoryGap="30%"
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="predicted" name="Predicted" fill="#FF6B00" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual"    name="Actual"    fill="#EF4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="prevented" name="Prevented" fill="#22C55E" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ─────────────────────────── */}
        <div className="rpt-right">

          {/* Export Center */}
          <div className="rpt-panel">
            <div className="rpt-panel__hd">
              <h2 className="rpt-panel__ttl">↑ EXPORT CENTER</h2>
            </div>
            <div className="rpt-export-body">
              {EXPORT_BUTTONS.map((btn, i) => (
                <button
                  key={i}
                  id={`btn-export-${i}`}
                  className={`rpt-export-btn${btn.primary ? ' rpt-export-btn--primary' : ''}`}
                >
                  <span className="rpt-export-btn__icon">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── Recent Reports Table (full width) ──────── */}
      <div className="rpt-panel">
        <div className="rpt-panel__hd">
          <h2 className="rpt-panel__ttl">RECENT REPORTS</h2>
          <span className="rpt-table-hd-link">VIEW ALL ARCHIVES</span>
        </div>
        <div className="rpt-table-wrapper">
          <table className="rpt-table">
            <thead>
              <tr>
                <th>FILE NAME</th>
                <th>TYPE</th>
                <th>DATE GENERATED</th>
                <th>SIZE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_REPORTS.map((r, i) => (
                <tr key={i}>
                  <td className="rpt-table-filename">{r.file}</td>
                  <td className="rpt-table-type">{r.type}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>{r.date}</td>
                  <td className="rpt-table-size">{r.size}</td>
                  <td>
                    <span className={`rpt-status-badge rpt-status-badge--${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button className="rpt-dl-btn" aria-label={`Download ${r.file}`} title="Download">
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

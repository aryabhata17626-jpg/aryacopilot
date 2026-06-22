import { NavLink } from 'react-router-dom';
import {
  MdDashboard,
  MdAccountTree,
  MdTrendingDown,
  MdBugReport,
  MdMenuBook,
  MdHistory,
  MdSensors,
  MdArticle,
  MdNotificationsActive,
  MdAssessment,
} from 'react-icons/md';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard',          path: '/dashboard',     icon: <MdDashboard /> },
  { label: 'Network Topology',   path: '/topology',      icon: <MdAccountTree /> },
  { label: 'Failure Prediction', path: '/prediction',    icon: <MdTrendingDown /> },
  { label: 'Root Cause Analysis',path: '/rca',           icon: <MdBugReport /> },
  { label: 'Knowledge Base',     path: '/knowledge-base',icon: <MdMenuBook /> },
  { label: 'Incident History',   path: '/incidents',     icon: <MdHistory /> },
  { label: 'Telemetry Explorer', path: '/telemetry',     icon: <MdSensors /> },
  { label: 'Logs',               path: '/logs',          icon: <MdArticle /> },
  { label: 'Alerts',             path: '/alerts',        icon: <MdNotificationsActive /> },
  { label: 'Reports',            path: '/reports',       icon: <MdAssessment /> },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">⬡</span>
        <span className="sidebar__brand-name">AryaCopilot</span>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {navItems.map(({ label, path, icon }) => (
            <li key={path} className="sidebar__item">
              <NavLink
                to={path}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
              >
                <span className="sidebar__icon">{icon}</span>
                <span className="sidebar__label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__version">v1.0.0</span>
      </div>
    </aside>
  );
}

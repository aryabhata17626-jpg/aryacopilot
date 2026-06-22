import { useLocation } from 'react-router-dom';
import { MdSearch, MdNotifications, MdAccountCircle } from 'react-icons/md';
import './Topbar.css';

const routeTitles = {
  '/dashboard':     'Dashboard',
  '/topology':      'Network Topology',
  '/prediction':    'Failure Prediction',
  '/rca':           'Root Cause Analysis',
  '/knowledge-base':'Knowledge Base',
  '/incidents':     'Incident History',
  '/telemetry':     'Telemetry Explorer',
  '/logs':          'Logs',
  '/alerts':        'Alerts',
  '/reports':       'Reports',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = routeTitles[pathname] ?? 'AryaCopilot';

  return (
    <header className="topbar">
      <div className="topbar__title">
        <h2>{title}</h2>
      </div>

      <div className="topbar__actions">
        {/* Search */}
        <div className="topbar__search">
          <MdSearch className="topbar__search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="topbar__search-input"
          />
        </div>

        {/* Notifications */}
        <button className="topbar__icon-btn" aria-label="Notifications">
          <MdNotifications />
          <span className="topbar__badge">3</span>
        </button>

        {/* Profile */}
        <button className="topbar__icon-btn topbar__profile-btn" aria-label="Profile">
          <MdAccountCircle />
        </button>
      </div>
    </header>
  );
}

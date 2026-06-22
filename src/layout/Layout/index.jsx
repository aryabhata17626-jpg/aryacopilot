import { Outlet } from 'react-router-dom';
import Sidebar              from '../../components/Sidebar/index.jsx';
import Topbar               from '../../components/Topbar/index.jsx';
import FloatingAIAssistant  from '../../components/FloatingAIAssistant/FloatingAIAssistant.jsx';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__body">
        <Topbar />
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}

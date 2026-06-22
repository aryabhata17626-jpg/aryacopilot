import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout            from './layout/Layout/index.jsx';

import Dashboard         from './pages/Dashboard/index.jsx';
import NetworkTopology   from './pages/NetworkTopology/index.jsx';
import FailurePrediction from './pages/FailurePrediction/index.jsx';
import RootCauseAnalysis from './pages/RCA/index.jsx';
import KnowledgeBase     from './pages/KnowledgeBase/index.jsx';
import IncidentHistory   from './pages/IncidentHistory/index.jsx';
import TelemetryExplorer from './pages/Telemetry/index.jsx';
import Logs              from './pages/Logs/index.jsx';
import Alerts            from './pages/Alerts/index.jsx';
import Reports           from './pages/Reports/index.jsx';
import AIAssistant       from './pages/AIAssistant/index.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* All pages render inside the shared Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/topology"      element={<NetworkTopology />} />
          <Route path="/prediction"    element={<FailurePrediction />} />
          <Route path="/rca"           element={<RootCauseAnalysis />} />
          <Route path="/knowledge-base"element={<KnowledgeBase />} />
          <Route path="/incidents"     element={<IncidentHistory />} />
          <Route path="/telemetry"     element={<TelemetryExplorer />} />
          <Route path="/logs"          element={<Logs />} />
          <Route path="/alerts"        element={<Alerts />} />
          <Route path="/reports"       element={<Reports />} />
          <Route path="/ai-assistant"  element={<AIAssistant />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

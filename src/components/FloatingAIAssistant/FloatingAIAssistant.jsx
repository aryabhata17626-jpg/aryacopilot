import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FloatingAIAssistant.css';

export default function FloatingAIAssistant() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [visible, setVisible] = useState(false);

  /* Fade in after mount */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  /* Hide the button when already on /ai-assistant */
  if (location.pathname === '/ai-assistant') return null;

  return (
    <div
      className={`fab${visible ? ' fab--visible' : ''}`}
      title="AryaCopilot Assistant"
      role="button"
      tabIndex={0}
      aria-label="Open AryaCopilot AI Assistant"
      id="btn-floating-ai"
      onClick={() => navigate('/ai-assistant')}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate('/ai-assistant')}
    >
      {/* Pulse rings */}
      <span className="fab__ring fab__ring--1" aria-hidden />
      <span className="fab__ring fab__ring--2" aria-hidden />

      {/* Icon */}
      <svg
        className="fab__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Hexagon body */}
        <path
          d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
          stroke="white" strokeWidth="1.5"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.15)"
        />
        {/* AI circuit dots */}
        <circle cx="12" cy="12" r="2.2" fill="white" />
        <circle cx="8"  cy="10" r="1"   fill="rgba(255,255,255,0.8)" />
        <circle cx="16" cy="10" r="1"   fill="rgba(255,255,255,0.8)" />
        <circle cx="8"  cy="14" r="1"   fill="rgba(255,255,255,0.8)" />
        <circle cx="16" cy="14" r="1"   fill="rgba(255,255,255,0.8)" />
        {/* Connection lines */}
        <line x1="9"  y1="10.5" x2="10.8" y2="11.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <line x1="15" y1="10.5" x2="13.2" y2="11.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <line x1="9"  y1="13.5" x2="10.8" y2="12.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <line x1="15" y1="13.5" x2="13.2" y2="12.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
      </svg>

      {/* Tooltip */}
      <span className="fab__tooltip" aria-hidden>AryaCopilot Assistant</span>
    </div>
  );
}

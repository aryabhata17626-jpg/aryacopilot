import { useState, useRef, useEffect, useCallback } from 'react';
import './AIAssistant.css';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const INITIAL_MSGS = [
  {
    id: 1, role: 'ai', time: '09:41', type: 'greeting',
    text: 'Hello Operator. How can I assist you today?',
  },
  {
    id: 2, role: 'user', time: '09:41', type: 'plain',
    text: 'Why is CORE-R2 failing?',
  },
  {
    id: 3, role: 'ai', time: '09:42', type: 'signals',
    text: 'CORE-R2 is predicted to fail within approximately 18 minutes.',
    signals: [
      { label: 'CPU Utilization', val: '95%',  col: '#EF4444' },
      { label: 'Queue Depth Threshold', val: '', col: '#F59E0B' },
      { label: 'Packet Loss Increased', val: '', col: '#F59E0B' },
      { label: 'OSPF Instability',      val: '', col: '#EF4444' },
    ],
    footer: 'Model Confidence: 91%  |  Based on real-time telemetry',
  },
  {
    id: 4, role: 'user', time: '09:42', type: 'plain',
    text: 'Suggest Mitigation',
  },
  {
    id: 5, role: 'ai', time: '09:43', type: 'mitigation',
    text: 'Recommended mitigation steps:',
    actions: [
      'Restart MPLS Tunnel',
      'Increase Queue Buffer (125%: queue-limit 8000)',
      'Reduce Telemetry Polling (Interval: 1s → 10s)',
      'Delay Backup Traffic (Class-Map: BACKUP_SVC)',
    ],
    risk: { from: 61, to: 43 },
  },
];

const QUICK_ACTIONS = [
  { id: 'why',     label: 'Why is CORE-R2 Failing?' },
  { id: 'predict', label: 'Predict Next Failure'    },
  { id: 'rca',     label: 'Generate RCA'            },
  { id: 'similar', label: 'View Similar Incident'   },
  { id: 'logs',    label: 'Show MPLS Logs'          },
  { id: 'ospf',    label: 'Inspect OSPF Topology'   },
];

const AI_REPLIES = {
  why:    'CORE-R2 failure is due to CPU exhaustion (95%) cascading into queue overflow. This triggered OSPF neighbor drops and MPLS tunnel instability. Primary origin: resource exhaustion propagating from CORE-R3 downstream.',
  predict:'Next predicted failure: EDGE-R1 in ~34 minutes (confidence: 78%). Primary indicators: OSPF hello timer violations and interface flap rate above threshold.',
  rca:    'Root Cause: CPU spike on CORE-R3 → packet drops → OSPF session loss → MPLS tunnel restart cascade → router failure. Navigate to the RCA page for the full causal graph with evidence metrics.',
  similar:'Found 2 similar incidents: INC-2024-044 (96% match) — resolved via Firmware Update. INC-2024-031 (71% match) — resolved by re-balancing OSPF weights and BGP route dampening.',
  logs:   'Retrieving MPLS logs for CORE-R2... Found 1,248 entries in last 30 minutes. Critical: 14 tunnel-down events, 38 LDP session resets, 6 OSPF adjacency drops. Recommend reviewing entries 09:41–09:43.',
  ospf:   'OSPF topology analysis: CORE-R2 has lost adjacency with CORE-R3 and FW-01. Re-convergence is in progress. Dead interval exceeded on interface TenGigabitEthernet0/0/0/1. MTU mismatch detected.',
};

const RETRIEVAL_TYPES = [
  { label: 'Runbooks',         count: 4,  icon: '📄' },
  { label: 'Playbooks',        count: 2,  icon: '📋' },
  { label: 'Configs',          count: 3,  icon: '⚙️' },
  { label: 'Topology Maps',    count: 1,  icon: '🗺️' },
  { label: 'Incident Reports', count: 2,  icon: '⚠️' },
];

const CAPABILITIES = [
  { label: 'Diagnosis',           icon: '🔍' },
  { label: 'Prediction',          icon: '📊' },
  { label: 'Mitigation',          icon: '🛡️' },
  { label: 'Knowledge Retrieval', icon: '📚' },
];

const LIVE_METRICS = [
  { label: 'CPU',            value: '95%',      pct: 95,  sev: 'crit' },
  { label: 'Queue Depth',    value: '81',       pct: 81,  sev: 'warn' },
  { label: 'Packet Loss',    value: '7%',       pct: 35,  sev: 'warn' },
  { label: 'OSPF Stability', value: 'Critical', pct: 100, sev: 'crit' },
];

const RECOMMENDATIONS = [
  'Restart MPLS Tunnel',
  'Increase Queue Buffer',
  'Reduce Polling',
  'Move Telemetry',
];

const RETRIEVED_CONTEXT = [
  {
    id: 1, file: 'MPLS_Troubleshooting.pdf', sim: 96,
    snippet: '...In event of tunnel flapping on Cisco IOS-XR platforms, check queue depth and re-process interfaces. Exceeding 80% threshold usually indicates a pending process overload. Use "show mpls traffic-eng tunnels" to verify...',
  },
  {
    id: 2, file: 'OSPF_Playbook.docx', sim: 91,
    snippet: '...Previous resolution for similar corridor instability involved adjusting OSPF hello timers to 1s and Dead timers to 4s to prevent premature neighbor drop. Confirm area-ID matching on all interfaces...',
  },
  {
    id: 3, file: 'CORE_R2.conf', sim: 88,
    snippet: '...Router configuration: mpls traffic-eng tunnels. interface TenGigabitEthernet0/0/0/1 — ip address 10.0.1.1 255.255.255.252, tunnel-te 101 path-option 1 dynamic...',
  },
];

/* ══════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════ */
function getTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function simColor(sim) {
  return sim >= 95 ? '#22C55E' : sim >= 88 ? '#F59E0B' : '#6B7280';
}

let _id = 50;

/* ══════════════════════════════════════════════════════
   TypingIndicator
══════════════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <div className="aia-msg aia-msg--ai" aria-live="polite" aria-label="AryaCopilot is typing">
      <span className="aia-msg__avatar" aria-hidden>⬡</span>
      <div className="aia-msg__bubble aia-msg__bubble--typing">
        <div className="aia-typing">
          <span className="aia-typing__dot" />
          <span className="aia-typing__dot" />
          <span className="aia-typing__dot" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ChatMessage
══════════════════════════════════════════════════════ */
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`aia-msg aia-msg--${msg.role}${msg.isNew ? ' aia-msg--new' : ''}`}>
      {!isUser && (
        <span className="aia-msg__avatar" aria-hidden>⬡</span>
      )}
      <div className={`aia-msg__bubble aia-msg__bubble--${msg.role}`}>

        {/* Meta bar */}
        <div className={`aia-msg__meta aia-msg__meta--${msg.role}`}>
          <span className="aia-msg__sender">
            {isUser ? 'OPERATOR' : 'ARYACOPILOT'}
          </span>
          <span className="aia-msg__time">{msg.time}</span>
        </div>

        {/* Main text */}
        <div className="aia-msg__text">{msg.text}</div>

        {/* Signals grid */}
        {msg.type === 'signals' && msg.signals?.length > 0 && (
          <div className="aia-signals">
            {msg.signals.map((s, i) => (
              <div key={i} className="aia-signal">
                <span className="aia-signal__dot" style={{ background: s.col }} aria-hidden />
                <span className="aia-signal__lbl">{s.label}</span>
                {s.val && <span className="aia-signal__val">{s.val}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Mitigation actions */}
        {msg.type === 'mitigation' && msg.actions?.length > 0 && (
          <div className="aia-mit">
            {msg.actions.map((a, i) => (
              <div key={i} className="aia-mit__item">
                <span className="aia-mit__chr">{String.fromCharCode(65 + i)}.</span>
                <span>{a}</span>
              </div>
            ))}
          </div>
        )}

        {/* Risk reduction */}
        {msg.risk && (
          <div className="aia-risk">
            <span className="aia-risk__ttl">EXPECTED RISK REDUCTION</span>
            <div className="aia-risk__row">
              <span className="aia-risk__from">{msg.risk.from}%</span>
              <div className="aia-risk__track">
                <div
                  className="aia-risk__fill"
                  style={{ width: `${(1 - msg.risk.to / msg.risk.from) * 100}%` }}
                />
              </div>
              <span className="aia-risk__arrow">→</span>
              <span className="aia-risk__to">{msg.risk.to}%</span>
            </div>
          </div>
        )}

        {/* Footer */}
        {msg.footer && (
          <div className="aia-msg__footer">{msg.footer}</div>
        )}
      </div>
      {isUser && (
        <span className="aia-msg__avatar aia-msg__avatar--user" aria-hidden>👤</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ConfidenceMeter
══════════════════════════════════════════════════════ */
function ConfidenceMeter({ value = 93 }) {
  const R    = 36;
  const circ = 2 * Math.PI * R;
  const off  = circ * (1 - value / 100);
  return (
    <section className="aia-panel" aria-label="Confidence Meter">
      <header className="aia-panel__hd">
        <h3 className="aia-panel__ttl">CONFIDENCE METER</h3>
      </header>
      <div className="aia-conf__body">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-label={`Confidence: ${value}%`}>
          <circle cx="46" cy="46" r={R} fill="none" stroke="#F3F4F6" strokeWidth="7" />
          <circle
            cx="46" cy="46" r={R} fill="none"
            stroke="#FF6B00" strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={off}
            strokeLinecap="round" transform="rotate(-90 46 46)"
            className="aia-conf__arc"
          />
          <text x="46" y="52" textAnchor="middle" fontSize="17" fontWeight="800" fill="#111827">
            {value}%
          </text>
        </svg>
        <p className="aia-conf__sub">Model Confidence</p>
        <div className="aia-conf__detail">
          <span>Threshold: 85%</span>
          <span className="aia-conf__ok">✓ ABOVE</span>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function AIAssistant() {
  const [messages,    setMessages]    = useState(INITIAL_MSGS);
  const [input,       setInput]       = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [selectedSrc, setSelectedSrc] = useState(RETRIEVED_CONTEXT[0]);
  const [ctxOpen,     setCtxOpen]     = useState(true);

  const msgEndRef = useRef(null);

  /* Auto-scroll on new message */
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback((text, quickId) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = {
      id: ++_id, role: 'user', time: getTime(), type: 'plain',
      text: trimmed, isNew: true,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const delay = 900 + Math.random() * 700;
    setTimeout(() => {
      setIsTyping(false);
      const replyText = quickId && AI_REPLIES[quickId]
        ? AI_REPLIES[quickId]
        : `Analysis complete for: "${trimmed.slice(0, 48)}${trimmed.length > 48 ? '…' : ''}". I have cross-referenced the Knowledge Base (248 docs) and retrieved 3 relevant chunks with similarity ≥88%. Review MPLS_Troubleshooting section 4.2 and OSPF_Playbook section 6 for resolution steps.`;
      setMessages(prev => [...prev, {
        id: ++_id, role: 'ai', time: getTime(), type: 'plain',
        text: replyText, isNew: true,
      }]);
    }, delay);
  }, []);

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="aia-page">

      {/* ── Page Header ── */}
      <div className="aia-page-hd">
        <div>
          <h1 className="aia-page-hd__title">AI ASSISTANT</h1>
          <p className="aia-page-hd__sub">Offline RAG-Based Network Operations Copilot</p>
        </div>
        <div className="aia-chips">
          <span className="aia-chip aia-chip--offline">● OFFLINE</span>
          <span className="aia-chip aia-chip--ai">AI ASSISTANT</span>
          <span className="aia-chip">+ LOGS</span>
          <span className="aia-chip aia-chip--active">● ACTIVE</span>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="aia-statusbar">
        {[
          { lbl:'CURRENT SESSION',     val:'CORE-R2',   mod:'',       valMod:''       },
          { lbl:'RISK LEVEL',          val:'HIGH',       mod:'crit',   valMod:'danger' },
          { lbl:'RETRIEVED DOCUMENTS', val:'248 Docs',  mod:'',       valMod:''       },
          { lbl:'RESPONSE TIME',       val:'0.6 sec',   mod:'',       valMod:''       },
          { lbl:'CONFIDENCE',          val:'93%',       mod:'',       valMod:'prim'   },
        ].map(s => (
          <div key={s.lbl} className={`aia-stat${s.mod ? ` aia-stat--${s.mod}` : ''}`}>
            <span className="aia-stat__lbl">{s.lbl}</span>
            <span className={`aia-stat__val${s.valMod ? ` aia-stat__val--${s.valMod}` : ''}`}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* ── 3-Column Grid ── */}
      <div className="aia-grid">

        {/* ═══ LEFT PANEL ═══ */}
        <aside className="aia-left" aria-label="Left panel">

          {/* Mission Control Label */}
          <div className="aia-mc">
            <span className="aia-mc__primary">ARYA MISSION-CONTROL</span>
            <span className="aia-mc__sub">AIR-GAPPED MODEL · V1</span>
          </div>

          {/* Session Snapshot */}
          <section className="aia-panel" aria-label="Session Snapshot">
            <header className="aia-panel__hd">
              <h2 className="aia-panel__ttl">SESSION SNAPSHOT</h2>
            </header>
            <div className="aia-session">
              {[
                { lbl:'Selected Device', val:'CORE-R2',   kind:'plain' },
                { lbl:'Status',          val:'Critical',  kind:'crit'  },
                { lbl:'Risk',            val:'High',      kind:'high'  },
                { lbl:'Predicted Failure',val:'18 min',   kind:'warn'  },
              ].map(r => (
                <div key={r.lbl} className="aia-session__row">
                  <span className="aia-session__lbl">{r.lbl}</span>
                  {r.kind === 'plain' || r.kind === 'warn' ? (
                    <span className={`aia-session__val${r.kind === 'warn' ? ' aia-session__val--warn' : ''}`}>{r.val}</span>
                  ) : (
                    <span className={`aia-badge aia-badge--${r.kind}`}>{r.val}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Retrieval Sources */}
          <section className="aia-panel" aria-label="Retrieval Sources">
            <header className="aia-panel__hd">
              <h2 className="aia-panel__ttl">RETRIEVAL SOURCES</h2>
            </header>
            <div className="aia-ret-list">
              {RETRIEVAL_TYPES.map(t => (
                <div key={t.label} className="aia-ret__row">
                  <span className="aia-ret__icon" aria-hidden>{t.icon}</span>
                  <span className="aia-ret__label">{t.label}</span>
                  <span className="aia-ret__count">{t.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* System Capabilities */}
          <section className="aia-panel" aria-label="System Capabilities">
            <header className="aia-panel__hd">
              <h2 className="aia-panel__ttl">SYSTEM CAPABILITIES</h2>
            </header>
            <div className="aia-caps">
              {CAPABILITIES.map(c => (
                <div key={c.label} className="aia-cap" title={c.label}>
                  <span className="aia-cap__icon" aria-hidden>{c.icon}</span>
                  <span className="aia-cap__label">{c.label}</span>
                </div>
              ))}
            </div>
          </section>

        </aside>

        {/* ═══ CENTER CHAT ═══ */}
        <div className="aia-center" role="main">

          {/* Chat Header (dark bar) */}
          <div className="aia-chat-hd">
            <div className="aia-chat-hd__left">
              <span className="aia-chat-hd__icon" aria-hidden>⬡</span>
              <div>
                <div className="aia-chat-hd__title">ARYACOPILOT AI ASSISTANT</div>
                <div className="aia-chat-hd__sub">Offline RAG-Based Network Operations Copilot</div>
              </div>
            </div>
            <div className="aia-chat-hd__meta">
              {[
                { lbl:'MODEL',          val:'PRE-MAN' },
                { lbl:'KNOWLEDGE BASE', val:'248 DOCS' },
                { lbl:'INFERENCE TIME', val:'0.6 SEC'  },
                { lbl:'CONFIDENCE',     val:'93%', hi: true },
              ].map(m => (
                <div key={m.lbl} className="aia-meta">
                  <span className="aia-meta__lbl">{m.lbl}</span>
                  <span className={`aia-meta__val${m.hi ? ' aia-meta__val--hi' : ''}`}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="aia-messages" role="log" aria-label="Conversation">
            {messages.map(msg => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={msgEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="aia-quick">
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.id}
                id={`btn-quick-${a.id}`}
                className="aia-quick__btn"
                disabled={isTyping}
                onClick={() => sendMessage(a.label, a.id)}
                title={a.label}
              >
                ▸ {a.label}
              </button>
            ))}
          </div>

          {/* Retrieved Context */}
          <div className="aia-ctx">
            <button
              id="btn-ctx-toggle"
              className="aia-ctx__toggle"
              aria-expanded={ctxOpen}
              onClick={() => setCtxOpen(o => !o)}
            >
              <span>≡ RETRIEVED CONTEXT &amp; SOURCE CHUNKS</span>
              <span className="aia-ctx__chevron" aria-hidden>{ctxOpen ? '▲' : '▼'}</span>
            </button>
            <div className={`aia-ctx__body${ctxOpen ? ' aia-ctx__body--open' : ''}`}>
              <div className="aia-ctx__grid">
                {/* File list */}
                <div className="aia-ctx__files">
                  {RETRIEVED_CONTEXT.map(src => (
                    <button
                      key={src.id}
                      id={`btn-ctx-file-${src.id}`}
                      className={`aia-ctx-file${selectedSrc?.id === src.id ? ' aia-ctx-file--active' : ''}`}
                      onClick={() => setSelectedSrc(src)}
                    >
                      <span className="aia-ctx-file__name">{src.file}</span>
                      <span className="aia-ctx-file__sim" style={{ color: simColor(src.sim) }}>
                        {src.sim}%
                      </span>
                    </button>
                  ))}
                </div>
                {/* Snippet */}
                {selectedSrc && (
                  <div className="aia-ctx__preview" key={selectedSrc.id}>
                    <div className="aia-ctx__preview-src">{selectedSrc.file}</div>
                    <p className="aia-ctx__preview-txt">{selectedSrc.snippet}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <div className="aia-input-bar" role="form" aria-label="Chat input">
            <button className="aia-input-bar__attach" id="btn-attach" aria-label="Attach file" title="Attach file">
              📎
            </button>
            <textarea
              id="aia-chat-input"
              className="aia-input-bar__textarea"
              placeholder="Ask AryaCopilot..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isTyping}
              aria-label="Chat message"
            />
            <button
              id="btn-send"
              className="aia-input-bar__send"
              disabled={isTyping || !input.trim()}
              onClick={() => sendMessage(input)}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>

          {/* Footer */}
          <div className="aia-chat-footer" aria-label="Session info footer">
            AryaCopilot Session: CORE-R2 &nbsp;|&nbsp; Docs: 248 &nbsp;|&nbsp; Vectors: 12,482 &nbsp;|&nbsp; Chunks Active: 6 &nbsp;|&nbsp; Confidence: 93%
          </div>

        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <aside className="aia-right" aria-label="Analysis panel">

          {/* Live Analysis */}
          <section className="aia-panel" aria-label="Live Analysis">
            <header className="aia-panel__hd">
              <h2 className="aia-panel__ttl">LIVE ANALYSIS</h2>
              <span className="aia-live-dot" aria-label="Live" title="Live feed" />
            </header>
            <div className="aia-metrics">
              {LIVE_METRICS.map(m => (
                <div key={m.label} className="aia-metric">
                  <div className="aia-metric__row">
                    <span className="aia-metric__lbl">{m.label}</span>
                    <span className={`aia-metric__val aia-metric__val--${m.sev}`}>{m.value}</span>
                  </div>
                  <div className="aia-metric__track" role="progressbar" aria-valuenow={m.pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`aia-metric__fill aia-metric__fill--${m.sev}`} style={{ width:`${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended Actions */}
          <section className="aia-panel" aria-label="Recommended Actions">
            <header className="aia-panel__hd">
              <h2 className="aia-panel__ttl">RECOMMENDED ACTIONS</h2>
            </header>
            <div className="aia-recs">
              {RECOMMENDATIONS.map((r, i) => (
                <button
                  key={i}
                  id={`btn-rec-${i}`}
                  className="aia-rec-btn"
                  disabled={isTyping}
                  onClick={() => sendMessage(r)}
                  title={`Execute: ${r}`}
                >
                  <span className="aia-rec-btn__num">{String(i+1).padStart(2,'0')}</span>
                  {r}
                </button>
              ))}
            </div>
          </section>

          {/* Confidence Meter */}
          <ConfidenceMeter value={93} />

        </aside>

      </div>
    </div>
  );
}

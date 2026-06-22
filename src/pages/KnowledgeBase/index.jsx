import { useState, useMemo } from 'react';
import KPICard from '../../components/KPICard/index.jsx';
import './KnowledgeBase.css';

/* ══════════════════════════════════════════════════════
   Static Data
══════════════════════════════════════════════════════ */
const DOCUMENTS = [
  { id:1, name:'MPLS_Troubleshooting.pdf', cat:'Runbook',       chunks:42,  date:'2024-05-13\n09:42', ext:'pdf'  },
  { id:2, name:'OSPF_Playbook.docx',       cat:'Playbook',      chunks:18,  date:'2024-05-11\n14:15', ext:'docx' },
  { id:3, name:'Network_Topology.png',     cat:'Topology Map',  chunks:1,   date:'2024-05-08\n11:20', ext:'png'  },
  { id:4, name:'CORE_R2.conf',             cat:'Configuration', chunks:124, date:'2024-05-14\n02:13', ext:'conf' },
];

const CHUNKS = [
  {
    id:1,
    source:'OSPF_Playbook.docx (Part 6)',
    sim:96,
    text:`...If LDP neighbor discovery fails on core interfaces, verify that MPLS labels are correctly being propagated via the Label Information Base (LIB). Use 'show mpls ldp discovery' to check status...`,
  },
  {
    id:2,
    source:'OSPF_Playbook.docx (Section 8)',
    sim:94,
    text:`...Common OSPF area mismatch errors often present as 'ExStart' state hang. Verify MTU consistency across links and ensure area-ID matching on both ends of the interface...`,
  },
  {
    id:3,
    source:'MPLS_Troubleshooting.pdf (SP 3.18)',
    sim:91,
    text:`...Step 3: Restart Tunnel. If the TE-Tunnel remains down after label verification, a graceful restart of the RSVP process may be required to clear stale path state elements...`,
  },
];

const CAT_STYLE = {
  'Runbook':       { bg:'#FFF3E8', col:'#C2410C', border:'#FED7AA' },
  'Playbook':      { bg:'#EFF6FF', col:'#1D4ED8', border:'#BFDBFE' },
  'Topology Map':  { bg:'#F5F3FF', col:'#6D28D9', border:'#DDD6FE' },
  'Configuration': { bg:'#F0FDF4', col:'#15803D', border:'#BBF7D0' },
};

const DOC_ICON = { pdf:'📄', docx:'📝', png:'🖼️', conf:'⚙️' };

const UPLOAD_TYPES = [
  { label:'Runbook',          icon:'📄', id:'runbook'  },
  { label:'Playbook',         icon:'📋', id:'playbook' },
  { label:'Config',           icon:'⚙️', id:'config'   },
  { label:'Topology Map',     icon:'🗺️', id:'topology' },
  { label:'Incident Report',  icon:'⚠️', id:'incident' },
];

const VDB_ROWS = [
  { label:'Provider', value:'FAISS'            },
  { label:'Vectors',  value:'12,482'           },
  { label:'Model',    value:'All-MiniLM-L6-v2' },
  { label:'Size',     value:'84 MB'            },
];

/* ══════════════════════════════════════════════════════
   KnowledgeSearch
══════════════════════════════════════════════════════ */
function KnowledgeSearch({ query, onChange }) {
  return (
    <div className="kb-search">
      <div className="kb-search__input-wrap">
        <span className="kb-search__icon" aria-hidden>🔍</span>
        <input
          id="kb-search-input"
          type="text"
          className="kb-search__input"
          placeholder="Search runbooks, configs, topology maps..."
          value={query}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button
            className="kb-search__clear"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <button id="btn-ask-arya" className="kb-search__ask-btn">
        ASK ARYACOPILOT
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DocumentRepository
══════════════════════════════════════════════════════ */
function CategoryBadge({ cat }) {
  const s = CAT_STYLE[cat] || { bg:'#F3F4F6', col:'#6B7280', border:'#E5E7EB' };
  return (
    <span className="kb-cat" style={{ background:s.bg, color:s.col, borderColor:s.border }}>
      {cat}
    </span>
  );
}

function DocumentRepository({ selected, onSelect, query }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filter,  setFilter]  = useState('All');

  const rows = useMemo(() => {
    let d = [...DOCUMENTS];
    if (filter !== 'All') d = d.filter(r => r.cat === filter);
    if (query) d = d.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.cat.toLowerCase().includes(query.toLowerCase()));
    return d.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [sortKey, sortDir, filter, query]);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const Arrow = ({ k }) => (
    <span className={`kb-sarrow${sortKey !== k ? ' kb-sarrow--off' : ''}`}>
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const COLS = [
    { key:'name',   label:'Document Name'  },
    { key:'cat',    label:'Category'       },
    { key:'chunks', label:'Chunks'         },
    { key:'date',   label:'Last Updated'   },
  ];

  return (
    <section className="kb-panel" aria-label="Document Repository">
      <header className="kb-panel__hd">
        <h2 className="kb-panel__ttl">DOCUMENT REPOSITORY</h2>
        <div className="kb-panel__hd-actions">
          <select
            id="kb-filter-sel"
            className="kb-filter-sel"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Runbook</option>
            <option>Playbook</option>
            <option>Topology Map</option>
            <option>Configuration</option>
          </select>
          <button className="kb-icon-btn" title="Filter" id="btn-kb-filter">⊟</button>
          <button className="kb-icon-btn" title="Sort"   id="btn-kb-sort">⇅</button>
        </div>
      </header>
      <div className="kb-table-wrap">
        <table className="kb-table">
          <thead>
            <tr>
              {COLS.map(c => (
                <th
                  key={c.key}
                  className="kb-th"
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label} <Arrow k={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={r.id}
                className={`kb-tr${selected?.id === r.id ? ' kb-tr--active' : ''}`}
                onClick={() => onSelect(r)}
                title={`Click to preview ${r.name}`}
              >
                <td className="kb-td kb-td--name">
                  <span className="kb-doc-icon" aria-hidden>{DOC_ICON[r.ext] || '📄'}</span>
                  <span className="kb-doc-name">{r.name}</span>
                </td>
                <td className="kb-td"><CategoryBadge cat={r.cat} /></td>
                <td className="kb-td kb-td--num">{r.chunks}</td>
                <td className="kb-td kb-td--date">{r.date}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="4" className="kb-empty">No documents match your filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   KnowledgeChunkCard + RetrievedChunks
══════════════════════════════════════════════════════ */
function KnowledgeChunkCard({ chunk }) {
  const simColor = chunk.sim >= 95 ? '#22C55E' : chunk.sim >= 90 ? '#F59E0B' : '#6B7280';
  return (
    <div className="kb-chunk">
      <div className="kb-chunk__hd">
        <span className="kb-chunk__src">{chunk.source}</span>
        <span className="kb-chunk__sim" style={{ color: simColor }}>
          Similarity: <strong>{chunk.sim}%</strong>
        </span>
      </div>
      <div className="kb-chunk__text">{chunk.text}</div>
    </div>
  );
}

function RetrievedChunks() {
  return (
    <section className="kb-panel kb-chunks-panel" aria-label="Retrieved Knowledge Chunks">
      <header className="kb-panel__hd">
        <h2 className="kb-panel__ttl">≡ RETRIEVED KNOWLEDGE CHUNKS</h2>
        <span className="kb-panel__count">{CHUNKS.length} results</span>
      </header>
      <div className="kb-chunks-body">
        {CHUNKS.map(c => (
          <KnowledgeChunkCard key={c.id} chunk={c} />
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   DocumentPreview
══════════════════════════════════════════════════════ */
function DocumentPreview({ doc }) {
  const fname = doc?.name || 'MPLS_Troubleshooting.pdf';
  return (
    <section className="kb-panel kb-preview" aria-label="Document Preview">
      <header className="kb-panel__hd">
        <h2 className="kb-panel__ttl">PREVIEW</h2>
        <span className="kb-preview__fname" title={fname}>{fname}</span>
        <button className="kb-icon-btn" title="Expand preview" id="btn-expand-preview">⤢</button>
      </header>
      <div className="kb-preview__body">
        <div className="kb-preview__doc-title">MPLS Troubleshooting Guide</div>
        <div className="kb-preview__doc-meta">VERSION 2.4 &nbsp;|&nbsp; INTERNAL ENGINEERING DOCUMENT</div>
        <div className="kb-preview__sections">
          <div className="kb-preview__sec">
            <div className="kb-preview__sec-num">01</div>
            <div className="kb-preview__sec-content">
              <div className="kb-preview__sec-title">Verify MPLS Labels</div>
              <p className="kb-preview__sec-text">
                Check forwarding information base to ensure incoming and
                outgoing labels are mapped for the prefix.
              </p>
            </div>
          </div>
          <div className="kb-preview__sec">
            <div className="kb-preview__sec-num">02</div>
            <div className="kb-preview__sec-content">
              <div className="kb-preview__sec-title">Check neighbor Reachability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   VectorDBStatus
══════════════════════════════════════════════════════ */
function VectorDBStatus() {
  return (
    <section className="kb-panel" aria-label="Vector Database Status">
      <header className="kb-panel__hd">
        <h2 className="kb-panel__ttl">VECTOR DATABASE STATUS</h2>
      </header>
      <div className="kb-vdb">
        {VDB_ROWS.map(r => (
          <div key={r.label} className="kb-vdb__row">
            <span className="kb-vdb__lbl">{r.label}</span>
            <span className="kb-vdb__val">{r.value}</span>
          </div>
        ))}
        <div className="kb-vdb__status">
          <span className="kb-vdb__dot" aria-hidden />
          STATUS: <strong>ACTIVE</strong>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   AryaInsightCard
══════════════════════════════════════════════════════ */
function AryaInsightCard() {
  return (
    <section className="kb-panel kb-insight" aria-label="AryaCopilot Insight">
      <header className="kb-insight__hd">
        <span className="kb-insight__icon" aria-hidden>⬡</span>
        <span className="kb-insight__ttl">ARYACOPILOT INSIGHT</span>
      </header>
      <div className="kb-insight__body">
        <p>
          Based on recent configurations, changes in CORE-R2 and EDGE-R1 are
          strongly correlated with routing instability.
        </p>
        <p>
          Recommended review: <strong>MPLS troubleshooting section 4.2</strong>
        </p>
        <div className="kb-insight__footer">
          <span className="kb-insight__conf">Confidence: <strong>93%</strong></span>
          <button className="kb-insight__cta" id="btn-insight-report">
            REPORT →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   UploadKnowledgePanel
══════════════════════════════════════════════════════ */
function UploadKnowledgePanel() {
  return (
    <section className="kb-panel" aria-label="Upload Knowledge">
      <header className="kb-panel__hd">
        <h2 className="kb-panel__ttl">UPLOAD KNOWLEDGE</h2>
      </header>
      <div className="kb-upload">
        {UPLOAD_TYPES.map(t => (
          <button
            key={t.id}
            className="kb-upload__btn"
            id={`btn-upload-${t.id}`}
          >
            <span className="kb-upload__icon" aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   Page Export
══════════════════════════════════════════════════════ */
export default function KnowledgeBase() {
  const [query,  setQuery]  = useState('');
  const [selDoc, setSelDoc] = useState(null);

  return (
    <div className="kb-page">

      {/* ── Header ── */}
      <div className="kb-header">
        <div className="kb-header__text">
          <h1 className="kb-header__title">KNOWLEDGE BASE</h1>
          <p className="kb-header__sub">
            Air-Gapped Retrieval Augmented Generation Engine
          </p>
        </div>
        <div className="kb-header__actions">
          <button className="kb-hdr-btn" id="btn-reindex">RE-INDEX DATABASE</button>
          <button className="kb-hdr-btn kb-hdr-btn--primary" id="btn-add-knowledge">
            + ADD KNOWLEDGE
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="kb-kpi-row">
        <KPICard
          label="Documents Indexed"
          value="248"
          variant="change"
          changeValue="+12 New"
          changeType="positive"
        />
        <KPICard
          label="Runbooks"
          value="56"
          variant="badge"
          badgeText="PDF / DOCX"
          badgeType="info"
        />
        <KPICard
          label="Configuration Files"
          value="89"
          variant="badge"
          badgeText="YAML / CONF"
          badgeType="warning"
        />
        <KPICard
          label="Embedding Status"
          value="100%"
          variant="gauge"
          gaugeValue={100}
          subLabel="READY"
          subLabelColor="#22C55E"
        />
      </div>

      {/* ── Search ── */}
      <KnowledgeSearch query={query} onChange={setQuery} />

      {/* ── 3-Column Body ── */}
      <div className="kb-body">

        {/* Left: Document Repository */}
        <div className="kb-col kb-col--left">
          <DocumentRepository
            query={query}
            selected={selDoc}
            onSelect={setSelDoc}
          />
        </div>

        {/* Center: Retrieved Chunks */}
        <div className="kb-col kb-col--center">
          <RetrievedChunks />
        </div>

        {/* Right: Preview + VDB + Insight + Upload */}
        <div className="kb-col kb-col--right">
          <DocumentPreview doc={selDoc} />
          <VectorDBStatus />
          <AryaInsightCard />
          <UploadKnowledgePanel />
        </div>

      </div>
    </div>
  );
}

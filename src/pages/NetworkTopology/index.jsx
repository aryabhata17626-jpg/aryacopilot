import { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MdZoomIn, MdZoomOut, MdFitScreen, MdChevronRight } from 'react-icons/md';
import KPICard from '../../components/KPICard/index.jsx';
import './NetworkTopology.css';

/* ════════════════════════════════════════════════════════
   Node & Edge Data
═══════════════════════════════════════════════════════ */
const NODE_META = {
  'edge-r1': { label:'EDGE-R1', status:'healthy', type:'Edge Router',  shape:'diamond', cpu:'45%', ram:'62%', latency:'8ms',  uptime:'12 Days', temp:'38°C', queue:12 },
  'core-r2': { label:'CORE-R2', status:'healthy', type:'Core Router',  shape:'rect',    cpu:'82%', ram:'74%', latency:'12ms', uptime:'37 Days', temp:'44°C', queue:31 },
  'core-r3': { label:'CORE-R3', status:'healthy', type:'Core Router',  shape:'rect',    cpu:'55%', ram:'48%', latency:'14ms', uptime:'22 Days', temp:'40°C', queue:8  },
  'fw-01':   { label:'FW-01',   status:'healthy', type:'Firewall',     shape:'rect',    cpu:'30%', ram:'40%', latency:'5ms',  uptime:'8 Days',  temp:'35°C', queue:4  },
  'db-s1':   { label:'DB-S1',   status:'warning', type:'Database Srv', shape:'rect',    cpu:'91%', ram:'88%', latency:'22ms', uptime:'5 Days',  temp:'52°C', queue:47 },
  'app-s2':  { label:'APP-S2',  status:'failed',  type:'App Server',   shape:'rect',    cpu:'100%',ram:'95%', latency:'--',   uptime:'0 Days',  temp:'61°C', queue:99 },
  'vpn-g':   { label:'VPN-G',   status:'healthy', type:'VPN Gateway',  shape:'diamond', cpu:'20%', ram:'30%', latency:'18ms', uptime:'15 Days', temp:'33°C', queue:2  },
};

const INITIAL_NODES = [
  { id:'edge-r1', type:'topoNode', position:{ x:80,  y:140 }, data: NODE_META['edge-r1'] },
  { id:'core-r2', type:'topoNode', position:{ x:290, y:90  }, data: NODE_META['core-r2'] },
  { id:'core-r3', type:'topoNode', position:{ x:490, y:90  }, data: NODE_META['core-r3'] },
  { id:'fw-01',   type:'topoNode', position:{ x:140, y:270 }, data: NODE_META['fw-01']   },
  { id:'db-s1',   type:'topoNode', position:{ x:320, y:270 }, data: NODE_META['db-s1']   },
  { id:'app-s2',  type:'topoNode', position:{ x:490, y:270 }, data: NODE_META['app-s2']  },
  { id:'vpn-g',   type:'topoNode', position:{ x:60,  y:370 }, data: NODE_META['vpn-g']   },
];

const EDGE_COLOR = { healthy: '#22C55E', warning: '#F59E0B', failed: '#EF4444' };

// Each healthy edge gets a different animation duration for staggered packet flow
const mkEdge = (s, t, status, dur = '2s') => ({
  id: `${s}→${t}`,
  source: s,
  target: t,
  type: 'packetEdge',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: EDGE_COLOR[status],
    width: 14,
    height: 14,
  },
  data: { status, dur },
});

const INITIAL_EDGES = [
  mkEdge('edge-r1', 'core-r2', 'healthy', '1.8s'),
  mkEdge('core-r2', 'core-r3', 'healthy', '2.2s'),
  mkEdge('edge-r1', 'fw-01',   'healthy', '2.6s'),
  mkEdge('core-r2', 'db-s1',   'warning'),
  mkEdge('fw-01',   'db-s1',   'healthy', '3.0s'),
  mkEdge('db-s1',   'app-s2',  'failed' ),
  mkEdge('vpn-g',   'fw-01',   'healthy', '2.0s'),
  mkEdge('core-r3', 'app-s2',  'healthy', '1.5s'),
];

/* ════════════════════════════════════════════════════════
   Custom ReactFlow Node
═══════════════════════════════════════════════════════ */
function TopoNode({ data, selected }) {
  const [hovered, setHovered] = useState(false);
  const isDiamond = data.shape === 'diamond';

  return (
    <div
      className={`topo-nw${selected ? ' topo-nw--sel' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top}    className="topo-h" />
      <Handle type="target" position={Position.Left}   className="topo-h" />
      <Handle type="source" position={Position.Right}  className="topo-h" />
      <Handle type="source" position={Position.Bottom} className="topo-h" />

      {isDiamond ? (
        <div className={`topo-diamond topo-diamond--${data.status}`}>
          <span className="topo-diamond__lbl">{data.label}</span>
        </div>
      ) : (
        <div className={`topo-rect topo-rect--${data.status}`}>
          <span className="topo-rect__lbl">{data.label}</span>
        </div>
      )}

      {hovered && (
        <div className="topo-tip">
          <div className="topo-tip__head">
            <span className="topo-tip__name">{data.label}</span>
            <span className={`topo-tip__tag topo-tip__tag--${data.status}`}>
              {data.status.toUpperCase()}
            </span>
          </div>
          <div className="topo-tip__sub">{data.type}</div>
          <div className="topo-tip__rows">
            <div className="topo-tip__r"><span>CPU</span><b>{data.cpu}</b></div>
            <div className="topo-tip__r"><span>RAM</span><b>{data.ram}</b></div>
            <div className="topo-tip__r"><span>Latency</span><b>{data.latency}</b></div>
            <div className="topo-tip__r"><span>Status</span><b>{data.status}</b></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Custom Animated Packet Edge
   — moves a glowing dot along healthy edges via SVG animateMotion
═══════════════════════════════════════════════════════ */
function PacketEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd,
}) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const color     = EDGE_COLOR[data.status] || '#9CA3AF';
  const isHealthy = data.status === 'healthy';
  const dur       = data.dur || '2s';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke:      color,
          strokeWidth: 1.5,
          ...(!isHealthy && { strokeDasharray: '5 4' }),
        }}
      />

      {/* Animated packet dot — only on healthy links */}
      {isHealthy && (
        <g>
          {/* Outer glow */}
          <circle r="5" fill={color} opacity="0.25">
            <animateMotion dur={dur} repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Core dot */}
          <circle r="3" fill={color} opacity="0.9">
            <animateMotion dur={dur} repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* White highlight */}
          <circle r="1.2" fill="#ffffff" opacity="0.95">
            <animateMotion dur={dur} repeatCount="indefinite" path={edgePath} />
          </circle>
        </g>
      )}
    </>
  );
}

/* ── Register custom types OUTSIDE any component (prevents recreation warning) ── */
const nodeTypes = { topoNode: TopoNode };
const edgeTypes = { packetEdge: PacketEdge };

/* ════════════════════════════════════════════════════════
   TopologyGraph (inner – uses useReactFlow inside Provider)
═══════════════════════════════════════════════════════ */
function TopologyGraph({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="topo-canvas">
      {/* Zoom Controls */}
      <div className="topo-zoom">
        <button id="btn-zoom-in"  className="topo-zoom__btn" onClick={() => zoomIn()}  title="Zoom In"><MdZoomIn /></button>
        <button id="btn-zoom-out" className="topo-zoom__btn" onClick={() => zoomOut()} title="Zoom Out"><MdZoomOut /></button>
        <button id="btn-fit-view" className="topo-zoom__btn" onClick={() => fitView({ padding: 0.25 })} title="Reset"><MdFitScreen /></button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'packetEdge' }}
      >
        {/* Dot-grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          color="#D1D5DB"
          gap={22}
          size={1.2}
        />

        {/* Mini-map — bottom right */}
        <MiniMap
          nodeColor={n => EDGE_COLOR[n.data?.status] || '#9CA3AF'}
          nodeStrokeWidth={2}
          pannable
          zoomable
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
          }}
          maskColor="rgba(229, 231, 235, 0.55)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="topo-legend">
        <span className="topo-leg"><span className="topo-leg-dot topo-leg-dot--h" />Healthy</span>
        <span className="topo-leg"><span className="topo-leg-dot topo-leg-dot--w" />Warning</span>
        <span className="topo-leg"><span className="topo-leg-dot topo-leg-dot--f" />Failed</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DeviceInspector
═══════════════════════════════════════════════════════ */
function DeviceInspector({ node }) {
  if (!node) {
    return (
      <div className="insp">
        <div className="insp__empty">Click a node to inspect</div>
      </div>
    );
  }
  const d = node.data;
  const cpuPct  = parseInt(d.cpu)  || 0;
  const ramPct  = parseInt(d.ram)  || 0;

  return (
    <div className="insp">
      <div className="insp__hd">
        <div>
          <div className="insp__sub">Device Inspector</div>
          <div className="insp__name">{d.label}</div>
        </div>
        <span className={`insp__badge insp__badge--${d.status}`}>{d.status.toUpperCase()}</span>
      </div>

      <div className="insp__metrics">
        {/* CPU */}
        <div className="insp-metric">
          <span className="insp-metric__lbl">CPU Load</span>
          <div className="insp-metric__right">
            <div className="insp-bar-track">
              <div className="insp-bar-fill" style={{
                width: d.cpu === '--' ? '100%' : d.cpu,
                background: cpuPct >= 90 ? '#EF4444' : cpuPct >= 70 ? '#F59E0B' : '#22C55E',
              }} />
            </div>
            <span className="insp-metric__val">{d.cpu}</span>
          </div>
        </div>

        {/* RAM */}
        <div className="insp-metric">
          <span className="insp-metric__lbl">RAM Usage</span>
          <div className="insp-metric__right">
            <div className="insp-bar-track">
              <div className="insp-bar-fill" style={{
                width: d.ram,
                background: ramPct >= 90 ? '#EF4444' : '#3B82F6',
              }} />
            </div>
            <span className="insp-metric__val">{d.ram}</span>
          </div>
        </div>

        <div className="insp-divider" />

        <div className="insp-row-pair">
          <div className="insp-pair">
            <span>Queue Depth</span>
            <strong>{d.queue}</strong>
          </div>
          <div className="insp-pair">
            <span>Core Temp</span>
            <strong>{d.temp}</strong>
          </div>
        </div>
        <div className="insp-row-pair">
          <div className="insp-pair insp-pair--wide">
            <span>System Uptime</span>
            <strong>{d.uptime}</strong>
          </div>
        </div>
      </div>

      <div className="insp__actions">
        <button id="btn-view-logs"   className="insp-btn insp-btn--primary">VIEW LOGS</button>
        <button id="btn-view-config" className="insp-btn">VIEW CONFIG</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ViewControls
═══════════════════════════════════════════════════════ */
function ViewControls() {
  const [state, setState] = useState({
    ospf: true, mpls: false, netflow: true, animation: true,
  });
  const toggle = key => setState(p => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: 'ospf',      label: 'Show OSPF'        },
    { key: 'mpls',      label: 'Show MPLS'        },
    { key: 'netflow',   label: 'Show NetFlow'     },
    { key: 'animation', label: 'Packet Animation' },
  ];

  return (
    <div className="vc-panel">
      <div className="vc-panel__lbl">View Controls</div>
      {items.map(({ key, label }) => (
        <div key={key} className="vc-row">
          <span className="vc-row__lbl">{label}</span>
          <button
            id={`toggle-${key}`}
            role="switch"
            aria-checked={state[key]}
            className={`tog${state[key] ? ' tog--on' : ''}`}
            onClick={() => toggle(key)}
          >
            <span className="tog__thumb" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   RouteExplorer
═══════════════════════════════════════════════════════ */
function HopPath({ hops, isAlt }) {
  return (
    <div className="r-hops">
      {hops.map((hop, i) => (
        <span key={hop} className="r-hops__grp">
          <span className={`r-hop${isAlt ? ' r-hop--alt' : ''}`}>{hop}</span>
          {i < hops.length - 1 && <span className="r-arrow">→</span>}
        </span>
      ))}
    </div>
  );
}

function RouteExplorer() {
  const primary   = ['EDGE-R1','CORE-R2','CORE-R3','APP-S2'];
  const secondary = ['EDGE-R1','FW-01','DB-S1','APP-S2'];

  return (
    <div className="nt-panel">
      <div className="nt-panel__hd">
        <h3 className="nt-panel__ttl">Route Explorer</h3>
        <div className="r-meta">
          Source: <b>EDGE-R1</b>
          <span className="r-meta__arrow">→</span>
          Destination: <b>APP-S2</b>
        </div>
      </div>
      <div className="nt-panel__body">
        <div className="r-block r-block--primary">
          <div className="r-block__top">
            <span className="r-block__tag">Current Optimal Path</span>
            <span className="r-block__ms">14 ms</span>
          </div>
          <HopPath hops={primary} isAlt={false} />
        </div>
        <div className="r-block">
          <div className="r-block__top">
            <span className="r-block__tag r-block__tag--alt">Alternative Path (Failover)</span>
            <span className="r-block__ms r-block__ms--alt">28 ms</span>
          </div>
          <HopPath hops={secondary} isAlt={true} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   RecentEvents
═══════════════════════════════════════════════════════ */
const EVENTS = [
  { time:'12:14', label:'OSPF Neighbor Lost',    sev:'danger'  },
  { time:'12:18', label:'Tunnel Restarted',       sev:'warning' },
  { time:'12:21', label:'Queue Depth Increased',  sev:'warning' },
  { time:'12:25', label:'Traffic Spike Detected', sev:'danger'  },
  { time:'12:31', label:'MPLS Path Changed',      sev:'info'    },
];

function RecentEvents() {
  return (
    <div className="nt-panel">
      <div className="nt-panel__hd">
        <h3 className="nt-panel__ttl">Recent Events</h3>
      </div>
      <div className="ev-list">
        {EVENTS.map((ev, i) => (
          <div key={i} className="ev-row">
            <span className={`ev-dot ev-dot--${ev.sev}`} />
            <span className="ev-time">{ev.time}</span>
            <span className="ev-lbl">{ev.label}</span>
            <MdChevronRight className="ev-chev" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main Export
═══════════════════════════════════════════════════════ */
export default function NetworkTopology() {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, , onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState(
    INITIAL_NODES.find(n => n.id === 'core-r2')
  );

  const handleNodeClick = useCallback((_e, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="nt-page">

      {/* ── Page Header ── */}
      <div className="nt-hd">
        <h1 className="nt-hd__title">NETWORK TOPOLOGY</h1>
        <p className="nt-hd__sub">
          Interactive Digital Twin Visualization
          <span className="nt-hd__live">
            <span className="live-dot" />Live Feed: Active
          </span>
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="nt-kpi-row">
        <KPICard label="Total Routers"   value="16"    variant="change"   changeValue="↑2 Online"   changeType="positive" />
        <KPICard label="Active Links"    value="31"    variant="change"   changeValue="↓1 Degraded" changeType="negative" />
        <KPICard label="Average Latency" value="14 ms" variant="progress" progressValue={28}         progressColor="#FF6B00" />
        <KPICard label="Packet Loss"     value="0.8%"  variant="badge"    badgeText="NORMAL"         badgeType="info" />
      </div>

      {/* ── Main: Topology + Right Panel ── */}
      <div className="nt-main">
        <ReactFlowProvider>
          <TopologyGraph
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
          />
        </ReactFlowProvider>

        <div className="nt-rhs">
          <DeviceInspector node={selectedNode} />
          <ViewControls />
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="nt-bot">
        <RouteExplorer />
        <RecentEvents />
      </div>

    </div>
  );
}

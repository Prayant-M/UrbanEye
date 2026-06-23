import React, { useState, useMemo } from 'react';
import { MapPin, Info, Flame, Shield, CheckCircle, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { latLngToCell, cellToBoundary } from 'h3-js';
import { Issue, IssueCategory } from '../types';

interface CivicMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  selectedCategory: string;
}

// 8 simulated key neighborhood zones in Bangalore to position on our vector dashboard
const WARDS_COORDS = [
  { name: 'Koramangala', cx: 280, cy: 320, r: 42, color: 'rgba(16, 185, 129, 0.08)', borderColor: '#10b981' },
  { name: 'Indiranagar', cx: 380, cy: 180, r: 45, color: 'rgba(6, 182, 212, 0.08)', borderColor: '#06b6d4' },
  { name: 'HSR Layout', cx: 360, cy: 400, r: 48, color: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' },
  { name: 'Bellandur', cx: 480, cy: 360, r: 52, color: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' },
  { name: 'Vasanth Nagar', cx: 210, cy: 150, r: 38, color: 'rgba(139, 92, 246, 0.08)', borderColor: '#8b5cf6' },
  { name: 'Jayanagar', cx: 160, cy: 360, r: 46, color: 'rgba(16, 185, 129, 0.06)', borderColor: '#10b981' },
  { name: 'Malleswaram', cx: 120, cy: 120, r: 40, color: 'rgba(236, 72, 153, 0.08)', borderColor: '#ec4899' },
  { name: 'Whitefield', cx: 580, cy: 220, r: 55, color: 'rgba(245, 158, 11, 0.06)', borderColor: '#f59e0b' },
];

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Marker with InfoWindow helper for Google Maps
interface GoogleMapMarkerProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: () => void;
  key?: string;
}

function GoogleMapMarker({
  issue,
  isSelected,
  onSelect
}: GoogleMapMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  const getCategoryHex = (cat: IssueCategory) => {
    switch (cat) {
      case 'pothole': return '#fbbf24';
      case 'water_leak': return '#22d3ee';
      case 'broken_streetlight': return '#facc15';
      case 'garbage': return '#f97316';
      case 'drainage': return '#818cf8';
      case 'illegal_dumping': return '#f43f5e';
      default: return '#10b981';
    }
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: issue.location.lat, lng: issue.location.lng }}
        onClick={() => {
          onSelect();
          setOpen(true);
        }}
      >
        <Pin
          background={getCategoryHex(issue.category)}
          glyphColor="#fff"
          borderColor={isSelected ? '#10b981' : '#fff'}
          scale={isSelected ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1 max-w-[200px] text-slate-800">
            <span className="text-[9px] font-bold font-mono text-emerald-600 block mb-0.5 uppercase">
              {issue.category.replace('_', ' ')}
            </span>
            <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">{issue.title}</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-2 line-clamp-2">
              {issue.description}
            </p>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5 mt-1.5">
              <span className="text-[9px] font-mono text-slate-400">Severity: {issue.severity}/5</span>
              <span className="text-[9px] font-bold bg-slate-150 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">
                {issue.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function CivicMap({ issues, selectedIssue, onSelectIssue, selectedCategory }: CivicMapProps) {
  const [viewMode, setViewMode] = useState<'pins' | 'hex' | 'google'>('pins');
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);

  // Filter issues based on active category
  const filteredIssues = issues.filter(issue => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    return true;
  });

  // Calculate coordinates relative to a 700x500 box for vector map
  const getMapPosition = (lat: number, lng: number) => {
    // Standard bounding boxes for central Bangalore
    // Lat: 12.89 to 13.00, Lng: 77.57 to 77.69
    const minLat = 12.89;
    const maxLat = 13.00;
    const minLng = 77.57;
    const maxLng = 77.69;

    const x = ((lng - minLng) / (maxLng - minLng)) * 700;
    // Invert Y axis for screen space
    const y = 500 - ((lat - minLat) / (maxLat - minLat)) * 500;

    return { x: Math.max(20, Math.min(680, x)), y: Math.max(20, Math.min(480, y)) };
  };

  // Compute true H3 Hex cells for viewMode === 'hex'
  const hexCells = useMemo(() => {
    const grid: Record<string, { cell: string; boundary: [number, number][]; count: number; criticalCount: number }> = {};
    filteredIssues.forEach((issue) => {
      // Resolution 8 is good for city-level aggregation
      const cell = latLngToCell(issue.location.lat, issue.location.lng, 7);
      if (!grid[cell]) {
        grid[cell] = { cell, boundary: cellToBoundary(cell), count: 0, criticalCount: 0 };
      }
      grid[cell].count++;
      if (issue.severity >= 4) grid[cell].criticalCount++;
    });
    return Object.values(grid);
  }, [filteredIssues]);

  // Get dynamic colors and metrics for Ward H3 cells
  const getWardMetrics = (wardName: string) => {
    const wardIssues = issues.filter(i => i.location.ward.toLowerCase().includes(wardName.toLowerCase()) && i.status !== 'resolved');
    const criticalCount = wardIssues.filter(i => i.severity >= 4).length;
    return {
      count: wardIssues.length,
      criticalCount,
      color: wardIssues.length > 3 ? 'rgba(239, 68, 68, 0.12)' : wardIssues.length > 1 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.08)',
      borderColor: wardIssues.length > 3 ? '#ef4444' : wardIssues.length > 1 ? '#f59e0b' : '#10b981'
    };
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      {/* Map Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Bangalore Municipal Live Sentinel Map
          </h3>
          <p className="text-[10px] font-mono text-slate-500 tracking-wider">
            GPS PROXIMITY TRIAGE & REAL-TIME GEO-MAPPING
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <button
            id="map-view-pins"
            onClick={() => setViewMode('pins')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'pins'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            Active Pins ({filteredIssues.length})
          </button>
          <button
            id="map-view-hex"
            onClick={() => setViewMode('hex')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'hex'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            H3 Hotspots
          </button>
          <button
            id="map-view-google"
            onClick={() => setViewMode('google')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'google'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="h-3.5 w-3.5 text-cyan-600" />
            Google Map Live
          </button>
        </div>
      </div>

      {/* Map Body Viewports */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden min-h-[400px]" id="urbaneye-map-viewport">
        {viewMode !== 'google' ? (
          <>
            {/* Elegant Vector Stage */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.12]"></div>

            <svg viewBox="0 0 700 500" className="w-full h-full select-none">
              {/* Ward Boundaries (only shown in pins mode for context) */}
              {viewMode === 'pins' && WARDS_COORDS.map((ward) => {
                const isHovered = hoveredWard === ward.name;

                return (
                  <g
                    key={ward.name}
                    onMouseEnter={() => setHoveredWard(ward.name)}
                    onMouseLeave={() => setHoveredWard(null)}
                    className="transition-all duration-300"
                  >
                    {/* Visual Circle Zone representing the ward bounds */}
                    <circle
                      cx={ward.cx}
                      cy={ward.cy}
                      r={ward.r}
                      fill={ward.color}
                      stroke={ward.borderColor}
                      strokeWidth={isHovered ? 2.5 : 1.2}
                      className="transition-all duration-200 cursor-pointer"
                    />

                    {/* Ward Text label on map */}
                    <text
                      x={ward.cx}
                      y={ward.cy - 5}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                      fontWeight="bold"
                      className="font-mono tracking-wider pointer-events-none"
                    >
                      {ward.name}
                    </text>
                  </g>
                );
              })}

              {/* H3 Hex Cells (only in hex view) */}
              {viewMode === 'hex' && hexCells.map((hex) => {
                const points = hex.boundary.map(([lat, lng]) => {
                  const pos = getMapPosition(lat, lng);
                  return `${pos.x},${pos.y}`;
                }).join(' ');

                const color = hex.count > 3 ? 'rgba(239, 68, 68, 0.4)' : hex.count > 1 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';
                const stroke = hex.count > 3 ? '#ef4444' : hex.count > 1 ? '#f59e0b' : '#10b981';

                // Find center for label
                const centerPos = hex.boundary.reduce(
                  (acc, curr) => {
                    const pos = getMapPosition(curr[0], curr[1]);
                    return { x: acc.x + pos.x / hex.boundary.length, y: acc.y + pos.y / hex.boundary.length };
                  },
                  { x: 0, y: 0 }
                );

                return (
                  <g key={hex.cell} className="transition-all duration-300 hover:opacity-80 cursor-pointer">
                    <polygon points={points} fill={color} stroke={stroke} strokeWidth="2" />
                    <text
                      x={centerPos.x}
                      y={centerPos.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      className="font-mono pointer-events-none drop-shadow-md"
                    >
                      {hex.count}
                    </text>
                  </g>
                );
              })}

              {/* Issue PIN markers (only in pins view) */}
              {viewMode === 'pins' && filteredIssues.map((issue) => {
                const pos = getMapPosition(issue.location.lat, issue.location.lng);
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <g
                    key={issue.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group transition-transform duration-250 hover:scale-125"
                    onClick={() => onSelectIssue(issue)}
                  >
                    {/* Glow Ring for active or high severity hazards */}
                    {issue.severity >= 4 && (
                      <circle
                        r={isSelected ? 18 : 12}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Selection Indicator Ring */}
                    {isSelected && (
                      <circle
                        r={16}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Issue Dot */}
                    <circle
                      r={isSelected ? 8 : 6}
                      className={`transition-colors duration-200 fill-current ${
                        issue.category === 'pothole' ? 'text-amber-500' :
                        issue.category === 'water_leak' ? 'text-cyan-500' :
                        issue.category === 'broken_streetlight' ? 'text-yellow-500' :
                        issue.category === 'garbage' ? 'text-orange-500' :
                        issue.category === 'drainage' ? 'text-indigo-500' :
                        issue.category === 'illegal_dumping' ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Tiny Priority Rating label on hover */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect
                        x="-60"
                        y="-38"
                        width="120"
                        height="22"
                        rx="6"
                        fill="#1e293b"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-24"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        className="font-sans"
                      >
                        {issue.title.slice(0, 16)}...
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Selected Zone Hover Overlay */}
            {hoveredWard && (
              <div className="absolute top-3 right-3 rounded-xl bg-white/95 border border-slate-200 p-2.5 shadow-md text-[11px] font-mono min-w-[150px] text-left">
                <div className="text-slate-900 font-extrabold mb-1">{hoveredWard} Ward</div>
                <div className="text-slate-600 font-medium">
                  Active Cases: <span className="text-amber-600 font-bold">{getWardMetrics(hoveredWard).count}</span>
                </div>
                <div className="text-slate-600 font-medium">
                  High Severity: <span className="text-rose-600 font-bold">{getWardMetrics(hoveredWard).criticalCount}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            {/* Live Google Maps Integration Viewport */}
            {!hasValidKey ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6 text-slate-800">
                <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-lg">
                  <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 mx-auto mb-4 border border-cyan-200">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Google Maps API Key Setup Needed</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    The platform supports direct live geo-mapping. To display reported hazards on a real satellite road map:
                  </p>
                  <ul className="text-left text-xs text-slate-600 space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-cyan-600 font-mono">1.</span>
                      <span>
                        <a
                          href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 hover:underline font-bold inline-flex items-center gap-0.5"
                        >
                          Get an API Key <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-cyan-600 font-mono">2.</span>
                      <span>Open <strong>Settings</strong> (⚙️ gear, top-right)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-cyan-600 font-mono">3.</span>
                      <span>Add secret named: <code>GOOGLE_MAPS_PLATFORM_KEY</code></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-cyan-600 font-mono">4.</span>
                      <span>Paste your key and press <strong>Enter</strong></span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-slate-400 font-mono">
                    The workspace compiles and activates Google Maps live automatically.
                  </p>
                </div>
              </div>
            ) : (
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={{ lat: 12.955, lng: 77.63 }}
                  defaultZoom={12}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {filteredIssues.map((issue) => (
                    <GoogleMapMarker
                      key={issue.id}
                      issue={issue}
                      isSelected={selectedIssue?.id === issue.id}
                      onSelect={() => onSelectIssue(issue)}
                    />
                  ))}
                </Map>
              </APIProvider>
            )}
          </div>
        )}

        {/* Map Key panel */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2.5 rounded-xl bg-white/95 border border-slate-200/80 p-2 text-[10px] text-slate-700 shadow-md max-w-[90%] font-bold font-mono z-10">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-white"></span>
            Pothole
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 border border-white"></span>
            Water Leak
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 border border-white"></span>
            Streetlight
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 border border-white"></span>
            Garbage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 border border-white"></span>
            Drainage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 border border-white"></span>
            Illegal Dump
          </div>
        </div>
      </div>
    </div>
  );
}

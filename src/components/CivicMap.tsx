import React, { useState } from 'react';
import { MapPin, Info, Flame, Shield, CheckCircle } from 'lucide-react';
import { Issue, IssueCategory } from '../types';

interface CivicMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  selectedCategory: string;
}

// 10 simulated key neighborhood zones in Bangalore to position on our vector dashboard
const WARDS_COORDS = [
  { name: 'Koramangala', cx: 280, cy: 320, r: 42, color: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' },
  { name: 'Indiranagar', cx: 380, cy: 180, r: 45, color: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4' },
  { name: 'HSR Layout', cx: 360, cy: 400, r: 48, color: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' },
  { name: 'Bellandur', cx: 480, cy: 360, r: 52, color: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' },
  { name: 'Vasanth Nagar', cx: 210, cy: 150, r: 38, color: 'rgba(139, 92, 246, 0.15)', borderColor: '#8b5cf6' },
  { name: 'Jayanagar', cx: 160, cy: 360, r: 46, color: 'rgba(16, 185, 129, 0.12)', borderColor: '#10b981' },
  { name: 'Malleswaram', cx: 120, cy: 120, r: 40, color: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899' },
  { name: 'Whitefield', cx: 580, cy: 220, r: 55, color: 'rgba(245, 158, 11, 0.12)', borderColor: '#f59e0b' },
];

export default function CivicMap({ issues, selectedIssue, onSelectIssue, selectedCategory }: CivicMapProps) {
  const [viewMode, setViewMode] = useState<'hex' | 'pins'>('pins');
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);

  // Filter issues based on active category
  const filteredIssues = issues.filter(issue => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    return true;
  });

  // Calculate coordinates relative to a 700x500 box
  const getMapPosition = (lat: number, lng: number) => {
    // Standard bounding boxes for central Bangalore
    // Lat: 12.90 to 13.00, Lng: 77.55 to 77.70
    const minLat = 12.89;
    const maxLat = 13.00;
    const minLng = 77.57;
    const maxLng = 77.69;

    const x = ((lng - minLng) / (maxLng - minLng)) * 700;
    // Invert Y axis for screen space
    const y = 500 - ((lat - minLat) / (maxLat - minLat)) * 500;

    return { x: Math.max(20, Math.min(680, x)), y: Math.max(20, Math.min(480, y)) };
  };

  const getCategoryColor = (cat: IssueCategory) => {
    switch (cat) {
      case 'pothole': return 'bg-amber-500 text-slate-950 border-amber-400';
      case 'water_leak': return 'bg-cyan-500 text-slate-950 border-cyan-400';
      case 'broken_streetlight': return 'bg-yellow-400 text-slate-950 border-yellow-300';
      case 'garbage': return 'bg-orange-500 text-white border-orange-400';
      case 'drainage': return 'bg-indigo-500 text-white border-indigo-400';
      case 'illegal_dumping': return 'bg-rose-500 text-white border-rose-400';
      default: return 'bg-emerald-500 text-slate-950 border-emerald-400';
    }
  };

  // Get dynamic background and count metrics for Ward H3 cells
  const getWardMetrics = (wardName: string) => {
    const wardIssues = issues.filter(i => i.location.ward.toLowerCase().includes(wardName.toLowerCase()) && i.status !== 'resolved');
    const criticalCount = wardIssues.filter(i => i.severity >= 4).length;
    return {
      count: wardIssues.length,
      criticalCount,
      color: wardIssues.length > 3 ? 'rgba(239, 68, 68, 0.25)' : wardIssues.length > 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
      borderColor: wardIssues.length > 3 ? '#ef4444' : wardIssues.length > 1 ? '#f59e0b' : '#10b981'
    };
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-3 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Bangalore Municipal Live Sentinel Map
          </h3>
          <p className="text-[11px] font-mono text-slate-400 tracking-wider">
            GPS PROXIMITY TRIAGE & H3 CELL AGGREGATION
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            id="map-view-pins"
            onClick={() => setViewMode('pins')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'pins'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="h-3 w-3" />
            Active Pinpoints ({filteredIssues.length})
          </button>
          <button
            id="map-view-hex"
            onClick={() => setViewMode('hex')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'hex'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="h-3 w-3" />
            H3 Hotspots (Hex Map)
          </button>
        </div>
      </div>

      {/* Vector Stage */}
      <div className="relative flex-1 bg-slate-950/90 overflow-hidden min-h-[400px]" id="urbaneye-map-viewport">
        {/* Subtle Map Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.15]"></div>

        <svg viewBox="0 0 700 500" className="w-full h-full select-none">
          {/* Ward Boundaries / Hotspot Aggregates */}
          {WARDS_COORDS.map((ward) => {
            const metrics = getWardMetrics(ward.name);
            const isHovered = hoveredWard === ward.name;
            const finalColor = viewMode === 'hex' ? metrics.color : ward.color;
            const finalBorder = viewMode === 'hex' ? metrics.borderColor : ward.borderColor;

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
                  fill={finalColor}
                  stroke={finalBorder}
                  strokeWidth={isHovered ? 2.5 : 1.2}
                  strokeDasharray={viewMode === 'hex' ? '4 2' : 'none'}
                  className="transition-all duration-200 cursor-pointer"
                />

                {/* Ward Text label on map */}
                <text
                  x={ward.cx}
                  y={ward.cy - 5}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="bold"
                  className="font-mono tracking-wider pointer-events-none fill-slate-400"
                >
                  {ward.name}
                </text>

                {/* Hotspot count values in hex mode */}
                {viewMode === 'hex' && (
                  <text
                    x={ward.cx}
                    y={ward.cy + 12}
                    textAnchor="middle"
                    fill={metrics.count > 3 ? '#f87171' : metrics.count > 0 ? '#fbbf24' : '#34d399'}
                    fontSize="11"
                    fontWeight="black"
                    className="font-mono pointer-events-none"
                  >
                    {metrics.count} Issues
                  </text>
                )}
              </g>
            );
          })}

          {/* Issue PIN markers (only in pins view or always) */}
          {viewMode === 'pins' && filteredIssues.map((issue) => {
            const pos = getMapPosition(issue.location.lat, issue.location.lng);
            const isSelected = selectedIssue?.id === issue.id;
            const categoryColor = getCategoryColor(issue.category);

            // Severity level styling
            const sizeClass = issue.severity >= 4 ? 20 : 15;

            return (
              <g
                key={issue.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group transition-transform duration-200 hover:scale-125"
                onClick={() => onSelectIssue(issue)}
              >
                {/* Glow Ring for active or high severity hazards */}
                {issue.severity >= 4 && (
                  <circle
                    r={isSelected ? 18 : 12}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    className="animate-ping opacity-65"
                  />
                )}

                {/* Selection Indicator Ring */}
                {isSelected && (
                  <circle
                    r={16}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                  />
                )}

                {/* Issue Dot */}
                <circle
                  r={isSelected ? 8 : 6}
                  className={`transition-colors duration-200 fill-current ${
                    issue.category === 'pothole' ? 'text-amber-500' :
                    issue.category === 'water_leak' ? 'text-cyan-400' :
                    issue.category === 'broken_streetlight' ? 'text-yellow-400' :
                    issue.category === 'garbage' ? 'text-orange-500' :
                    issue.category === 'drainage' ? 'text-indigo-400' :
                    issue.category === 'illegal_dumping' ? 'text-rose-500' : 'text-emerald-400'
                  }`}
                  stroke="#020617"
                  strokeWidth="1.5"
                />

                {/* Tiny Priority Rating label on hover */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect
                    x="-60"
                    y="-38"
                    width="120"
                    height="22"
                    rx="6"
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-24"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="9"
                    fontWeight="semibold"
                    className="font-sans"
                  >
                    {issue.title.slice(0, 18)}... ({issue.priorityScore} XP)
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Map Key */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-xl bg-slate-900/95 border border-slate-800 p-2 text-[10px] text-slate-300 shadow-xl max-w-[90%] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            Pothole
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            Water Leak
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
            Streetlight
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            Garbage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            Drainage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            Illegal Dump
          </div>
        </div>

        {/* Selected Zone Hover Overlay */}
        {hoveredWard && (
          <div className="absolute top-3 right-3 rounded-xl bg-slate-900/95 border border-slate-800 p-2.5 shadow-2xl text-[11px] font-mono min-w-[150px]">
            <div className="text-white font-bold mb-1">{hoveredWard} Ward</div>
            <div className="text-slate-400">
              Active Cases: <span className="text-amber-400 font-bold">{getWardMetrics(hoveredWard).count}</span>
            </div>
            <div className="text-slate-400">
              High Severity: <span className="text-rose-400 font-bold">{getWardMetrics(hoveredWard).criticalCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

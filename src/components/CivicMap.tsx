import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MapPin, Flame, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { latLngToCell } from 'h3-js';
import { Issue, IssueCategory } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CivicMapProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  selectedCategory: string;
}

// ──────────────────────────────────────────────────────────────
// Hex Grid Data Types (from bangalore-hex-grid.json)
// ──────────────────────────────────────────────────────────────
interface RawHexCell {
  h3Index: string;
  zone: 'residential' | 'workplace' | 'marketplace';
  nearestArea: string;
  center: { lat: number; lng: number };
  boundary: { lat: number; lng: number }[];
}

interface HexGridData {
  meta: {
    city: string;
    h3Resolution: number;
    cellDiameterMeters: number;
    totalCells: number;
    zoneCounts: Record<string, number>;
  };
  grid: RawHexCell[];
}

interface EnrichedHexCell extends RawHexCell {
  issueCount: number;
  criticalCount: number;
  topCategory: string | null;
  severityAvg: number;
}

// ──────────────────────────────────────────────────────────────
// Zone color palette
// ──────────────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  residential: '#2563EB',
  workplace: '#D97706',
  marketplace: '#059669',
};

const ZONE_LABELS: Record<string, string> = {
  residential: '🏠 Residential',
  workplace: '🏢 Workplace',
  marketplace: '🛒 Marketplace',
};

// CartoDB Voyager tiles (free, no API key)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// ──────────────────────────────────────────────────────────────
// Google Maps API setup (kept for Active Pins mode)
// ──────────────────────────────────────────────────────────────
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Marker with InfoWindow helper for Google Maps (Active Pins)
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

// ──────────────────────────────────────────────────────────────
// Leaflet Hex Grid Map (for H3 Hotspots mode)
// ──────────────────────────────────────────────────────────────
interface LeafletHexMapProps {
  hexCells: EnrichedHexCell[];
  selectedHex: EnrichedHexCell | null;
  onSelectHex: (hex: EnrichedHexCell | null) => void;
}

function LeafletHexMap({ hexCells, selectedHex, onSelectHex }: LeafletHexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonsRef = useRef<L.Polygon[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    const map = L.map(containerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Deferred sizing to avoid layout race
    setTimeout(() => map.invalidateSize({ animate: false }), 100);
    setTimeout(() => map.invalidateSize({ animate: false }), 500);

    return () => {
      map.remove();
      mapRef.current = null;
      initRef.current = false;
      polygonsRef.current = [];
    };
  }, []);

  // Render hex polygons whenever hexCells changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous polygons
    polygonsRef.current.forEach(p => p.remove());
    polygonsRef.current = [];

    hexCells.forEach(hex => {
      const positions: [number, number][] = hex.boundary.map(p => [p.lat, p.lng]);
      const baseColor = ZONE_COLORS[hex.zone] || '#2563EB';

      // Issue density drives opacity: more issues → more opaque
      const hasIssues = hex.issueCount > 0;
      const fillOpacity = hasIssues
        ? Math.min(0.7, 0.2 + hex.issueCount * 0.08)
        : 0.15;
      const strokeWeight = hasIssues ? (hex.issueCount > 3 ? 2.5 : 1.8) : 0.8;

      // If critical issues, override border to red
      const strokeColor = hex.criticalCount > 0 ? '#ef4444' : baseColor;

      const polygon = L.polygon(positions, {
        color: strokeColor,
        weight: strokeWeight,
        fillColor: baseColor,
        fillOpacity,
        opacity: 0.85,
      }).addTo(map);

      // Tooltip
      const issueLabel = hex.issueCount === 0 ? 'No issues' : `${hex.issueCount} issue${hex.issueCount > 1 ? 's' : ''}`;
      const critLabel = hex.criticalCount > 0 ? `<div style="color: #ef4444; font-weight: 600; font-size: 12px;">⚠ ${hex.criticalCount} critical</div>` : '';
      const catLabel = hex.topCategory ? `<div style="color: #64748b; font-size: 12px;">Top: <span style="font-weight: 600; text-transform: capitalize;">${hex.topCategory.replace('_', ' ')}</span></div>` : '';

      const tooltipHtml = `
        <div style="min-width: 180px; font-family: system-ui, sans-serif;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #0f172a;">
            ${hex.nearestArea}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 3px; background: ${baseColor}; display: inline-block;"></span>
            <span style="color: #64748b; font-size: 12px; text-transform: capitalize;">${hex.zone}</span>
          </div>
          <div style="color: #0f172a; font-size: 13px; font-weight: 600; margin-bottom: 2px;">
            📋 ${issueLabel}
          </div>
          ${critLabel}
          ${catLabel}
          <div style="color: #94a3b8; font-size: 10px; margin-top: 6px; font-family: monospace;">
            ${hex.h3Index.slice(0, 15)}…
          </div>
        </div>
      `;

      polygon.bindTooltip(tooltipHtml, {
        className: 'hex-tooltip',
        sticky: true,
        direction: 'top',
        offset: [0, -10],
      });

      polygon.on('click', () => onSelectHex(hex));

      polygon.on('mouseover', () => {
        polygon.setStyle({ fillOpacity: fillOpacity + 0.2, weight: strokeWeight + 1 });
      });
      polygon.on('mouseout', () => {
        polygon.setStyle({ fillOpacity, weight: strokeWeight });
      });

      polygonsRef.current.push(polygon);
    });
  }, [hexCells, onSelectHex]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// Main CivicMap Component
// ──────────────────────────────────────────────────────────────
export default function CivicMap({ issues, selectedIssue, onSelectIssue, selectedCategory }: CivicMapProps) {
  const [viewMode, setViewMode] = useState<'pins' | 'hex'>('pins');
  const [hexGridData, setHexGridData] = useState<HexGridData | null>(null);
  const [selectedHex, setSelectedHex] = useState<EnrichedHexCell | null>(null);
  const [hexLoading, setHexLoading] = useState(false);

  // Filter issues based on active category
  const filteredIssues = issues.filter(issue => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    return true;
  });

  // Fetch hex grid data on first hex mode access
  useEffect(() => {
    if (viewMode === 'hex' && !hexGridData && !hexLoading) {
      setHexLoading(true);
      fetch('/bangalore-hex-grid.json')
        .then(r => r.json())
        .then((data: HexGridData) => {
          setHexGridData(data);
          setHexLoading(false);
        })
        .catch(err => {
          console.error('Failed to load hex grid:', err);
          setHexLoading(false);
        });
    }
  }, [viewMode, hexGridData, hexLoading]);

  // Enrich hex cells with issue data
  const enrichedHexCells = useMemo(() => {
    if (!hexGridData) return [];

    // Build a map of h3Index → issues for fast lookup
    // We assign each issue to a hex cell at the same H3 resolution as the dataset (res 8)
    const issuesByCell: Record<string, Issue[]> = {};
    filteredIssues.forEach(issue => {
      const cell = latLngToCell(issue.location.lat, issue.location.lng, hexGridData.meta.h3Resolution);
      if (!issuesByCell[cell]) issuesByCell[cell] = [];
      issuesByCell[cell].push(issue);
    });

    return hexGridData.grid.map((raw): EnrichedHexCell => {
      const cellIssues = issuesByCell[raw.h3Index] || [];
      const criticalCount = cellIssues.filter(i => i.severity >= 4).length;

      // Find top category
      let topCategory: string | null = null;
      if (cellIssues.length > 0) {
        const catCounts: Record<string, number> = {};
        cellIssues.forEach(i => {
          catCounts[i.category] = (catCounts[i.category] || 0) + 1;
        });
        topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];
      }

      const severityAvg = cellIssues.length > 0
        ? cellIssues.reduce((s, i) => s + i.severity, 0) / cellIssues.length
        : 0;

      return {
        ...raw,
        issueCount: cellIssues.length,
        criticalCount,
        topCategory,
        severityAvg,
      };
    });
  }, [hexGridData, filteredIssues]);

  const handleSelectHex = useCallback((hex: EnrichedHexCell | null) => {
    setSelectedHex(hex);
  }, []);

  // Zone stats for hex mode header
  const zoneStats = useMemo(() => {
    if (!hexGridData) return null;
    const counts = hexGridData.meta.zoneCounts;
    const total = hexGridData.meta.totalCells;
    return { counts, total };
  }, [hexGridData]);

  const issuesInHexCells = useMemo(() => {
    return enrichedHexCells.filter(h => h.issueCount > 0).length;
  }, [enrichedHexCells]);

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

        {/* View Mode Switcher — only 2 modes now */}
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
            {hexGridData && (
              <span className="ml-1 text-[10px] text-slate-400 font-mono">({hexGridData.meta.totalCells})</span>
            )}
          </button>
        </div>
      </div>

      {/* Map Body Viewports */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden min-h-[400px]" id="urbaneye-map-viewport">

        {/* ── ACTIVE PINS MODE: Google Maps ── */}
        {viewMode === 'pins' && (
          <div className="absolute inset-0 w-full h-full">
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

        {/* ── HEX HOTSPOTS MODE: Leaflet + Full Bangalore Grid ── */}
        {viewMode === 'hex' && (
          <>
            {hexLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-[3px] border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  <span className="text-slate-400 text-sm font-medium">Loading Bangalore Hex Grid…</span>
                  <span className="text-slate-300 text-xs font-mono">1,519 H3 cells at resolution 8</span>
                </div>
              </div>
            ) : enrichedHexCells.length > 0 ? (
              <LeafletHexMap
                hexCells={enrichedHexCells}
                selectedHex={selectedHex}
                onSelectHex={handleSelectHex}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <span className="text-slate-400 text-sm">Failed to load hex grid data</span>
              </div>
            )}

            {/* Zone stats bar */}
            {zoneStats && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-2.5 text-[10px] text-slate-700 shadow-md font-bold font-mono z-[500]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ZONE_COLORS.residential }}></span>
                  Residential ({zoneStats.counts.residential})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ZONE_COLORS.workplace }}></span>
                  Workplace ({zoneStats.counts.workplace})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ZONE_COLORS.marketplace }}></span>
                  Marketplace ({zoneStats.counts.marketplace})
                </div>
                <div className="border-l border-slate-200 pl-2 flex items-center gap-1">
                  📊 {issuesInHexCells} cells with issues
                </div>
              </div>
            )}

            {/* Selected hex cell detail panel */}
            {selectedHex && (
              <div className="absolute bottom-4 right-4 w-80 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl p-5 z-[1000] shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-base">{selectedHex.nearestArea}</h4>
                  <button
                    onClick={() => setSelectedHex(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Zone Type</span>
                    <span className="capitalize text-slate-800 font-medium bg-slate-50 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm" style={{ background: ZONE_COLORS[selectedHex.zone] }}></span>
                      {selectedHex.zone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Reported Issues</span>
                    <span className={`font-bold font-mono text-xs px-2.5 py-0.5 rounded-full ${
                      selectedHex.issueCount > 3 ? 'bg-red-50 text-red-600' :
                      selectedHex.issueCount > 0 ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {selectedHex.issueCount}
                    </span>
                  </div>
                  {selectedHex.criticalCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Critical (Sev ≥4)</span>
                      <span className="font-bold font-mono text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-600">
                        ⚠ {selectedHex.criticalCount}
                      </span>
                    </div>
                  )}
                  {selectedHex.topCategory && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Top Category</span>
                      <span className="capitalize text-slate-700 font-medium text-xs bg-slate-50 px-2.5 py-0.5 rounded-full">
                        {selectedHex.topCategory.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {selectedHex.severityAvg > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Avg Severity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(selectedHex.severityAvg / 5) * 100}%`,
                              background: selectedHex.severityAvg > 3.5 ? '#DC2626' : selectedHex.severityAvg > 2 ? '#D97706' : '#059669'
                            }}
                          />
                        </div>
                        <span className="text-slate-800 font-mono text-xs font-bold">{selectedHex.severityAvg.toFixed(1)}/5</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                    <span className="text-slate-400 text-xs">H3 Index</span>
                    <span className="text-slate-400 font-mono text-[10px]">{selectedHex.h3Index.slice(0, 15)}…</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Map Key panel (shown for pins mode) */}
        {viewMode === 'pins' && (
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
        )}
      </div>
    </div>
  );
}

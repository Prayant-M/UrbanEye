import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Car,
  CheckCircle,
  RotateCcw,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Issue } from "../types";

interface CityViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  setTab: (tab: string) => void;
}

interface WardBlock {
  ward: string;
  short: string;
  total: number;
  critical: number;
  active: number;
  resolved: number;
  firstIssue: Issue;
}

// dominant-status colour for a ward tower
function towerHex(b: WardBlock): number {
  if (b.critical > 0) return 0xf43f5e; // red — critical
  if (b.active > 0) return 0xf59e0b; // amber — active
  if (b.resolved > 0 && b.total === b.resolved) return 0x10b981; // green — clear
  return 0x6366f1; // indigo — reported
}

const FILLER_COLORS = [0x334155, 0x3b485e, 0x2d3a4f, 0x415066];

export default function CityView({
  issues,
  onSelectIssue,
  setTab,
}: CityViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const azimuthRef = useRef(0.7);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const selectRef = useRef<(w: string | null) => void>(() => {});

  const blocks = useMemo<WardBlock[]>(() => {
    const map: Record<string, WardBlock> = {};
    issues.forEach((i) => {
      const ward = i.location.ward;
      if (!map[ward]) {
        map[ward] = {
          ward,
          short: ward.split(" - ")[1] || ward,
          total: 0,
          critical: 0,
          active: 0,
          resolved: 0,
          firstIssue: i,
        };
      }
      const b = map[ward];
      b.total += 1;
      if (i.severity >= 4 && i.status !== "resolved") b.critical += 1;
      if (i.status === "resolved") b.resolved += 1;
      else if (i.status === "in_progress" || i.status === "acknowledged")
        b.active += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [issues]);

  const totals = useMemo(
    () => ({
      hazards: issues.length,
      critical: blocks.reduce((s, b) => s + b.critical, 0),
      resolved: issues.filter((i) => i.status === "resolved").length,
      wards: blocks.length,
    }),
    [issues, blocks],
  );

  const selected = blocks.find((b) => b.ward === selectedWard) || null;

  // signature so the scene only rebuilds when ward data actually changes
  const sig = useMemo(
    () =>
      blocks
        .map(
          (b) =>
            `${b.short}:${b.total}:${b.critical}:${b.active}:${b.resolved}`,
        )
        .join("|"),
    [blocks],
  );

  useEffect(() => {
    selectRef.current = setSelectedWard;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.Fog(0x0b1220, 360, 760);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 2000);
    let radius = 340,
      polar = 0.92;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // lighting
    scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x10151f, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(160, 260, 120);
    scene.add(sun);

    // ground + road grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshStandardMaterial({ color: 0x131c2b, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const grid = new THREE.GridHelper(620, 22, 0x2b3950, 0x1d2838);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    scene.add(grid);

    const STEP = 56;
    const EXT = 196;
    const disposables: {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
    }[] = [];

    // build cells, sort by distance to centre
    const cells: { x: number; z: number }[] = [];
    for (let x = -EXT; x <= EXT; x += STEP) {
      for (let z = -EXT; z <= EXT; z += STEP) cells.push({ x, z });
    }
    cells.sort((a, b) => a.x * a.x + a.z * a.z - (b.x * b.x + b.z * b.z));

    const towerCells = cells.slice(0, blocks.length);
    const fillerCells = cells.slice(blocks.length);

    const towerMeshes: { mesh: THREE.Mesh; ward: string }[] = [];
    const beacons: THREE.Mesh[] = [];

    // ward towers
    blocks.forEach((b, i) => {
      const cell = towerCells[i] || { x: 0, z: 0 };
      const h = 30 + Math.min(b.total, 6) * 20;
      const geo = new THREE.BoxGeometry(30, h, 30);
      const mat = new THREE.MeshStandardMaterial({
        color: towerHex(b),
        emissive: towerHex(b),
        emissiveIntensity: 0.28,
        roughness: 0.5,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cell.x, h / 2, cell.z);
      scene.add(mesh);
      towerMeshes.push({ mesh, ward: b.ward });
      disposables.push({ geometry: geo, material: mat });

      if (b.critical > 0) {
        const bgeo = new THREE.SphereGeometry(5, 12, 12);
        const bmat = new THREE.MeshBasicMaterial({ color: 0xff5a78 });
        const beacon = new THREE.Mesh(bgeo, bmat);
        beacon.position.set(cell.x, h + 16, cell.z);
        scene.add(beacon);
        const light = new THREE.PointLight(0xff5a78, 1.4, 120);
        light.position.copy(beacon.position);
        scene.add(light);
        beacons.push(beacon);
        disposables.push({ geometry: bgeo, material: bmat });
      }
    });

    // filler skyline
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    fillerCells.forEach((cell) => {
      if (rand() < 0.18) return; // gaps
      const w = 14 + rand() * 14;
      const d = 14 + rand() * 14;
      const h = 12 + rand() * 52;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: FILLER_COLORS[Math.floor(rand() * FILLER_COLORS.length)],
        roughness: 0.85,
        emissive: 0x0a1018,
        emissiveIntensity: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        cell.x + (rand() - 0.5) * 10,
        h / 2,
        cell.z + (rand() - 0.5) * 10,
      );
      scene.add(mesh);
      disposables.push({ geometry: geo, material: mat });
    });

    // moving vehicles on the road grid (the live simulation)
    const ROADS = [-168, -112, -56, 0, 56, 112, 168];
    const carGeo = new THREE.BoxGeometry(7, 4, 12);
    const vehicles: {
      mesh: THREE.Mesh;
      axis: "x" | "z";
      lane: number;
      pos: number;
      dir: number;
      speed: number;
    }[] = [];
    for (let i = 0; i < 18; i++) {
      const along = i % 2 === 0 ? "x" : "z";
      const lane = ROADS[Math.floor(rand() * ROADS.length)] + 14;
      const dir = rand() > 0.5 ? 1 : -1;
      const color = rand() > 0.5 ? 0x22d3ee : 0xfbbf24;
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
      });
      const mesh = new THREE.Mesh(carGeo, mat);
      mesh.position.y = 3;
      scene.add(mesh);
      vehicles.push({
        mesh,
        axis: along as "x" | "z",
        lane,
        pos: (rand() - 0.5) * 2 * EXT,
        dir,
        speed: 0.5 + rand() * 0.9,
      });
      disposables.push({ geometry: carGeo, material: mat });
    }

    // interaction
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let dragging = false,
      moved = 0,
      px = 0,
      py = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      px = e.clientX;
      py = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - px,
        dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      azimuthRef.current -= dx * 0.005;
      polar = Math.max(0.42, Math.min(1.2, polar - dy * 0.004));
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (dragging && moved < 6) {
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(
          towerMeshes.map((t) => t.mesh),
        )[0];
        if (hit) {
          const t = towerMeshes.find((tm) => tm.mesh === hit.object);
          if (t) selectRef.current(t.ward);
        }
      }
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(190, Math.min(540, radius + e.deltaY * 0.4));
    };

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!dragging) azimuthRef.current += 0.0011;

      const az = azimuthRef.current;
      camera.position.set(
        radius * Math.sin(polar) * Math.cos(az),
        radius * Math.cos(polar),
        radius * Math.sin(polar) * Math.sin(az),
      );
      camera.lookAt(0, 14, 0);

      vehicles.forEach((v) => {
        v.pos += v.dir * v.speed;
        if (v.pos > EXT) v.pos = -EXT;
        if (v.pos < -EXT) v.pos = EXT;
        if (v.axis === "x") {
          v.mesh.position.x = v.pos;
          v.mesh.position.z = v.lane;
          v.mesh.rotation.y = 0;
        } else {
          v.mesh.position.z = v.pos;
          v.mesh.position.x = v.lane;
          v.mesh.rotation.y = Math.PI / 2;
        }
      });

      beacons.forEach((b, i) => {
        const s = 1 + Math.sin(t * 3 + i) * 0.35;
        b.scale.setScalar(s);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      disposables.forEach((d) => {
        d.geometry.dispose();
        d.material.dispose();
      });
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, [sig]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Your City in 3D — Live Simulation
          </h2>
          <p className="text-xs text-slate-500">
            Towers are wards (taller = more open hazards). Red beacons =
            critical. Cars show live activity.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => (azimuthRef.current -= 0.5)}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => (azimuthRef.current += 0.5)}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Hazards",
            value: totals.hazards,
            icon: <Activity className="h-4 w-4 text-indigo-600" />,
            ring: "border-indigo-100 bg-indigo-50",
          },
          {
            label: "Critical",
            value: totals.critical,
            icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
            ring: "border-rose-100 bg-rose-50",
          },
          {
            label: "Resolved",
            value: totals.resolved,
            icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
            ring: "border-emerald-100 bg-emerald-50",
          },
          {
            label: "Wards",
            value: totals.wards,
            icon: <Building2 className="h-4 w-4 text-cyan-600" />,
            ring: "border-cyan-100 bg-cyan-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs"
          >
            <div
              className={`h-7 w-7 rounded-lg border flex items-center justify-center mb-1.5 ${s.ring}`}
            >
              {s.icon}
            </div>
            <div className="text-xl font-black text-slate-900 font-mono leading-none">
              {s.value}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* 3D Scene */}
      <div className="relative h-[460px] w-full rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-slate-950">
        <div ref={mountRef} className="absolute inset-0" />

        {/* legend */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 rounded-xl bg-white/95 border border-slate-200 p-2 text-[10px] font-bold font-mono text-slate-700 shadow-md pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            Active
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
            Reported
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Clear
          </span>
        </div>

        {/* selected ward panel */}
        {selected && (
          <div className="absolute bottom-4 right-4 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900">
                {selected.short}
              </h4>
              <button
                onClick={() => setSelectedWard(null)}
                className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center rounded-lg bg-slate-50 border border-slate-100 py-1.5">
                <div className="text-base font-black text-slate-800 font-mono">
                  {selected.total}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">
                  Total
                </div>
              </div>
              <div className="text-center rounded-lg bg-rose-50 border border-rose-100 py-1.5">
                <div className="text-base font-black text-rose-600 font-mono">
                  {selected.critical}
                </div>
                <div className="text-[9px] text-rose-400 font-bold uppercase">
                  Critical
                </div>
              </div>
              <div className="text-center rounded-lg bg-emerald-50 border border-emerald-100 py-1.5">
                <div className="text-base font-black text-emerald-600 font-mono">
                  {selected.resolved}
                </div>
                <div className="text-[9px] text-emerald-400 font-bold uppercase">
                  Fixed
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectIssue(selected.firstIssue);
                setTab("dashboard");
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold py-2 hover:bg-emerald-500 transition cursor-pointer"
            >
              View hazards on map <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* tip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[10px] text-white/60 font-mono pointer-events-none">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            Drag to orbit · scroll to zoom · tap a tower
          </span>
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3 text-cyan-400" />
            live traffic
          </span>
        </div>
      </div>
    </div>
  );
}

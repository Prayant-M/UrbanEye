import React from 'react';
import { Eye, User, ShieldCheck, ArrowRight, MapPin, Camera, Brain, Activity } from 'lucide-react';

interface LandingProps {
  onSelectRole: (role: 'citizen' | 'officer') => void;
}

export default function Landing({ onSelectRole }: LandingProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.14)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Brand */}
        <header className="flex items-center gap-2.5 px-6 py-5 sm:px-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Eye className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Urban<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Eye</span>
          </span>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gemini-powered Civic AI Sentinel
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl leading-tight">
            Spot it. Report it.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Watch your city get fixed.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-400">
            Report hazards, verify your neighbours, and let AI route every issue to the right authority — in real time.
          </p>

          {/* Role cards */}
          <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            {/* Citizen */}
            <button
              onClick={() => onSelectRole('citizen')}
              className="group relative flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left backdrop-blur-sm transition-all hover:border-emerald-400/50 hover:bg-emerald-500/[0.07] cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">I'm a Citizen</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Upload photos of hazards, explore the 3D city, verify reports & climb the leaderboard.
                </p>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-300">
                <span className="rounded-full bg-white/5 px-2 py-0.5 flex items-center gap-1"><Camera className="h-3 w-3" />Report</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />3D City</span>
              </div>
              <span className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-300 group-hover:gap-2 transition-all">
                Enter as Citizen <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            {/* Officer */}
            <button
              onClick={() => onSelectRole('officer')}
              className="group relative flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left backdrop-blur-sm transition-all hover:border-amber-400/50 hover:bg-amber-500/[0.07] cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">I'm an Officer / Admin</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Triage the AI-prioritised queue, dispatch crews, resolve cases & read predictive analytics.
                </p>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-300">
                <span className="rounded-full bg-white/5 px-2 py-0.5 flex items-center gap-1"><Activity className="h-3 w-3" />Triage</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 flex items-center gap-1"><Brain className="h-3 w-3" />Predictions</span>
              </div>
              <span className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-300 group-hover:gap-2 transition-all">
                Enter as Officer <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          <p className="mt-8 text-[11px] text-slate-500 font-mono">
            Demo profiles — switch roles anytime from the top bar.
          </p>
        </main>
      </div>
    </div>
  );
}

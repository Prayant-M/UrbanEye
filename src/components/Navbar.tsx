import React from 'react';
import { Eye, ShieldAlert, User, ShieldCheck, HelpCircle, Activity, Brain } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  userProfile: UserProfile | null;
  toggleRole: () => void;
  onOpenAssistant: () => void;
}

export default function Navbar({ currentTab, setTab, userProfile, toggleRole, onOpenAssistant }: NavbarProps) {
  const isOfficer = userProfile?.role === 'officer';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2" id="navbar-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Eye className="h-5.5 w-5.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              Urban<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Eye</span>
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-emerald-400 tracking-wider uppercase font-medium">
              Civic AI Sentinel
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
          <button
            id="nav-tab-dashboard"
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Activity className="h-4 w-4" />
            Dashboard Map
          </button>

          <button
            id="nav-tab-report"
            onClick={() => setTab('report')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentTab === 'report'
                ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Report Hazard
          </button>

          <button
            id="nav-tab-impact"
            onClick={() => setTab('impact')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentTab === 'impact'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <User className="h-4 w-4" />
            Impact & Leaderboard
          </button>

          <button
            id="nav-tab-predictions"
            onClick={() => setTab('predictions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentTab === 'predictions'
                ? 'bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Brain className="h-4 w-4" />
            AI Predictions
          </button>
        </nav>

        {/* Controls & Role Swapper */}
        <div className="flex items-center gap-3">
          {/* AI Chat button */}
          <button
            id="navbar-assistant-btn"
            onClick={onOpenAssistant}
            className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Civic AI Chat
          </button>

          {/* Role Swapper */}
          <button
            id="navbar-role-toggle"
            onClick={toggleRole}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-300 border shadow-lg ${
              isOfficer
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            {isOfficer ? (
              <>
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                Officer Dashboard
              </>
            ) : (
              <>
                <User className="h-4 w-4 stroke-[2.5]" />
                Citizen Portal
              </>
            )}
          </button>

          {/* User Score Badge */}
          {userProfile && !isOfficer && (
            <div id="navbar-points-badge" className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-400 font-medium">Points</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {userProfile.points} XP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-900 bg-slate-950 p-2">
        <button
          onClick={() => setTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${
            currentTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Activity className="h-4.5 w-4.5" />
          Map
        </button>
        <button
          onClick={() => setTab('report')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${
            currentTab === 'report' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldAlert className="h-4.5 w-4.5" />
          Report
        </button>
        <button
          onClick={() => setTab('impact')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${
            currentTab === 'impact' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="h-4.5 w-4.5" />
          Impact
        </button>
        <button
          onClick={() => setTab('predictions')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${
            currentTab === 'predictions' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Brain className="h-4.5 w-4.5" />
          AI Forecast
        </button>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Eye, ShieldAlert, User, ShieldCheck, Activity, Brain, ChevronDown, Check, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLoginProfile: (profileId: string) => void;
  onOpenAssistant: () => void;
}

export default function Navbar({
  currentTab,
  setTab,
  userProfile,
  onLoginProfile,
  onOpenAssistant
}: NavbarProps) {
  const isOfficer = userProfile?.role === 'officer';
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2" id="navbar-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 shadow-md shadow-emerald-600/10">
            <Eye className="h-5.5 w-5.5 text-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
              Urban<span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Eye</span>
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-emerald-600 tracking-wider uppercase font-bold">
              Civic AI Sentinel
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            id="nav-tab-dashboard"
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              currentTab === 'dashboard'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="h-4 w-4 text-emerald-600" />
            Dashboard Map
          </button>

          <button
            id="nav-tab-report"
            onClick={() => setTab('report')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              currentTab === 'report'
                ? 'bg-emerald-50 text-slate-950 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            Report Hazard
          </button>

          <button
            id="nav-tab-impact"
            onClick={() => setTab('impact')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              currentTab === 'impact'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4 text-indigo-500" />
            Impact & Leaderboard
          </button>

          <button
            id="nav-tab-predictions"
            onClick={() => setTab('predictions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              currentTab === 'predictions'
                ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Brain className="h-4 w-4 text-cyan-600" />
            AI Predictions
          </button>
        </nav>

        {/* Controls & Active Session Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* AI Chat button */}
          <button
            id="navbar-assistant-btn"
            onClick={onOpenAssistant}
            className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Civic AI Chat
          </button>

          {/* Profile Switcher Login Dropdown */}
          <div className="relative">
            <button
              id="navbar-profile-dropdown-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 border shadow-xs cursor-pointer ${
                isOfficer
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              {isOfficer ? (
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <User className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span className="max-w-[120px] truncate">
                {userProfile ? userProfile.name : 'Choose Profile'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none z-20 animate-in fade-in-50 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Select Profile Login
                  </div>
                  
                  {/* Option 1: User (Citizen) */}
                  <button
                    onClick={() => {
                      onLoginProfile('user-007');
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      userProfile?.id === 'user-007'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">
                        AS
                      </div>
                      <div>
                        <div className="font-semibold">Ananya Sharma</div>
                        <div className="text-[9px] text-slate-400 font-mono">User / Citizen</div>
                      </div>
                    </div>
                    {userProfile?.id === 'user-007' && (
                      <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                    )}
                  </button>

                  {/* Option 2: Admin (Officer) */}
                  <button
                    onClick={() => {
                      onLoginProfile('admin-101');
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      userProfile?.id === 'admin-101'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold">
                        RK
                      </div>
                      <div>
                        <div className="font-semibold">Officer Ramesh</div>
                        <div className="text-[9px] text-slate-400 font-mono">Admin / Officer</div>
                      </div>
                    </div>
                    {userProfile?.id === 'admin-101' && (
                      <Check className="h-4 w-4 text-amber-600 stroke-[3]" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Score Badge */}
          {userProfile && !isOfficer && (
            <div id="navbar-points-badge" className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Points</span>
              <span className="text-xs font-black text-emerald-600 font-mono">
                {userProfile.points} XP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 bg-white p-2">
        <button
          onClick={() => setTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="h-4.5 w-4.5" />
          Map
        </button>
        <button
          onClick={() => setTab('report')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            currentTab === 'report' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="h-4.5 w-4.5" />
          Report
        </button>
        <button
          onClick={() => setTab('impact')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            currentTab === 'impact' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="h-4.5 w-4.5" />
          Impact
        </button>
        <button
          onClick={() => setTab('predictions')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
            currentTab === 'predictions' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="h-4.5 w-4.5" />
          AI Forecast
        </button>
      </div>
    </header>
  );
}

import React from 'react';
import { Eye, ShieldCheck, User, Activity, Brain, Building2, Trophy, UserCircle, Camera, LogOut, MessageSquare, ClipboardCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  role: 'citizen' | 'officer';
  currentTab: string;
  setTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onExit: () => void;
  onOpenAssistant: () => void;
}

interface TabDef { value: string; label: string; short: string; icon: React.ReactNode; }

const CITIZEN_TABS: TabDef[] = [
  { value: 'dashboard', label: 'Live Map', short: 'Map', icon: <Activity className="h-4 w-4 text-cyan-600" /> },
  { value: 'report', label: 'Report', short: 'Report', icon: <Camera className="h-4 w-4 text-rose-500" /> },
  { value: 'impact', label: 'Leaderboard', short: 'Ranks', icon: <Trophy className="h-4 w-4 text-amber-500" /> },
  { value: 'profile', label: 'Profile', short: 'Me', icon: <UserCircle className="h-4 w-4 text-emerald-600" /> },
  { value: 'city', label: '3D City', short: 'City', icon: <Building2 className="h-4 w-4 text-emerald-600" /> },
];

const OFFICER_TABS: TabDef[] = [
  { value: 'dashboard', label: 'Triage', short: 'Triage', icon: <Activity className="h-4 w-4 text-amber-600" /> },
  { value: 'review', label: 'AI Review', short: 'Review', icon: <ClipboardCheck className="h-4 w-4 text-rose-500" /> },
  { value: 'predictions', label: 'Predictions', short: 'AI', icon: <Brain className="h-4 w-4 text-cyan-600" /> },
  { value: 'impact', label: 'Analytics', short: 'Stats', icon: <Trophy className="h-4 w-4 text-indigo-500" /> },
  { value: 'profile', label: 'Profile', short: 'Me', icon: <UserCircle className="h-4 w-4 text-amber-600" /> },
];

export default function Navbar({ role, currentTab, setTab, userProfile, onExit, onOpenAssistant }: NavbarProps) {
  const isOfficer = role === 'officer';
  const tabs = isOfficer ? OFFICER_TABS : CITIZEN_TABS;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 shadow-md shadow-emerald-600/10">
            <Eye className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Urban<span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Eye</span>
          </span>
          <span className={`hidden lg:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${isOfficer ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {isOfficer ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {isOfficer ? 'Officer' : 'Citizen'}
          </span>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          {tabs.map((tab) => {
            const active = currentTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  active ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAssistant}
            title="Civic AI Chat"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>

          {userProfile && !isOfficer && (
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Points</span>
              <span className="text-xs font-black text-emerald-600 font-mono">{userProfile.points} XP</span>
            </div>
          )}

          <div className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${isOfficer ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {(userProfile?.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>

          <button
            onClick={onExit}
            title="Switch role"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Switch</span>
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 bg-white px-1 py-1.5">
        {tabs.map((tab) => {
          const active = currentTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setTab(tab.value)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all px-2 ${
                active ? (isOfficer ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.short}
            </button>
          );
        })}
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  User,
  Award,
  Flame,
  Star,
  TrendingUp,
  CheckCircle,
  Clock,
  Eye,
  Leaf,
  Zap,
  FileText,
  Activity,
  BarChart3,
  Settings,
  ChevronRight,
  Sparkles,
  Target,
  AlertTriangle,
  Building2,
  BadgeCheck,
  Mail,
  Calendar,
} from 'lucide-react';
import { Issue, UserProfile } from '../types';

interface ProfileSectionProps {
  userProfile: UserProfile | null;
  issues: Issue[];
  onSwitchTab: (tab: string) => void;
}

// Badge icon mapper
const BADGE_ICONS: Record<string, React.ReactNode> = {
  Eye: <Eye className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Leaf: <Leaf className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
};

// XP Level thresholds
const LEVELS = [
  { level: 1, name: 'Rookie Watcher', minXP: 0 },
  { level: 2, name: 'Street Scout', minXP: 100 },
  { level: 3, name: 'Ward Sentinel', minXP: 250 },
  { level: 4, name: 'Civic Guardian', minXP: 400 },
  { level: 5, name: 'City Protector', minXP: 700 },
  { level: 6, name: 'Urban Champion', minXP: 1000 },
  { level: 7, name: 'Civic Legend', minXP: 1500 },
];

function getUserLevel(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  const progress = next.minXP > current.minXP
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100;
  return { current, next, progress: Math.min(100, progress) };
}

// ──────────────────────────────────────────────────────
// CITIZEN PROFILE SECTION
// ──────────────────────────────────────────────────────
function CitizenProfile({ profile, issues, onSwitchTab }: { profile: UserProfile; issues: Issue[]; onSwitchTab: (tab: string) => void }) {
  const level = getUserLevel(profile.points);

  // Build activity timeline from issues
  const userActivity = issues
    .filter(i => i.timeline.some(t => t.actor.toLowerCase().includes('citizen') || t.actor.toLowerCase().includes('ananya')))
    .slice(0, 5)
    .map(issue => ({
      id: issue.id,
      title: issue.title,
      category: issue.category,
      status: issue.status,
      date: issue.createdAt,
      ward: issue.location.ward,
    }));

  return (
    <div className="space-y-6">
      {/* Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 shadow-lg">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl border-3 border-white/30 p-1 overflow-hidden bg-white/10 backdrop-blur-sm shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
                  alt={profile.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg border border-amber-300">
                <Flame className="h-3 w-3 fill-amber-900 stroke-none" />
                {profile.streak}
              </span>
            </div>

            {/* Identity Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-white tracking-tight">{profile.name}</h2>
                <span className="text-[10px] font-mono bg-white/15 text-white/90 px-2.5 py-0.5 rounded-full border border-white/20 font-bold backdrop-blur-sm">
                  <User className="h-3 w-3 inline mr-1 -mt-0.5" />
                  Citizen
                </span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-xs font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined Jun 2026
                </span>
              </div>

              {/* Level progress */}
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white/80">
                    Level {level.current.level} — {level.current.name}
                  </span>
                  <span className="text-[10px] font-mono text-white/50">
                    {profile.points} / {level.next.minXP} XP
                  </span>
                </div>
                <div className="h-2.5 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${level.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-1 font-mono">
                  {level.next.minXP - profile.points > 0
                    ? `${level.next.minXP - profile.points} XP to reach ${level.next.name}`
                    : 'Maximum level achieved!'}
                </p>
              </div>
            </div>

            {/* XP Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-center min-w-[140px] shadow-xl">
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Total XP</div>
              <div className="text-3xl font-black text-white font-mono leading-none">{profile.points}</div>
              <div className="text-[10px] text-emerald-200 font-bold mt-1">
                <Sparkles className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                Top 15% of Citizens
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Reports</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{profile.reportsCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Issues reported</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-cyan-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-50 flex items-center justify-center border border-cyan-100 group-hover:bg-cyan-100 transition-colors">
              <CheckCircle className="h-4 w-4 text-cyan-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Verified</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{profile.verificationsCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Community checks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <Flame className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Streak</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{profile.streak}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Consecutive days</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Badges</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{profile.badges.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Earned total</p>
        </div>
      </div>

      {/* Two-column: Badges + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Badges Gallery */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                Earned Badges
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Civic Achievement Gallery
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {profile.badges.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No badges earned yet. Start reporting!</p>
              </div>
            ) : (
              profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border border-amber-100/60 hover:border-amber-200 transition-all duration-200 group"
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-200/50 group-hover:scale-105 transition-transform shrink-0">
                    {BADGE_ICONS[badge.icon] || <Star className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">{badge.name}</div>
                    <div className="text-[10px] text-slate-500 leading-snug mt-0.5">{badge.description}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Earned {new Date(badge.earnedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-emerald-600" />
                Recent Activity
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Your Latest Civic Contributions
              </p>
            </div>
            <button
              onClick={() => onSwitchTab('dashboard')}
              className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {userActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No activity yet. Report a hazard to get started!</p>
              <button
                onClick={() => onSwitchTab('report')}
                className="mt-3 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Report Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userActivity.map((act, idx) => {
                const statusColors: Record<string, string> = {
                  pending_verification: 'bg-amber-100 text-amber-700 border-amber-200',
                  verified: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                  acknowledged: 'bg-blue-100 text-blue-700 border-blue-200',
                  in_progress: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
                };
                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-100/50 hover:border-slate-200 transition-all duration-200"
                  >
                    <div className="mt-0.5 relative">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      {idx < userActivity.length - 1 && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 bg-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{act.title}</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${statusColors[act.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {act.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">{act.ward}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(act.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onSwitchTab('report')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Report Hazard</span>
              <span className="text-[10px] text-slate-500">Submit a new civic issue</span>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('dashboard')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200/60 hover:border-cyan-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">View Live Map</span>
              <span className="text-[10px] text-slate-500">Monitor active hazards</span>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('impact')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/60 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">View Leaderboard</span>
              <span className="text-[10px] text-slate-500">See community rankings</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// ADMIN / OFFICER PROFILE SECTION
// ──────────────────────────────────────────────────────
function AdminProfile({ profile, issues, onSwitchTab }: { profile: UserProfile; issues: Issue[]; onSwitchTab: (tab: string) => void }) {
  const totalAssigned = issues.filter(i => i.assignedOfficer?.toLowerCase().includes('ramesh')).length;
  const resolvedByOfficer = issues.filter(
    i => i.status === 'resolved' && i.timeline.some(t => t.actor.toLowerCase().includes('ramesh') || t.actor.toLowerCase().includes('officer'))
  ).length;
  const activeInProgress = issues.filter(i => i.status === 'in_progress' || i.status === 'acknowledged').length;
  const pendingCount = issues.filter(i => i.status === 'pending_verification' || i.status === 'verified').length;
  const slaRate = totalAssigned > 0 ? Math.round((resolvedByOfficer / Math.max(totalAssigned, 1)) * 100) : 95;

  // Department breakdown
  const deptCounts: Record<string, number> = {};
  issues.forEach(issue => {
    if (issue.assignedDepartment) {
      const dept = issue.assignedDepartment;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    }
  });
  const departments = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

  // Recent officer actions from timeline
  const officerActions = issues
    .flatMap(issue =>
      issue.timeline
        .filter(t => t.actor.toLowerCase().includes('officer') || t.actor.toLowerCase().includes('ramesh') || t.actor.toLowerCase().includes('admin'))
        .map(t => ({ ...t, issueTitle: issue.title, issueId: issue.id }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Admin Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-900 opacity-98" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,158,11,0.12)_0%,_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/8 to-transparent rounded-full -translate-y-20 translate-x-20" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl border-3 border-amber-500/30 p-1 overflow-hidden bg-white/5 backdrop-blur-sm shadow-xl">
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-black">
                  RK
                </div>
              </div>
              <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg border border-emerald-400">
                <BadgeCheck className="h-3 w-3" />
                Active
              </span>
            </div>

            {/* Identity */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-white tracking-tight">{profile.name}</h2>
                <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/25 font-bold">
                  <ShieldCheck className="h-3 w-3 inline mr-1 -mt-0.5" />
                  Admin / Officer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-white/40 text-xs font-medium">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {profile.department || 'Public Works Department'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 font-mono">{profile.streak}</span>
                  <span className="text-[10px] text-white/30">day streak</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                  <Star className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300 font-mono">{profile.points}</span>
                  <span className="text-[10px] text-white/30">officer XP</span>
                </div>
              </div>
            </div>

            {/* SLA Badge */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 text-center min-w-[150px] shadow-xl">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">SLA Clearance</div>
              <div className="text-4xl font-black text-emerald-400 font-mono leading-none">{slaRate}%</div>
              <div className="text-[10px] text-emerald-300/60 font-bold mt-1.5">
                <TrendingUp className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                Above Target
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Assigned</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalAssigned || issues.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Total cases</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Resolved</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{resolvedByOfficer || 1}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Cases cleared</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Active</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{activeInProgress}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">In progress</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs group hover:shadow-md hover:border-rose-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100 group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Pending</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{pendingCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting triage</p>
        </div>
      </div>

      {/* Two-column: Department Overview + Officer Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Overview */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="h-4.5 w-4.5 text-amber-600" />
                Department Breakdown
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Cases by assigned authority
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {departments.map(([dept, count], idx) => {
              const colors = ['bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500', 'bg-rose-500'];
              const bgColors = ['bg-emerald-50', 'bg-cyan-50', 'bg-amber-50', 'bg-indigo-50', 'bg-rose-50'];
              const borderColors = ['border-emerald-100', 'border-cyan-100', 'border-amber-100', 'border-indigo-100', 'border-rose-100'];
              const percentage = Math.round((count / issues.length) * 100);

              return (
                <div key={dept} className={`p-3 rounded-xl ${bgColors[idx % 5]} border ${borderColors[idx % 5]}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">{dept}</span>
                    <span className="text-xs font-black text-slate-800 font-mono">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx % 5]} rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Officer Action Log */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-600" />
                Officer Action Log
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Recent administrative interventions
              </p>
            </div>
            <button
              onClick={() => onSwitchTab('dashboard')}
              className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 hover:text-amber-700 transition-colors cursor-pointer"
            >
              Triage Queue <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {officerActions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No officer actions recorded yet in this session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {officerActions.map((action, idx) => {
                const statusIcons: Record<string, React.ReactNode> = {
                  acknowledged: <ShieldCheck className="h-4 w-4 text-blue-600" />,
                  in_progress: <Clock className="h-4 w-4 text-indigo-600" />,
                  resolved: <CheckCircle className="h-4 w-4 text-emerald-600" />,
                  verified: <Eye className="h-4 w-4 text-cyan-600" />,
                };
                return (
                  <div
                    key={`${action.issueId}-${idx}`}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-100/50 transition-all"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                      {statusIcons[action.status] || <Activity className="h-4 w-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{action.issueTitle}</div>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{action.note}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono text-slate-400">{action.actor}</span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {new Date(action.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Officer Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
          Command Center Actions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onSwitchTab('dashboard')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 hover:border-amber-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Triage Queue</span>
              <span className="text-[10px] text-slate-500">Manage open cases</span>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('predictions')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/60 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">AI Predictions</span>
              <span className="text-[10px] text-slate-500">Run diagnostics</span>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('impact')}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Impact Report</span>
              <span className="text-[10px] text-slate-500">City-wide analytics</span>
            </div>
          </button>
        </div>
      </div>

      {/* Officer Badges */}
      {profile.badges.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                Officer Commendations
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Service Recognition Awards
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 min-w-[220px]"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shrink-0">
                  {BADGE_ICONS[badge.icon] || <Award className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{badge.name}</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// MAIN EXPORT — ProfileSection
// ──────────────────────────────────────────────────────
export default function ProfileSection({ userProfile, issues, onSwitchTab }: ProfileSectionProps) {
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <User className="h-12 w-12 mb-3 opacity-30" />
        <h3 className="text-sm font-bold text-slate-600">No Profile Active</h3>
        <p className="text-xs text-slate-400 mt-1">Select a profile from the dropdown to view your dashboard.</p>
      </div>
    );
  }

  return userProfile.role === 'officer' ? (
    <AdminProfile profile={userProfile} issues={issues} onSwitchTab={onSwitchTab} />
  ) : (
    <CitizenProfile profile={userProfile} issues={issues} onSwitchTab={onSwitchTab} />
  );
}

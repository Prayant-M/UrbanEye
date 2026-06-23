import React from 'react';
import {
  Award,
  Users,
  CheckCircle,
  Clock,
  Zap,
  Flame,
  TrendingUp,
  Image,
  Sparkles,
  Search
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Issue, UserProfile } from '../types';

interface CivicImpactProps {
  issues: Issue[];
  userProfile: UserProfile | null;
}

// Sample metrics for Bangalore city-wide analytics
const CITY_STATS = {
  resolvedPercentage: 84,
  avgHoursToResolve: 28.5,
  activeReporters: 1420,
  tonnesGarbageCleared: 45
};

// Recharts sample dataset: Issues reported vs resolved over recent months
const MONTHLY_TRENDS = [
  { name: 'Jan', reported: 45, resolved: 38 },
  { name: 'Feb', reported: 55, resolved: 48 },
  { name: 'Mar', reported: 68, resolved: 52 },
  { name: 'Apr', reported: 75, resolved: 65 },
  { name: 'May', reported: 90, resolved: 82 },
  { name: 'Jun', reported: 110, resolved: 94 }
];

const LEADERBOARD = [
  { name: 'David M.', points: 1250, reports: 14, verifications: 45, badge: 'Civic Gladiator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { name: 'Samantha Rao', points: 980, reports: 11, verifications: 38, badge: 'Pothole Exterminator', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { name: 'Anil K.', points: 840, reports: 9, verifications: 29, badge: 'Ward Watcher', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
  { name: 'Ananya Sharma', points: 420, reports: 4, verifications: 18, badge: 'Eagle Eye', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', isUser: true },
  { name: 'Meera Deshmukh', points: 380, reports: 3, verifications: 15, badge: 'Active Citizen', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150' }
];

export default function CivicImpact({ issues, userProfile }: CivicImpactProps) {
  const resolvedIssues = issues.filter(i => i.status === 'resolved');

  // Group by category for charts
  const categoryCounts = issues.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.keys(categoryCounts).map(key => ({
    name: key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: categoryCounts[key]
  }));

  const COLORS = ['#10b981', '#06b6d4', '#fbbf24', '#f97316', '#6366f1', '#f43f5e'];

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner: User profile XP stats */}
      {userProfile && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-emerald-400 p-0.5 overflow-hidden bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                  alt="Ananya Profile"
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full flex items-center gap-0.5 shadow-md">
                <Flame className="h-3 w-3 fill-slate-950 stroke-none" />
                {userProfile.streak}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{userProfile.name}</h3>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Level 4 Sentinel
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Streak: {userProfile.streak} days consecutive watch | Ward: Koramangala
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center md:text-right">
              <div className="text-xs text-slate-400 font-medium">Earned Citizen Experience</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {userProfile.points} <span className="text-xs font-bold text-slate-400">XP</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-1.5">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-medium">Contributed</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {userProfile.reportsCount} <span className="text-[10px] text-slate-500 font-normal">reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Public Impact Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">SLA Clearance</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{CITY_STATS.resolvedPercentage}%</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Clock className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Avg Response Time</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{CITY_STATS.avgHoursToResolve} hrs</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Users className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Watch Patrollers</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{CITY_STATS.activeReporters}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Zap className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Waste Diverted</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{CITY_STATS.tonnesGarbageCleared} tonnes</div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                Community Resolution Track
              </h4>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Monthly aggregate of filed hazards vs completed physical repairs
              </p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} labelClassName="text-white" />
                <Area type="monotone" dataKey="reported" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorReported)" name="Reported Risks" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="SLA Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                Ward Sentinel Leaderboard
              </h4>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Civic Champion Point Rankings
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {LEADERBOARD.map((user, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  user.isUser
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/25'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black font-mono text-slate-500 w-4">
                    #{idx + 1}
                  </span>
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{user.name}</span>
                    <span className="text-[9px] font-mono text-slate-500">{user.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono block">{user.points} XP</span>
                  <span className="text-[9px] text-slate-500 block">{user.verifications} verifies</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before-and-After Proof Timeline Gallery */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Image className="h-4.5 w-4.5 text-cyan-400" />
              Before & After Community Resolution Gallery
            </h4>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Transparent verification loops displaying raw evidence vs physical repairs
            </p>
          </div>
        </div>

        {resolvedIssues.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            <p className="text-xs">No resolutions logged in this cycle yet. Officers are triaging open reports.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resolvedIssues.map((issue) => (
              <div key={issue.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{issue.location.ward}</span>
                    <h5 className="text-xs font-bold text-white mt-1">{issue.title}</h5>
                  </div>
                  <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    VERIFIED RESOLUTION
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative h-28 rounded-lg overflow-hidden border border-slate-800">
                    <img src={issue.imageUrls[0]} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 bg-rose-950/90 text-rose-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-rose-500/20">
                      BEFORE
                    </span>
                  </div>

                  <div className="relative h-28 rounded-lg overflow-hidden border border-slate-800">
                    {issue.resolvedImageUrl && (
                      <img src={issue.resolvedImageUrl} alt="After" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-emerald-950/90 text-emerald-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20">
                      AFTER
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  <strong className="text-slate-300">Notes:</strong> "{issue.resolvedNote}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ward Badge Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4 border-b border-slate-800 pb-3">
          Unlocks & Earnable Civic Badges
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Civic Patrol</span>
              <p className="text-[10px] text-slate-500">Report first public threat</p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Eagle Eye</span>
              <p className="text-[10px] text-slate-500">Complete 10+ correct verifications</p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Green Guardian</span>
              <p className="text-[10px] text-slate-500">Solve first illegal dumping hazard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

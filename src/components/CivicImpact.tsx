import React from 'react';
import {
  Award,
  Users,
  CheckCircle,
  Clock,
  Zap,
  Flame,
  TrendingUp,
  Trophy,
  Image,
  Sparkles,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Issue, UserProfile } from '../types';

interface CivicImpactProps {
  issues: Issue[];
  userProfile: UserProfile | null;
}

const CITY_STATS = {
  resolvedPercentage: 84,
  avgHoursToResolve: 28.5,
  activeReporters: 1420,
  tonnesGarbageCleared: 45
};

const MONTHLY_TRENDS = [
  { name: 'Jan', reported: 45, resolved: 38 },
  { name: 'Feb', reported: 55, resolved: 48 },
  { name: 'Mar', reported: 68, resolved: 52 },
  { name: 'Apr', reported: 75, resolved: 65 },
  { name: 'May', reported: 90, resolved: 82 },
  { name: 'Jun', reported: 110, resolved: 94 }
];

interface LeaderRow {
  name: string; points: number; reports: number; verifications: number;
  badge: string; avatar: string; delta: number; isUser?: boolean;
}

const LEADERBOARD: LeaderRow[] = [
  { name: 'David M.', points: 1250, reports: 14, verifications: 45, badge: 'Civic Gladiator', delta: 0, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { name: 'Samantha Rao', points: 980, reports: 11, verifications: 38, badge: 'Pothole Exterminator', delta: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { name: 'Anil K.', points: 840, reports: 9, verifications: 29, badge: 'Ward Watcher', delta: -1, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
  { name: 'Ananya Sharma', points: 420, reports: 4, verifications: 18, badge: 'Eagle Eye', delta: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', isUser: true },
  { name: 'Meera Deshmukh', points: 380, reports: 3, verifications: 15, badge: 'Active Citizen', delta: 0, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150' }
];

const PODIUM_STYLE = [
  { ring: 'border-amber-400', chip: 'bg-amber-400 text-amber-950', medal: '🥇', h: 'h-20' },
  { ring: 'border-slate-300', chip: 'bg-slate-300 text-slate-800', medal: '🥈', h: 'h-14' },
  { ring: 'border-orange-400', chip: 'bg-orange-400 text-orange-950', medal: '🥉', h: 'h-12' },
];

export default function CivicImpact({ issues, userProfile }: CivicImpactProps) {
  const resolvedIssues = issues.filter(i => i.status === 'resolved');

  // Live leaderboard — fold the active citizen's real points into the board, then re-rank
  const board: LeaderRow[] = LEADERBOARD
    .map(row =>
      row.isUser && userProfile && userProfile.role === 'citizen'
        ? { ...row, name: userProfile.name, points: userProfile.points, reports: userProfile.reportsCount, verifications: userProfile.verificationsCount }
        : row
    )
    .sort((a, b) => b.points - a.points);
  const topPoints = board[0]?.points || 1;
  const userRank = board.findIndex(r => r.isUser) + 1;
  const podium = board.slice(0, 3);

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner: User profile XP stats */}
      {userProfile && (
        <div className="bg-gradient-to-r from-emerald-50 via-cyan-50/40 to-slate-100 border border-emerald-150 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-emerald-500 p-0.5 overflow-hidden bg-white shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                  alt="Ananya Profile"
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 rounded-full flex items-center gap-0.5 shadow-xs">
                <Flame className="h-3 w-3 fill-white stroke-none" />
                {userProfile.streak}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">{userProfile.name}</h3>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {userProfile.role === 'officer' ? 'Municipal Admin' : 'Level 4 Sentinel'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Streak: {userProfile.streak} days consecutive watch | Ward: Koramangala
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left md:text-right">
              <div className="text-xs text-slate-500 font-medium">Earned Citizen Experience</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                {userProfile.points} <span className="text-xs font-bold text-slate-400">XP</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-1.5">
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Contributed</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {userProfile.reportsCount} <span className="text-[10px] text-slate-400 font-normal">reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Public Impact Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">SLA Clearance</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{CITY_STATS.resolvedPercentage}%</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center border border-cyan-100">
            <Clock className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Avg Response Time</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{CITY_STATS.avgHoursToResolve} hrs</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center border border-yellow-100">
            <Users className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Watch Patrollers</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{CITY_STATS.activeReporters}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Zap className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Waste Diverted</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{CITY_STATS.tonnesGarbageCleared} tonnes</div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[420px] shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                Community Resolution Track
              </h4>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Monthly aggregate of filed hazards vs completed physical repairs
              </p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontFamily="monospace" fontWeight="bold" />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" fontWeight="bold" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }} labelClassName="text-slate-950 font-bold" />
                <Area type="monotone" dataKey="reported" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReported)" name="Reported Risks" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" name="SLA Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[420px] shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Trophy className="h-4.5 w-4.5 text-amber-500" />
              Civic Champions — This Week
            </h4>
            {userRank > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                You're #{userRank}
              </span>
            )}
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-2 mb-4">
            {[1, 0, 2].map((pi) => {
              const u = podium[pi];
              if (!u) return null;
              const st = PODIUM_STYLE[pi];
              return (
                <div key={pi} className="flex flex-col items-center w-1/3">
                  <div className={`relative h-11 w-11 rounded-full overflow-hidden border-2 ${st.ring} bg-white shadow-sm`}>
                    <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute -bottom-1 -right-1 text-sm">{st.medal}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 mt-1.5 truncate max-w-full">{u.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono font-black text-emerald-600">{u.points}</span>
                  <div className={`mt-1 w-full rounded-t-md ${st.h} ${u.isUser ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                </div>
              );
            })}
          </div>

          {/* Ranked list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar border-t border-slate-100 pt-3">
            {board.map((user, idx) => (
              <div
                key={user.name}
                className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                  user.isUser ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/50'
                }`}
              >
                <span className="text-xs font-black font-mono text-slate-400 w-5 text-center">{idx + 1}</span>
                <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate">{user.name}</span>
                    {user.delta !== 0 && (
                      <span className={`text-[9px] font-bold font-mono ${user.delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {user.delta > 0 ? `▲${user.delta}` : `▼${Math.abs(user.delta)}`}
                      </span>
                    )}
                  </div>
                  {/* points bar relative to leader */}
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${user.isUser ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${(user.points / topPoints) * 100}%` }} />
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">{user.reports} reports · {user.verifications} verifies</div>
                </div>
                <span className="text-xs font-black text-emerald-600 font-mono shrink-0">{user.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before-and-After Proof Timeline Gallery */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Image className="h-4.5 w-4.5 text-cyan-600" />
              Before & After Community Resolution Gallery
            </h4>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
              Transparent verification loops displaying raw evidence vs physical repairs
            </p>
          </div>
        </div>

        {resolvedIssues.length === 0 ? (
          <div className="text-center p-8 text-slate-400">
            <p className="text-xs font-semibold">No resolutions logged in this cycle yet. Officers are triaging open reports.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resolvedIssues.map((issue) => (
              <div key={issue.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">{issue.location.ward}</span>
                    <h5 className="text-xs font-bold text-slate-800 mt-1">{issue.title}</h5>
                  </div>
                  <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    VERIFIED RESOLUTION
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative h-28 rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <img src={issue.imageUrls[0]} alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                      BEFORE
                    </span>
                  </div>

                  <div className="relative h-28 rounded-lg overflow-hidden border border-slate-200 bg-white">
                    {issue.resolvedImageUrl && (
                      <img src={issue.resolvedImageUrl} alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                      AFTER
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
                  <strong className="text-slate-800">Notes:</strong> "{issue.resolvedNote}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ward Badge Catalog */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
          Unlocks & Earnable Civic Badges
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Civic Patrol</span>
              <p className="text-[10px] text-slate-500">Report first public threat</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center border border-cyan-100 text-cyan-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Eagle Eye</span>
              <p className="text-[10px] text-slate-500">Complete 10+ correct verifications</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Green Guardian</span>
              <p className="text-[10px] text-slate-500">Solve first illegal dumping hazard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

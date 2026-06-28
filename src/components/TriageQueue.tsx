import React, { useState } from 'react';
import {
  ShieldAlert,
  ThumbsUp,
  UserCheck,
  CheckCircle,
  FileText,
  Clock,
  Send,
  User,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { ScanSearch, ShieldCheck, XCircle, Radar, Image as ImageIcon, Ban, CheckCheck } from 'lucide-react';
import { Issue, IssueStatus, UserProfile } from '../types';

interface TriageQueueProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  userProfile: UserProfile | null;
  onUpvote: (id: string) => void;
  onVerify: (id: string, type: 'confirm' | 'fake') => void;
  onOfficerAction: (id: string, params: { actionType: string; officerName?: string; eta?: string; resolvedNote?: string }) => void;
}

export default function TriageQueue({
  issues,
  selectedIssue,
  onSelectIssue,
  userProfile,
  onUpvote,
  onVerify,
  onOfficerAction
}: TriageQueueProps) {
  const isOfficer = userProfile?.role === 'officer';
  const [officerNote, setOfficerNote] = useState('');
  const [customEta, setCustomEta] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const getStatusBadgeClass = (status: IssueStatus) => {
    switch (status) {
      case 'pending_verification':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'verified':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'resolved':
        return 'bg-teal-100 text-teal-800 border border-teal-200';
      default:
        return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
  };

  const getStatusLabel = (status: IssueStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleAction = async (actionType: string) => {
    if (!selectedIssue) return;
    setSubmittingAction(true);
    try {
      await onOfficerAction(selectedIssue.id, {
        actionType,
        officerName: userProfile?.name || 'Officer Ramesh Kumar',
        eta: customEta || undefined,
        resolvedNote: officerNote || undefined
      });
      setOfficerNote('');
      setCustomEta('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* LEFT COLUMN: Queue Selection */}
      <div className="lg:col-span-5 flex flex-col h-[650px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Live Intake Triage Queue</h4>
            <p className="text-xs text-slate-500 font-medium">Sorted by AI Priority Urgency Score</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold font-mono px-2.5 py-1 rounded-md">
            {issues.length} cases
          </span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">No reported hazards found in this area.</p>
            </div>
          ) : (
            issues.map((issue) => {
              const isSelected = selectedIssue?.id === issue.id;
              return (
                <div
                  key={issue.id}
                  id={`queue-item-${issue.id}`}
                  onClick={() => onSelectIssue(issue)}
                  className={`p-4 transition-all duration-150 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-50 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-50/40 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      {issue.location.ward.split(' - ')[1] || issue.location.ward}
                    </span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${getStatusBadgeClass(issue.status)}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1 font-sans">
                    {issue.title}
                  </h5>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {issue.confirmations} verify
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 text-cyan-500" />
                        {issue.upvotes} support
                      </span>
                    </div>

                    {/* AI Priority badge */}
                    <div className="flex items-center gap-1 bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200 text-[10px] font-extrabold font-mono">
                      <Sparkles className="h-3 w-3 text-rose-600" />
                      PRIORITY {issue.priorityScore}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Selected Detail Panel */}
      <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[650px] shadow-xs">
        {selectedIssue ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-5 custom-scrollbar text-left">
            {/* Upper Area: Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${getStatusBadgeClass(selectedIssue.status)}`}>
                  {getStatusLabel(selectedIssue.status)}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2.5 font-sans leading-tight">{selectedIssue.title}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" /> Reported: {new Date(selectedIssue.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Dynamic Priority Circle */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
                <div className="text-center">
                  <div className="text-lg font-black text-rose-600 font-mono">{selectedIssue.priorityScore}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Urgency Score</div>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auto-Routed To</div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{selectedIssue.assignedDepartment || 'Local Authority'}</div>
                </div>
              </div>
            </div>

            {/* Visual attachments grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Citizen Filed Proof (Before)
                </label>
                <div className="h-44 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                  <img
                    src={selectedIssue.imageUrls[0]}
                    alt="Civic Issue Before"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-2 left-2 bg-rose-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                    Hazard Active
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Municipal Action Proof (After)
                </label>
                <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative flex flex-col items-center justify-center p-4">
                  {selectedIssue.status === 'resolved' && selectedIssue.resolvedImageUrl ? (
                    <>
                      <img
                        src={selectedIssue.resolvedImageUrl}
                        alt="Civic Issue Resolved"
                        className="w-full h-full object-cover absolute inset-0"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                        SLA Cleared
                      </span>
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs text-slate-500 font-semibold">Awaiting resolution proof update</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location & Details block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-5 shadow-xs">
              <div>
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Geographical Spot</div>
                <div className="text-xs text-slate-800 font-bold mt-1 leading-snug">{selectedIssue.location.address}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono font-bold">
                  ({selectedIssue.location.lat.toFixed(4)}, {selectedIssue.location.lng.toFixed(4)}) - {selectedIssue.location.ward}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Issue Severity Metrics</div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`h-2.5 w-6 rounded-xs ${
                        level <= selectedIssue.severity
                          ? 'bg-rose-500 shadow-xs shadow-rose-500/10'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-mono font-bold text-rose-600 ml-1">Level {selectedIssue.severity}/5</span>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="mb-5">
              <div className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Citizen Description</div>
              <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
                {selectedIssue.description}
              </p>
            </div>

            {/* AI Diagnostics Box (Transparent AI Rationale) */}
            <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-cyan-850 font-extrabold text-xs font-sans">
                  <Sparkles className="h-4 w-4 text-cyan-600 stroke-[2.5]" />
                  UrbanEye AI Sentinel Diagnostic
                </div>
                <span className="text-[9px] font-mono bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200 font-bold">
                  GEMINI AGENT INTEL
                </span>
              </div>
              <p className="text-xs text-slate-700 italic mb-3 font-medium">
                "{selectedIssue.aiRationale}"
              </p>

              {/* Step-by-step reasoning trace */}
              {selectedIssue.aiThoughtProcess && selectedIssue.aiThoughtProcess.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-cyan-200/50">
                  <div className="text-[9px] font-mono font-bold text-cyan-700 uppercase tracking-wider mb-2">
                    AI Agent Process Logs:
                  </div>
                  <ul className="space-y-1.5 text-[10px] font-mono text-slate-600">
                    {selectedIssue.aiThoughtProcess.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed font-semibold">
                        <span className="text-cyan-600 font-bold">▶</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Interactive Actions Area */}
            <div className="mt-auto border-t border-slate-100 pt-5">
              {!isOfficer ? (
                /* Citizen Community Tools */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-left">
                    <span className="text-xs text-slate-700 block font-bold">Is this hazard currently active?</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Consensus threshold needs 3 verifications to unlock dispatch</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="citizen-upvote-btn"
                      onClick={() => onUpvote(selectedIssue.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer shadow-xs"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-cyan-600" />
                      Support (+{selectedIssue.upvotes})
                    </button>

                    <button
                      id="citizen-verify-btn"
                      onClick={() => onVerify(selectedIssue.id, 'confirm')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition cursor-pointer shadow-xs"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                      I See It Too (+{selectedIssue.confirmations})
                    </button>

                    <button
                      id="citizen-dispute-btn"
                      onClick={() => onVerify(selectedIssue.id, 'fake')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition cursor-pointer shadow-xs"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      Duplicate / Fake
                    </button>
                  </div>
                </div>
              ) : (
                /* Admin Officer Console Tools */
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs mb-3 font-sans">
                    <User className="h-4 w-4 text-amber-600 stroke-[2.5]" />
                    Municipal Officer Triage Console (Admin)
                  </div>

                  {/* Officer text area */}
                  <div className="mb-3">
                    <textarea
                      placeholder="Write official resolution update or status notes here..."
                      value={officerNote}
                      onChange={(e) => setOfficerNote(e.target.value)}
                      className="w-full text-xs text-slate-900 p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 resize-none h-16 placeholder:text-slate-400 shadow-xs"
                    />
                  </div>

                  {/* Flow control buttons based on current state */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedIssue.status === 'pending_verification' || selectedIssue.status === 'verified' ? (
                        <>
                          <input
                            type="text"
                            placeholder="Set ETA (2026-06-25)"
                            value={customEta}
                            onChange={(e) => setCustomEta(e.target.value)}
                            className="bg-white text-xs text-slate-900 border border-slate-200 p-1.5 rounded-lg placeholder:text-slate-400 shadow-xs max-w-[140px]"
                          />
                          <button
                            onClick={() => handleAction('acknowledge')}
                            disabled={submittingAction}
                            className="bg-amber-500 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-lg hover:bg-amber-400 transition cursor-pointer shadow-xs"
                          >
                            Acknowledge Case
                          </button>
                        </>
                      ) : null}

                      {selectedIssue.status === 'acknowledged' ? (
                        <button
                          onClick={() => handleAction('start_work')}
                          disabled={submittingAction}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                        >
                          Mark as In Progress
                        </button>
                      ) : null}

                      {selectedIssue.status === 'in_progress' ? (
                        <button
                          onClick={() => handleAction('resolve')}
                          disabled={submittingAction}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                        >
                          Mark as Resolved
                        </button>
                      ) : null}
                    </div>

                    <button
                      onClick={() => handleAction('reject')}
                      disabled={submittingAction}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition cursor-pointer"
                    >
                      Reject / Spam
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Life-cycle Timeline events */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-left">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                Audited Issue Timeline Log
              </div>
              <div className="relative border-l border-slate-200 pl-4 space-y-4 ml-1">
                {selectedIssue.timeline.map((event, index) => (
                  <div key={index} className="relative">
                    {/* Circle marker */}
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-100 border-2 border-slate-300" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800">{getStatusLabel(event.status)}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        {event.actor}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed font-semibold">{event.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <ShieldAlert className="h-12 w-12 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-500">No Case Selected</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Pick a pin from the live map or select an active report from the left queue to view detailed diagnostics and take action.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// REVIEW QUEUE — Human-in-the-loop AI moderation (officer only)
// ──────────────────────────────────────────────────────────────
export interface ReviewInsights {
  imageDetection: { label: string; confidence: number }[];
  authenticity: { manipulated: boolean; score: number; verdict: string };
  socialMedia: { source: string; handle: string; snippet: string; matchConfidence: number; timeAgo: string }[];
  duplicateRisk: number;
  aiRecommendation: 'approve' | 'reject';
  aiSummary: string;
}

export interface PendingReport {
  id: string;
  reporterName: string;
  submittedAt: string;
  insights: ReviewInsights;
  draftIssue: Issue;
}

export interface ReviewLog {
  approved: { id: string; title: string; ward: string; decidedAt: string; officer: string }[];
  discarded: { id: string; title: string; ward: string; reason: string; decidedAt: string; officer: string }[];
}

interface ReviewQueueProps {
  pending: PendingReport[];
  log: ReviewLog;
  busyId: string | null;
  onDecision: (id: string, decision: 'approve' | 'reject') => void;
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-bold text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export function ReviewQueue({ pending, log, busyId, onDecision }: ReviewQueueProps) {
  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-rose-50/30 to-white border border-rose-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-rose-500 stroke-[2.5]" />
            AI Review Console — Human in the Loop
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Every citizen upload is enriched by the AI engine (image-authenticity detection + social-media corroboration). You decide what goes live.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {[
            { label: 'Pending', value: pending.length, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Approved', value: log.approved.length, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Discarded', value: log.discarded.length, cls: 'bg-rose-50 border-rose-200 text-rose-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-3 py-1.5 text-center ${s.cls}`}>
              <div className="text-base font-black font-mono leading-none">{s.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending cards */}
      {pending.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
          <CheckCheck className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Queue clear</h4>
          <p className="text-xs text-slate-400 mt-1">No uploads awaiting review. New citizen reports surface here automatically.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pending.map((p) => {
            const issue = p.draftIssue;
            const ins = p.insights;
            const recApprove = ins.aiRecommendation === 'approve';
            const busy = busyId === p.id;
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Left: evidence */}
                  <div className="lg:col-span-4 bg-slate-50/60 p-4 border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                      <img src={issue.imageUrls[0]} alt={issue.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                        UPLOAD · {issue.location.ward.split(' - ')[1] || issue.location.ward}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-3 leading-tight">{issue.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">{issue.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                      <span>by {p.reporterName}</span>
                      <span>•</span>
                      <span>Sev {issue.severity}/5</span>
                      <span>•</span>
                      <span>{new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Right: AI insights */}
                  <div className="lg:col-span-8 p-4 space-y-4">
                    {/* AI recommendation */}
                    <div className={`rounded-xl border p-3 ${recApprove ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className={`h-4 w-4 ${recApprove ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                          AI recommends: {recApprove ? 'Approve' : 'Reject'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{ins.aiSummary}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Image detection */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                          <ImageIcon className="h-3.5 w-3.5 text-cyan-600" /> AI Image Detection
                        </div>
                        <div className="space-y-2">
                          {ins.imageDetection.map((d, i) => (
                            <div key={i}>
                              <div className="text-[11px] font-semibold text-slate-700 mb-0.5">{d.label}</div>
                              <Confidence value={d.confidence} />
                            </div>
                          ))}
                        </div>
                        <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ins.authenticity.manipulated ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          <ShieldCheck className="h-3 w-3" /> {ins.authenticity.verdict}
                        </div>
                      </div>

                      {/* Social media scraping */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                          <Radar className="h-3.5 w-3.5 text-indigo-600" /> Social Media Corroboration
                        </div>
                        <div className="space-y-2">
                          {ins.socialMedia.map((s, i) => (
                            <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700">{s.source}</span>
                                <span className="text-[9px] font-mono text-slate-400">{s.timeAgo}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-snug mt-0.5">"{s.snippet}"</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px] font-mono text-indigo-500">{s.handle}</span>
                                <span className="text-[9px] font-mono font-bold text-slate-500">match {Math.round(s.matchConfidence * 100)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-slate-400">
                          Duplicate risk: <span className={`font-bold ${ins.duplicateRisk > 0.5 ? 'text-rose-600' : 'text-emerald-600'}`}>{Math.round(ins.duplicateRisk * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Decision */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => onDecision(p.id, 'reject')}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> False — Discard
                      </button>
                      <button
                        onClick={() => onDecision(p.id, 'approve')}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        <CheckCircle className="h-4 w-4 stroke-[2.5]" /> True — Approve & Pin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approved + Discarded logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-3">
            <CheckCheck className="h-4.5 w-4.5 text-emerald-600" /> Approved & Live
          </h4>
          {log.approved.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nothing published yet.</p>
          ) : (
            <div className="space-y-2">
              {log.approved.map((a) => (
                <div key={a.id + a.decidedAt} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{a.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{a.ward.split(' - ')[1] || a.ward} · {a.officer}</div>
                  </div>
                  <span className="text-[9px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold shrink-0">PINNED</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-3">
            <Ban className="h-4.5 w-4.5 text-rose-500" /> Discarded
          </h4>
          {log.discarded.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No rejected uploads.</p>
          ) : (
            <div className="space-y-2">
              {log.discarded.map((d) => (
                <div key={d.id + d.decidedAt} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{d.title}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{d.reason}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.ward.split(' - ')[1] || d.ward} · {d.officer}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

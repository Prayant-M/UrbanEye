import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, Lightbulb, Play, CheckCircle } from 'lucide-react';
import { InsightCard } from '../types';

interface AIPredictionsProps {
  insights: InsightCard[];
  onTriggerDiagnostics: () => Promise<void>;
}

export default function AIPredictions({ insights, onTriggerDiagnostics }: AIPredictionsProps) {
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setSuccess(false);
    try {
      await onTriggerDiagnostics();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          badge: 'bg-rose-950 text-rose-400 border border-rose-500/20'
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          badge: 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
        };
      default:
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          badge: 'bg-cyan-950 text-cyan-400 border border-cyan-500/20'
        };
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="h-5.5 w-5.5 text-indigo-400 stroke-[2.5]" />
            AI Predictive Planning & Trend Diagnostics
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing historical reports and community verification volume to predict municipal failures before they impact citizens.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-black px-5 py-2.5 text-xs hover:from-indigo-400 hover:to-cyan-400 transition shadow-lg disabled:opacity-50 cursor-pointer"
        >
          {running ? (
            <>
              <span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-slate-950 border-t-transparent" />
              Synthesizing city aggregates...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4 stroke-[3]" />
              Analysis Refreshed!
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-slate-950 stroke-none" />
              Run Gemini Planning Audit
            </>
          )}
        </button>
      </div>

      {/* Grid of Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((card) => {
          const styles = getTypeStyle(card.type);
          return (
            <div
              key={card.id}
              className={`flex flex-col rounded-2xl border p-5 ${styles.bg} h-full justify-between transition-all hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded ${styles.badge}`}>
                    {card.type} PROJECTION
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                    {card.category.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-2 leading-snug">{card.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{card.description}</p>
              </div>

              {/* Action recommendation bottom panel */}
              <div className="border-t border-slate-800/60 pt-4 mt-4">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-400 stroke-[2.5]" />
                  Sentinel Recommendation
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                  "{card.recommendation}"
                </p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                  <span>Ward: {card.ward.split(' - ')[1]}</span>
                  <span className="text-amber-500 font-bold">{card.frequency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Municipal SLA Guidelines Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">Explainable City AI Integration</span>
            <p className="text-[10px] text-slate-500">Predictive recommendations are coupled with local planning guidelines to improve public accountability.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

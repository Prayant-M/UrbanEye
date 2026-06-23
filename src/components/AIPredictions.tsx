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
          bg: 'bg-rose-50/60 border-rose-200 text-rose-900',
          badge: 'bg-rose-100 text-rose-800 border border-rose-200'
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/60 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
        };
      default:
        return {
          bg: 'bg-cyan-50/60 border-cyan-200 text-cyan-900',
          badge: 'bg-cyan-100 text-cyan-850 border border-cyan-200'
        };
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-white via-indigo-50/30 to-white border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Brain className="h-5.5 w-5.5 text-indigo-600 stroke-[2.5]" />
            AI Predictive Planning & Trend Diagnostics
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing historical reports and community verification volume to predict municipal failures before they impact citizens.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-black px-5 py-2.5 text-xs hover:from-indigo-500 hover:to-cyan-500 transition shadow-md disabled:opacity-50 cursor-pointer"
        >
          {running ? (
            <>
              <span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent" />
              Synthesizing city aggregates...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4 stroke-[3]" />
              Analysis Refreshed!
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white stroke-none" />
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
              className={`flex flex-col rounded-2xl border p-5 ${styles.bg} h-full justify-between shadow-xs transition-all hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded ${styles.badge}`}>
                    {card.type} PROJECTION
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                    {card.category.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-2 leading-snug">{card.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{card.description}</p>
              </div>

              {/* Action recommendation bottom panel */}
              <div className="border-t border-slate-200/80 pt-4 mt-4">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                  Sentinel Recommendation
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-100/60 p-2.5 rounded-lg border border-slate-200/50">
                  "{card.recommendation}"
                </p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50 text-[10px] font-mono text-slate-400">
                  <span>Ward: {card.ward.split(' - ')[1]}</span>
                  <span className="text-amber-600 font-bold">{card.frequency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Municipal SLA Guidelines Footer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Explainable City AI Integration</span>
            <p className="text-[10px] text-slate-500">Predictive recommendations are coupled with local planning guidelines to improve public accountability.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CivicMap from './components/CivicMap';
import TriageQueue from './components/TriageQueue';
import ReportForm from './components/ReportForm';
import CivicImpact from './components/CivicImpact';
import AIPredictions from './components/AIPredictions';
import CivicAssistant from './components/CivicAssistant';
import { Issue, UserProfile, InsightCard } from './types';
import { ShieldAlert, AlertCircle, Bot, Activity, Sparkles, Filter, ChevronRight, Check } from 'lucide-react';

export default function App() {
  const [currentTab, setTab] = useState('dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom toast message for state changes
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) throw new Error('Failed to retrieve issues');
      const data = await res.json();
      setIssues(data);
      // Auto-select first issue if none selected
      if (data.length > 0 && !selectedIssue) {
        setSelectedIssue(data[0]);
      } else if (selectedIssue) {
        // Keep selected issue details updated
        const updated = data.find((i: Issue) => i.id === selectedIssue.id);
        if (updated) setSelectedIssue(updated);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to retrieve citizen profile');
      const data = await res.json();
      setUserProfile(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('Failed to retrieve predictive insights');
      const data = await res.json();
      setInsights(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchIssues(), fetchProfile(), fetchInsights()]);
      setLoading(false);
    };
    initData();
  }, []);

  const handleToggleRole = async () => {
    if (!userProfile) return;
    const targetRole = userProfile.role === 'citizen' ? 'officer' : 'citizen';
    try {
      const res = await fetch('/api/profile/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      if (!res.ok) throw new Error('Failed to toggle role');
      const data = await res.json();
      setUserProfile(data);
      showToast(`Swapped view to ${targetRole === 'officer' ? 'Municipal Officer Dashboard' : 'Citizen Portal'}!`, 'info');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/upvote`, { method: 'POST' });
      if (!res.ok) throw new Error('Upvote registration failed');
      const updatedIssue = await res.json();
      
      // Update local issues state
      setIssues(prev => prev.map(i => i.id === id ? updatedIssue : i));
      setSelectedIssue(updatedIssue);
      showToast('You upvoted this hazard! Community priority score raised.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id: string, type: 'confirm' | 'fake') => {
    try {
      const res = await fetch(`/api/issues/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmType: type })
      });
      if (!res.ok) throw new Error('Verification submission failed');
      const data = await res.json();
      
      setIssues(prev => prev.map(i => i.id === id ? data.issue : i));
      setSelectedIssue(data.issue);
      setUserProfile(data.profile);

      if (type === 'confirm') {
        showToast('Community verification recorded! You earned 15 XP.', 'success');
      } else {
        showToast('Issue flagged as potential spam. Undergoing queue recalculation.', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOfficerAction = async (id: string, params: { actionType: string; officerName?: string; eta?: string; resolvedNote?: string }) => {
    try {
      const res = await fetch(`/api/issues/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error('Officer action dispatch failed');
      const updatedIssue = await res.json();
      
      setIssues(prev => prev.map(i => i.id === id ? updatedIssue : i));
      setSelectedIssue(updatedIssue);
      
      // Refresh profile to claim XP rewards if resolved
      if (params.actionType === 'resolve') {
        await fetchProfile();
        showToast('Hazard successfully cleared! Proof-of-repair logged and citizens notified.', 'success');
      } else {
        showToast(`SLA State modified: ${params.actionType.replace('_', ' ').toUpperCase()}`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerDiagnostics = async () => {
    try {
      const res = await fetch('/api/diagnostics', { method: 'POST' });
      if (!res.ok) throw new Error('Diagnostics execution failed');
      const updatedInsights = await res.json();
      setInsights(updatedInsights);
      showToast('Gemini planning audit successfully calculated.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueReported = (newIssue: any, message: string) => {
    // Add reported issue to top of the list
    setIssues(prev => [newIssue, ...prev]);
    setSelectedIssue(newIssue);
    // Reload profile for XP points update
    fetchProfile();
  };

  const CATEGORY_TABS = [
    { value: 'all', label: 'All Hazards' },
    { value: 'pothole', label: 'Potholes' },
    { value: 'water_leak', label: 'Water Leaks' },
    { value: 'broken_streetlight', label: 'Streetlights' },
    { value: 'garbage', label: 'Garbage accumulation' },
    { value: 'drainage', label: 'Clogged Drainage' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-20 right-4 z-[99] max-w-sm p-4 bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
          <div className="h-6 w-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
          <span className="text-xs text-slate-200 font-medium leading-normal">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <Navbar
        currentTab={currentTab}
        setTab={setTab}
        userProfile={userProfile}
        toggleRole={handleToggleRole}
        onOpenAssistant={() => setAssistantOpen(prev => !prev)}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Active Content View Area */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full custom-scrollbar">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <span className="animate-spin h-8 w-8 rounded-full border-3 border-emerald-500 border-t-transparent" />
              <p className="text-sm text-slate-500 mt-3 font-mono">Initializing Civic Sentinel Engine...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl max-w-md mx-auto my-12">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
              <h4 className="text-sm font-bold text-white">Initialization Error</h4>
              <p className="text-xs text-slate-400 mt-1 text-center leading-relaxed">{error}</p>
            </div>
          ) : (
            <>
              {/* PRIMARY TAB: Dashboard View */}
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Category Filter Tray */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <Filter className="h-4 w-4 text-slate-400" />
                      Filter Ward Priorities:
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_TABS.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setSelectedCategory(tab.value)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                            selectedCategory === tab.value
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/10'
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Two-part layout: Interactive Vector Map above, Triage Queue below */}
                  <div className="h-[480px] w-full min-h-[400px]">
                    <CivicMap
                      issues={issues}
                      selectedIssue={selectedIssue}
                      onSelectIssue={setSelectedIssue}
                      selectedCategory={selectedCategory}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-900">
                    <TriageQueue
                      issues={selectedCategory === 'all' ? issues : issues.filter(i => i.category === selectedCategory)}
                      selectedIssue={selectedIssue}
                      onSelectIssue={setSelectedIssue}
                      userProfile={userProfile}
                      onUpvote={handleUpvote}
                      onVerify={handleVerify}
                      onOfficerAction={handleOfficerAction}
                    />
                  </div>
                </div>
              )}

              {/* REPORT TAB: Hazard reporting form */}
              {currentTab === 'report' && (
                <div className="py-2">
                  <ReportForm
                    userProfile={userProfile}
                    onIssueReported={handleIssueReported}
                    setTab={setTab}
                  />
                </div>
              )}

              {/* IMPACT TAB: Global dashboard statistics & leaderboard */}
              {currentTab === 'impact' && (
                <div className="py-2">
                  <CivicImpact
                    issues={issues}
                    userProfile={userProfile}
                  />
                </div>
              )}

              {/* PREDICTIONS TAB: Deep Gemini predictive insights */}
              {currentTab === 'predictions' && (
                <div className="py-2">
                  <AIPredictions
                    insights={insights}
                    onTriggerDiagnostics={handleTriggerDiagnostics}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Dynamic Chatbot Drawer panel */}
        {assistantOpen && (
          <div className="shrink-0 border-l border-slate-800 animate-in slide-in-from-right duration-300">
            <CivicAssistant onClose={() => setAssistantOpen(false)} />
          </div>
        )}
      </main>
    </div>
  );
}

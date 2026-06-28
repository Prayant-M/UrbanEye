import React, { useState } from 'react';
import { ShieldAlert, Image, MapPin, Sparkles, Send, Check, AlertCircle } from 'lucide-react';
import { IssueCategory, UserProfile } from '../types';

interface ReportFormProps {
  userProfile: UserProfile | null;
  onIssueReported: () => void;
  setTab: (tab: string) => void;
}

export default function ReportForm({ userProfile, onIssueReported, setTab }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory | 'auto'>('auto');
  const [ward, setWard] = useState('Ward 80 - Indiranagar');
  const [address, setAddress] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [sampleType, setSampleType] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const WARDS_LIST = [
    'Ward 80 - Indiranagar',
    'Ward 151 - Koramangala',
    'Ward 174 - HSR Layout',
    'Ward 150 - Bellandur',
    'Ward 93 - Vasanth Nagar',
    'Ward 142 - Jayanagar',
    'Ward 112 - Malleswaram',
    'Ward 160 - Whitefield'
  ];

  const PRESETS = [
    { id: 'pothole', name: 'Hazardous Pothole', category: 'pothole', desc: 'Large, dangerous road crater filled with water at a sharp turn, forcing vehicles into incoming lanes.' },
    { id: 'water_leak', name: 'Water Pipe Leakage', category: 'water_leak', desc: 'Huge drinking water pipe burst. Water shooting several feet high, flooding pavements and wasting drinking supply.' },
    { id: 'streetlight', name: 'Hanging Electric Cable', category: 'broken_streetlight', desc: 'Broken overhead power cable hanging loose above a pedestrian walkway. Sparks are occasionally visible.' },
    { id: 'garbage', name: 'Rotting Waste Pile', category: 'garbage', desc: 'Piles of industrial and residential trash dumped on the corner of the municipal park, attracting wild street dogs.' },
    { id: 'drainage', name: 'Storm Drain Block', category: 'drainage', desc: 'Storm drain completely clogged with dry mud and plastic rubbish. Minor rainfall causes immediate road logging.' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setSampleType(null); // Clear preset if custom uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.name);
    setDescription(preset.desc);
    setCategory(preset.category as IssueCategory);
    setSampleType(preset.id);
    setImageBase64(null); // Clear custom if preset selected
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      setError('A descriptive summary is required to run AI diagnostics.');
      return;
    }

    setLoading(true);
    setError(null);

    // Map selected ward to coordinate values
    let lat = 12.9716;
    let lng = 77.5946;
    if (ward.includes('Koramangala')) { lat = 12.9716; lng = 77.6412; }
    else if (ward.includes('Indiranagar')) { lat = 12.9784; lng = 77.6408; }
    else if (ward.includes('HSR')) { lat = 12.9104; lng = 77.6186; }
    else if (ward.includes('Bellandur')) { lat = 12.9220; lng = 77.6780; }
    else if (ward.includes('Vasanth')) { lat = 12.9845; lng = 77.5950; }

    try {
      const res = await fetch('/api/issues/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category: category === 'auto' ? undefined : category,
          ward,
          address: address || `Near central lane, ${ward.split(' - ')[1]}`,
          lat,
          lng,
          imageBase64,
          sampleImageId: sampleType || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server reported failure in registering hazard.');
      }

      onIssueReported();
      setSuccessMsg(data.message);

      // Auto-switch back to Map after a short pause
      setTimeout(() => {
        setTab('dashboard');
      }, 4000);

    } catch (err: any) {
      setError(err.message || 'An unexpected connection issue occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-left">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-emerald-600 stroke-[2.5]" />
          Report Community Infrastructure Threat
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Gemini auto-classifies, deduplicates and prioritises your report instantly.
        </p>
      </div>

      <div className="p-6 bg-white">
        {successMsg ? (
          <div className="text-center p-8 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-md shadow-emerald-600/15">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <h4 className="text-md font-bold text-slate-900">Submitted for AI Review</h4>
            <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">{successMsg}</p>
            <div className="text-[10px] text-slate-400 font-mono mt-4 animate-pulse">
              Redirecting to primary sentinel dashboard...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Presets / Seed Simulators */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 font-mono uppercase tracking-wider">
                Quick presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      sampleType === p.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    ⚡ {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Form: text fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Issue Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ruptured sewer line flooding street"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs text-slate-900 p-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Ward Location
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full text-xs text-slate-900 p-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold shadow-xs"
                  >
                    {WARDS_LIST.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Geographical Landmark / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Shell Station, Sector 2 lane"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs text-slate-900 p-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category Override
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs text-slate-900 p-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold shadow-xs"
                  >
                    <option value="auto">🤖 Auto-Determine via Computer Vision</option>
                    <option value="pothole">Pothole / Road Damage</option>
                    <option value="water_leak">Fresh Water Pipe Leakage</option>
                    <option value="broken_streetlight">Streetlight Malfunction</option>
                    <option value="garbage">Garbage pile / Public Littering</option>
                    <option value="drainage">Clogged Drainage / Overflow</option>
                    <option value="illegal_dumping">Industrial Illegal Dumping</option>
                    <option value="other">Other infrastructure failure</option>
                  </select>
                </div>
              </div>

              {/* Right Form: image drag-drop/preview & details */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Visual Evidence (Image File)
                  </label>
                  <div className="relative h-[190px] bg-slate-50 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500/50 transition flex flex-col items-center justify-center p-4">
                    {imageBase64 ? (
                      <div className="w-full h-full relative">
                        <img
                          src={imageBase64}
                          alt="Custom upload preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setImageBase64(null)}
                          className="absolute top-2 right-2 bg-slate-900/90 hover:bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold transition shadow-xs"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : sampleType ? (
                      <div className="text-center p-3 text-slate-500">
                        <Check className="h-8 w-8 text-emerald-600 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-850">Preset Image Configured</p>
                        <p className="text-[10px] mt-1">High-resolution catalog assets will be appended dynamically by AI.</p>
                      </div>
                    ) : (
                      <div className="text-center p-3 text-slate-400 cursor-pointer">
                        <Image className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-700 block">Drag & Drop or Click to Upload</span>
                        <span className="text-[10px] text-slate-400 block mt-1">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Describe Situation
                  </label>
                  <textarea
                    required
                    placeholder="Provide specific details about the risk level, active damage, proximity to schools, hospitals or high traffic avenues..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs text-slate-900 p-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 resize-none h-[95px] shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submission button */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono font-bold">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                Deduplication scan will run immediately on submission.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-extrabold px-5 py-2.5 text-xs hover:bg-emerald-500 transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent" />
                    AI Triage active...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                    Submit & Dispatch AI Agent
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

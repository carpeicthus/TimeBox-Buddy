import React, { useState } from 'react';
import { SetupForm } from './components/SetupForm';
import { Timeline } from './components/Timeline';
import { ExportTools } from './components/ExportTools';
import { PresetManager } from './components/PresetManager';
import { generateSchedule } from './services/gemini';
import { AppState, TimeboxPlan, ScheduleItem, Preset, BlockType } from './types';
import { Sparkles, ArrowLeft, RefreshCw, MessageSquarePlus, Lightbulb, MessageSquare } from 'lucide-react';
import { addMinutes, parseISO } from 'date-fns';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'setup',
    startDate: '',
    endDate: '',
    tasks: '',
    preferences: '',
    currentPlan: null,
    isLoading: false,
    error: null,
    presets: [
        { id: 'p1', name: 'Deep Work Session', durationMinutes: 90, type: BlockType.FOCUS },
        { id: 'p2', name: 'Quick Break', durationMinutes: 15, type: BlockType.BREAK },
        { id: 'p3', name: 'Meeting / Sync', durationMinutes: 30, type: BlockType.SOCIAL },
        { id: 'p4', name: 'Meal', durationMinutes: 45, type: BlockType.ROUTINE },
    ]
  });

  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleGenerate = async (start: string, end: string, tasks: string, prefs: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, startDate: start, endDate: end, tasks, preferences: prefs }));
    
    try {
      const plan = await generateSchedule(start, end, tasks, prefs);
      setState(prev => ({
        ...prev,
        currentPlan: plan,
        isLoading: false,
        step: 'view'
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || "Something went wrong." }));
    }
  };

  const handleUpdateSchedule = (newSchedule: ScheduleItem[]) => {
      setState(prev => ({
          ...prev,
          currentPlan: prev.currentPlan ? { ...prev.currentPlan, schedule: newSchedule } : null
      }));
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementText.trim() || !state.currentPlan) return;

    setIsRefining(true);
    try {
      const updatedPlan = await generateSchedule(
        state.startDate,
        state.endDate,
        state.tasks,
        state.preferences,
        state.currentPlan,
        refinementText
      );
      setState(prev => ({
        ...prev,
        currentPlan: updatedPlan
      }));
      setRefinementText('');
    } catch (err: any) {
      alert("Failed to refine: " + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAddPreset = (preset: Preset) => {
      setState(prev => ({ ...prev, presets: [...prev.presets, preset] }));
  };

  const handleApplyPreset = (preset: Preset) => {
      if (!state.currentPlan) return;
      
      const schedule = [...state.currentPlan.schedule];
      let startTime = new Date(state.startDate);
      if (schedule.length > 0) {
          const sorted = [...schedule].sort((a,b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
          const lastItem = sorted[sorted.length - 1];
          startTime = new Date(lastItem.endTime);
      }
      
      const endTime = addMinutes(startTime, preset.durationMinutes);
      
      const newItem: ScheduleItem = {
          id: `preset-add-${Date.now()}`,
          title: preset.defaultTitle || preset.name,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: preset.type,
          description: `Added from preset: ${preset.name}`
      };
      
      handleUpdateSchedule([...schedule, newItem]);
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: 'setup' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600">
              Timebox Architect
            </h1>
          </div>
          {state.step === 'view' && (
            <button 
              onClick={handleBack}
              className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              New Plan
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span className="font-bold">Error:</span> {state.error}
          </div>
        )}

        {state.step === 'setup' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-3">Master Your Time</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Turn your overwhelming to-do list into a calm, structured, and ADHD-friendly schedule in seconds.
              </p>
            </div>
            <SetupForm onGenerate={handleGenerate} isLoading={state.isLoading} />
          </div>
        )}

        {state.step === 'view' && state.currentPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-2">Your Plan Summary</h2>
                <p className="text-slate-600 italic">"{state.currentPlan.summary}"</p>
              </div>

              {/* Suggestions Section */}
              {state.currentPlan.suggestions && (
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
                  <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-3">
                    <Lightbulb size={18} />
                    Schedule Improvement Suggestions
                  </h3>
                  <p className="text-amber-900/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {state.currentPlan.suggestions}
                  </p>
                </div>
              )}
              
              <Timeline 
                schedule={state.currentPlan.schedule} 
                onUpdateSchedule={handleUpdateSchedule}
              />
            </div>

            <div className="space-y-6">
              <PresetManager 
                presets={state.presets} 
                onAddPreset={handleAddPreset}
                onApplyPreset={handleApplyPreset}
              />

              {/* Refinement Box */}
              <div className="bg-white p-5 rounded-xl shadow-lg border border-indigo-100 sticky top-24">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <MessageSquarePlus size={18} className="text-indigo-500" />
                  Iterate & Adjust
                </h3>
                
                {/* AI Feedback on Changes */}
                {state.currentPlan.feedback && (
                  <div className="mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1 uppercase tracking-wider">
                      <MessageSquare size={12} />
                      AI Feedback
                    </div>
                    <p className="text-xs text-indigo-900/80 italic leading-snug">
                      {state.currentPlan.feedback}
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-500 mb-3">
                  Tell the AI to tweak the schedule (e.g., "Make breaks longer", "Avoid early mornings").
                </p>
                <form onSubmit={handleRefine}>
                  <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    placeholder="e.g. Give me 15m breaks after every meeting..."
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3 bg-white text-slate-900"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={isRefining || !refinementText.trim()}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all
                      ${isRefining || !refinementText.trim() 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}
                    `}
                  >
                    {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {isRefining ? 'Updating...' : 'Refine Schedule'}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-3 px-1">Export Options</h3>
                <ExportTools 
                  schedule={state.currentPlan.schedule} 
                  originalPromptContext={{
                    start: state.startDate,
                    end: state.endDate,
                    tasks: state.tasks
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

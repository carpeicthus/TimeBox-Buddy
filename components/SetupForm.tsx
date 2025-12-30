import React, { useState } from 'react';
import { Loader2, Calendar, Brain, Sliders, ArrowRight } from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface SetupFormProps {
  onGenerate: (start: string, end: string, tasks: string, prefs: string) => void;
  isLoading: boolean;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onGenerate, isLoading }) => {
  // Use local time for defaults instead of UTC toISOString to prevent timezone shifts
  const now = new Date();
  const defaultStart = formatDate(now, "yyyy-MM-dd'T'HH:mm");
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultEnd = formatDate(tomorrow, "yyyy-MM-dd'T'HH:mm");

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [tasks, setTasks] = useState('');
  const [prefs, setPrefs] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(startDate, endDate, tasks, prefs);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Plan Your Timebox
        </h2>
        <p className="text-indigo-100 mt-2 opacity-90">
          Define your window, dump your tasks, and let AI structure your flow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Time Window */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
            <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md"><Calendar size={18} /></span>
            Time Window
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">Start Time</label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">End Time</label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Brain Dump */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
            <span className="bg-pink-100 text-pink-700 p-1.5 rounded-md"><Brain size={18} /></span>
            Brain Dump
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-500">
              List everything you need to do. Don't worry about order.
            </label>
            <textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="- Finish Q4 report&#10;- Buy groceries (milk, eggs)&#10;- Call Mom&#10;- 2 hours of deep coding&#10;- Gym leg day"
              className="w-full h-32 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-y transition-all placeholder:text-slate-400 bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
            <span className="bg-teal-100 text-teal-700 p-1.5 rounded-md"><Sliders size={18} /></span>
            Constraints & Vibes
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-500">
              Any specific constraints? (e.g., "No meetings before 10am", "Pomodoro style")
            </label>
            <input
              type="text"
              value={prefs}
              onChange={(e) => setPrefs(e.target.value)}
              placeholder="e.g. I have ADHD, so I need frequent breaks."
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Action */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all
              ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin w-6 h-6" />
                Designing Schedule...
              </>
            ) : (
              <>
                Generate Timebox
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

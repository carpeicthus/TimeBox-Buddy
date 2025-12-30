import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { format, parseISO } from 'date-fns';
import { Copy, Check, Terminal, Calendar as CalIcon } from 'lucide-react';

interface ExportToolsProps {
  schedule: ScheduleItem[];
  originalPromptContext: {
    start: string;
    end: string;
    tasks: string;
  };
}

export const ExportTools: React.FC<ExportToolsProps> = ({ schedule, originalPromptContext }) => {
  const [activeTab, setActiveTab] = useState<'apple' | 'google_gemini'>('apple');
  const [copied, setCopied] = useState(false);

  // Apple Calendar / Quick Entry
  const generateAppleList = () => {
    return schedule.map(item => {
      const start = parseISO(item.startTime);
      const end = parseISO(item.endTime);
      // Format: "Title at HH:mm on MM/dd/yyyy to HH:mm"
      return `${item.title} at ${format(start, 'HH:mm')} on ${format(start, 'MM/dd/yyyy')} to ${format(end, 'HH:mm')}`;
    }).join('\n');
  };

  // Google Calendar via Gemini Prompt
  const generateGeminiPrompt = () => {
    const eventsText = schedule.map(s => {
      const start = parseISO(s.startTime);
      const end = parseISO(s.endTime);
      // Format: "* Title, MM/DD/YYYY, HH:mm on to HH:mm"
      return `\n* ${s.title}, ${format(start, 'MM/dd/yyyy')}, ${format(start, 'HH:mm')} on to ${format(end, 'HH:mm')}`;
    }).join('');

    return `Please create Google Calendar event links for the following schedule. 
    
Events:
${eventsText}`;
  };

  const content = activeTab === 'apple' ? generateAppleList() : generateGeminiPrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 flex">
        <button
          onClick={() => setActiveTab('apple')}
          className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'apple' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalIcon size={14} />
          Apple Cal
        </button>
        <button
          onClick={() => setActiveTab('google_gemini')}
          className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'google_gemini' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Terminal size={14} />
          Google/Gemini
        </button>
      </div>

      <div className="p-4 relative group">
        <textarea
          readOnly
          value={content}
          className="w-full h-48 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none resize-none"
        />
        <div className="absolute top-6 right-6">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-white shadow-sm border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {activeTab === 'apple' 
            ? "Paste directly into Apple Calendar's Quick Entry (+ button)." 
            : "Paste this prompt into Google Gemini to generate an importable file or links."}
        </p>
      </div>
    </div>
  );
};

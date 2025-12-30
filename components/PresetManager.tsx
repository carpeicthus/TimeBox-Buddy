import React, { useState } from 'react';
import { Preset, BlockType } from '../types';
import { Plus, Tag, Clock, Play } from 'lucide-react';
import { addMinutes } from 'date-fns';

interface PresetManagerProps {
  presets: Preset[];
  onAddPreset: (preset: Preset) => void;
  onApplyPreset: (preset: Preset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ presets, onAddPreset, onApplyPreset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<Preset>>({
    name: '',
    durationMinutes: 60,
    type: BlockType.FOCUS
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreset.name) return;
    
    onAddPreset({
      id: `preset-${Date.now()}`,
      name: newPreset.name,
      durationMinutes: newPreset.durationMinutes || 60,
      type: newPreset.type || BlockType.FOCUS,
      defaultTitle: newPreset.name
    });
    setNewPreset({ name: '', durationMinutes: 60, type: BlockType.FOCUS });
    setIsOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Tag size={18} className="text-indigo-500"/>
            Quick Presets
        </h3>
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
        >
            {isOpen ? 'Cancel' : 'New Preset'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleCreate} className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
            <div>
                <input 
                    placeholder="Preset Name (e.g. Deep Work)" 
                    className="w-full text-sm p-2 rounded border border-slate-300 bg-white text-slate-900"
                    value={newPreset.name}
                    onChange={e => setNewPreset({...newPreset, name: e.target.value})}
                    autoFocus
                />
            </div>
            <div className="flex gap-2">
                <div className="flex-1">
                    <select 
                        className="w-full text-sm p-2 rounded border border-slate-300 bg-white text-slate-900"
                        value={newPreset.type}
                        onChange={e => setNewPreset({...newPreset, type: e.target.value as BlockType})}
                    >
                        {Object.values(BlockType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex-1 relative">
                    <input 
                        type="number" 
                        className="w-full text-sm p-2 rounded border border-slate-300 bg-white text-slate-900"
                        value={newPreset.durationMinutes}
                        onChange={e => setNewPreset({...newPreset, durationMinutes: parseInt(e.target.value)})}
                    />
                    <span className="absolute right-2 top-2 text-xs text-slate-400">min</span>
                </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white text-sm py-2 rounded font-medium hover:bg-indigo-700">
                Save Preset
            </button>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {presets.length === 0 && !isOpen && (
            <p className="text-xs text-slate-400 text-center py-2">No presets yet.</p>
        )}
        {presets.map(preset => (
            <div key={preset.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-700">{preset.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><Clock size={10}/> {preset.durationMinutes}m</span>
                        <span className="uppercase text-[10px] tracking-wider bg-slate-100 px-1 rounded">{preset.type}</span>
                    </div>
                </div>
                <button 
                    onClick={() => onApplyPreset(preset)}
                    className="bg-indigo-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700"
                    title="Add to end of schedule"
                >
                    <Plus size={14} />
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

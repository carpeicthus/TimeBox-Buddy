import React, { useState } from 'react';
import { format, parseISO, isSameDay, addMinutes, differenceInMinutes } from 'date-fns';
import { ScheduleItem, BlockType } from '../types';
import { Coffee, Briefcase, Home, Users, CheckCircle2, Split, Merge, Edit2, Trash2, GripVertical, Check, X } from 'lucide-react';

interface TimelineProps {
  schedule: ScheduleItem[];
  onUpdateSchedule: (newSchedule: ScheduleItem[]) => void;
}

const getBlockColor = (type: BlockType) => {
  switch (type) {
    case BlockType.FOCUS: return 'bg-indigo-50 border-indigo-200 text-indigo-900';
    case BlockType.BREAK: return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    case BlockType.ROUTINE: return 'bg-slate-50 border-slate-200 text-slate-700';
    case BlockType.SOCIAL: return 'bg-pink-50 border-pink-200 text-pink-900';
    case BlockType.ADMIN: return 'bg-amber-50 border-amber-200 text-amber-900';
    default: return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};

const getBlockIcon = (type: BlockType) => {
  switch (type) {
    case BlockType.FOCUS: return <Briefcase size={16} className="text-indigo-500" />;
    case BlockType.BREAK: return <Coffee size={16} className="text-emerald-500" />;
    case BlockType.ROUTINE: return <Home size={16} className="text-slate-500" />;
    case BlockType.SOCIAL: return <Users size={16} className="text-pink-500" />;
    case BlockType.ADMIN: return <CheckCircle2 size={16} className="text-amber-500" />;
  }
};

export const Timeline: React.FC<TimelineProps> = ({ schedule, onUpdateSchedule }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});

  const sortedSchedule = [...schedule].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;

    const newSchedule = [...sortedSchedule];
    const sourceItem = { ...newSchedule[sourceIndex] };
    const targetItem = { ...newSchedule[targetIndex] };

    const tempStart = sourceItem.startTime;
    const tempEnd = sourceItem.endTime;
    sourceItem.startTime = targetItem.startTime;
    sourceItem.endTime = targetItem.endTime;
    targetItem.startTime = tempStart;
    targetItem.endTime = tempEnd;

    newSchedule[sourceIndex] = targetItem;
    newSchedule[targetIndex] = sourceItem;

    onUpdateSchedule(newSchedule);
  };

  const handleSplit = (item: ScheduleItem) => {
    const start = parseISO(item.startTime);
    const end = parseISO(item.endTime);
    const duration = differenceInMinutes(end, start);
    
    if (duration < 10) {
        alert("Block too small to split");
        return;
    }

    const halfDuration = Math.floor(duration / 2);
    const midPoint = addMinutes(start, halfDuration);
    
    const updatedItem = { ...item, endTime: midPoint.toISOString() };
    const newItem: ScheduleItem = {
      ...item,
      id: `split-${Date.now()}`,
      startTime: midPoint.toISOString(),
      endTime: end.toISOString(),
      title: `${item.title} (Part 2)`
    };

    const newSchedule = schedule.map(s => s.id === item.id ? updatedItem : s);
    newSchedule.push(newItem);
    onUpdateSchedule(newSchedule);
  };

  const handleMerge = (index: number) => {
    const current = sortedSchedule[index];
    const next = sortedSchedule[index + 1];
    if (!next) return;

    const updatedItem = {
      ...current,
      endTime: next.endTime,
      title: `${current.title} & ${next.title}`,
      description: (current.description ? current.description + '. ' : '') + (next.description || '')
    };

    const newSchedule = schedule.filter(s => s.id !== next.id).map(s => s.id === current.id ? updatedItem : s);
    onUpdateSchedule(newSchedule);
  };

  const startEditing = (item: ScheduleItem) => {
    setEditingId(item.id);
    // Use format to get a clean local datetime string for input without manual offset math
    const formatForInput = (iso: string) => format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");

    setEditForm({
      ...item,
      startTime: formatForInput(item.startTime),
      endTime: formatForInput(item.endTime)
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    
    const newSchedule = schedule.map(s => {
      if (s.id === editingId) {
        // When parsing from datetime-local input, parse as local time
        return {
          ...s,
          ...editForm,
          startTime: new Date(editForm.startTime!).toISOString(),
          endTime: new Date(editForm.endTime!).toISOString()
        } as ScheduleItem;
      }
      return s;
    });
    
    onUpdateSchedule(newSchedule);
    setEditingId(null);
  };

  const deleteItem = (id: string) => {
    if(confirm("Delete this time block?")) {
        onUpdateSchedule(schedule.filter(s => s.id !== id));
    }
  };

  const days: { date: Date; items: ScheduleItem[]; originalIndices: number[] }[] = [];
  let currentDay = sortedSchedule.length > 0 ? parseISO(sortedSchedule[0].startTime) : new Date();
  let currentItems: ScheduleItem[] = [];
  let currentIndices: number[] = [];

  sortedSchedule.forEach((item, index) => {
    const itemDate = parseISO(item.startTime);
    if (!isSameDay(itemDate, currentDay)) {
      days.push({ date: currentDay, items: currentItems, originalIndices: currentIndices });
      currentDay = itemDate;
      currentItems = [];
      currentIndices = [];
    }
    currentItems.push(item);
    currentIndices.push(index);
  });
  if (currentItems.length > 0) days.push({ date: currentDay, items: currentItems, originalIndices: currentIndices });

  return (
    <div className="space-y-8">
      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-bold text-slate-800 text-lg">
              {format(day.date, 'EEEE, MMMM do')}
            </h3>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {day.items.length} Blocks
            </span>
          </div>

          <div className="p-4 space-y-3">
            {day.items.map((item, localIndex) => {
              const globalIndex = day.originalIndices[localIndex];
              const isEditing = editingId === item.id;
              
              const start = parseISO(item.startTime);
              const end = parseISO(item.endTime);
              const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
              
              if (isEditing) {
                return (
                  <div key={item.id} className="p-4 rounded-lg border-2 border-indigo-500 bg-white shadow-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Start</label>
                            <input 
                                type="datetime-local" 
                                value={editForm.startTime} 
                                onChange={e => setEditForm({...editForm, startTime: e.target.value})}
                                className="w-full text-sm border border-slate-300 rounded p-1 bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">End</label>
                            <input 
                                type="datetime-local" 
                                value={editForm.endTime} 
                                onChange={e => setEditForm({...editForm, endTime: e.target.value})}
                                className="w-full text-sm border border-slate-300 rounded p-1 bg-white text-slate-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Task Title</label>
                        <input 
                            type="text" 
                            value={editForm.title} 
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            className="w-full text-sm border border-slate-300 rounded p-1 font-semibold bg-white text-slate-900"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => deleteItem(item.id)} className="mr-auto text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-slate-600 hover:bg-slate-100 px-3 py-1 rounded text-sm"><X size={14}/> Cancel</button>
                        <button onClick={saveEdit} className="flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded text-sm"><Check size={14}/> Save</button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, globalIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, globalIndex)}
                  className={`relative group flex gap-4 p-3 rounded-lg border ${getBlockColor(item.type)} transition-all hover:shadow-md cursor-grab active:cursor-grabbing`}
                >
                    <div className="flex items-center justify-center text-slate-300 group-hover:text-slate-500 -ml-1">
                        <GripVertical size={16} />
                    </div>

                  <div className="flex flex-col items-center justify-start min-w-[4rem] pt-1 gap-1">
                    <span className="text-sm font-bold opacity-80">{format(start, 'HH:mm')}</span>
                    <div className="h-full w-0.5 bg-current opacity-20 rounded-full my-1"></div>
                    <span className="text-xs opacity-50">{format(end, 'HH:mm')}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getBlockIcon(item.type)}
                      <h4 className="font-semibold text-base truncate">{item.title}</h4>
                      <span className="ml-auto text-xs font-mono opacity-60 bg-white/50 px-2 py-0.5 rounded">
                        {durationMins}m
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm opacity-80 line-clamp-2">{item.description}</p>
                    )}
                    
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 shadow-sm rounded-md border border-slate-200 flex p-1 gap-1">
                        <button onClick={() => startEditing(item)} title="Edit" className="p-1 hover:bg-slate-100 rounded text-slate-600">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleSplit(item)} title="Split in half" className="p-1 hover:bg-slate-100 rounded text-slate-600">
                            <Split size={14} />
                        </button>
                        {globalIndex < sortedSchedule.length - 1 && (
                            <button onClick={() => handleMerge(globalIndex)} title="Merge with next" className="p-1 hover:bg-slate-100 rounded text-slate-600">
                                <Merge size={14} />
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export enum BlockType {
  FOCUS = 'FOCUS',
  BREAK = 'BREAK',
  ROUTINE = 'ROUTINE', // Sleep, meals, commute
  SOCIAL = 'SOCIAL',
  ADMIN = 'ADMIN'
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  type: BlockType;
  description?: string;
  notes?: string;
}

export interface Preset {
  id: string;
  name: string;
  durationMinutes: number;
  type: BlockType;
  defaultTitle?: string;
}

export interface TimeboxPlan {
  schedule: ScheduleItem[];
  summary: string;
  feedback?: string; // AI response to specific adjustments
  suggestions?: string; // Productivity/ADHD advice for the user
}

export interface AppState {
  step: 'setup' | 'planning' | 'view';
  startDate: string;
  endDate: string;
  tasks: string; // The "Brain dump"
  preferences: string; // "Early riser", "Pomodoro", etc.
  currentPlan: TimeboxPlan | null;
  isLoading: boolean;
  error: string | null;
  presets: Preset[];
}

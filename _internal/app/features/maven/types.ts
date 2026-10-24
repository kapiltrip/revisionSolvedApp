export type View =
  | 'revision'
  | 'assignments'
  | 'reviews'
  | 'ask'
  | 'capture'
  | 'updates';
export type Kind = 'ask' | 'todo' | 'review' | 'note';
export type PracticeMode = 'concept' | 'application' | 'solve' | 'speak';
export type Topic = {
  id: string;
  repository: string;
  subject: string;
  title: string;
  status: string;
  confidence: 'R' | 'H' | 'M' | null;
  priority: 'high' | 'medium' | 'normal';
  target_date: string | null;
  next_due_at: string | null;
  last_revised_at: string | null;
  revision_count: number;
  recall_streak: number;
  proof: string;
  notes: string;
  urgency_override: 'urgent' | 'soon' | 'ready' | null;
  estimated_minutes: number;
  source_url: string | null;
};
export type Revision = {
  id: number;
  topic_id: string;
  mark: 'R' | 'H' | 'M';
  revised_at: string;
  next_due_at: string;
  proof: string;
  notes: string;
  duration_minutes: number;
  reflection: string;
  repair_action: string;
  mistake_category: string;
  mood: string;
  created_at: string;
};
export type Settings = {
  urgent_window_days: number;
  yellow_window_days: number;
  missed_interval_days: number;
  hesitant_interval_days: number;
  recalled_first_days: number;
  recalled_second_days: number;
  recalled_mastered_days: number;
  daily_goal_minutes: number;
  focus_block_minutes: number;
};
export type Entry = {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  assignment_number: number | null;
  question_number: number | null;
  status: string;
  answer: string;
  trainer: string;
  review_date: string | null;
  repair_action: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};
export type Attachment = {
  id: string;
  entry_id: string;
  name: string;
  mime_type: string;
  byte_length: number;
  sha256: string;
};
export type Workspace = {
  storageScope?: 'local' | 'hosted';
  serverTime?: string;
  profile: { current_assignment: number; updated_at: string };
  entries: Entry[];
  attachments: Attachment[];
  events: Array<{ id: string; message: string; created_at: string }>;
  archive: Array<{ source_table: string; count: number }>;
};
export type Question = {
  id: string;
  number: number;
  title: string;
  images: Array<{ src: string; alt: string; kind: string }>;
  html: string;
  sourceUrl: string;
};
export type Material = {
  number: number;
  title: string;
  questions: Question[];
  extraHtml: string;
};
export const emptyWorkspace: Workspace = {
  profile: { current_assignment: 7, updated_at: '' },
  entries: [],
  attachments: [],
  events: [],
  archive: [],
};
export const defaultSettings: Settings = {
  urgent_window_days: 0,
  yellow_window_days: 3,
  missed_interval_days: 1,
  hesitant_interval_days: 3,
  recalled_first_days: 7,
  recalled_second_days: 14,
  recalled_mastered_days: 30,
  daily_goal_minutes: 60,
  focus_block_minutes: 30,
};

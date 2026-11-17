export type ModuleId =
  | 'knee-mri'
  | 'carotid-doppler'
  | 'temporal-bone'
  | 'thyroid-tirads'
  | 'liver-lirads';

export type ThemeMode = 'obsidian' | 'parchment';

export type ExamTrack = 'ABR Core' | 'FRCR 2B' | 'EDiR';

export interface ExamPearl {
  id: string;
  track: ExamTrack;
  title: string;
  summary: string;
  keySign?: string;
}

export interface StructuredReport {
  title: string;
  modality: string;
  categoryBadge: string;
  categoryTone: 'normal' | 'info' | 'warning' | 'critical';
  technique: string;
  findings: string[];
  impression: string[];
  recommendation: string;
  metricsSummary: Array<{ label: string; value: string }>;
}

export interface SearchEntry {
  id: string;
  moduleId: ModuleId;
  category: 'Module' | 'Structure' | 'Pathology' | 'Calculator' | 'Exam Pearl';
  title: string;
  subtitle: string;
  keywords: string[];
  presetAction?: string;
}

export interface ModuleMeta {
  id: ModuleId;
  shortTitle: string;
  title: string;
  subtitle: string;
  modalityTag: string;
  accentColor: string;
  description: string;
  structuresCount: number;
  pearls: ExamPearl[];
}

export interface ReelFrameScript {
  title: string;
  hookCaption: string;
  pearlCaption: string;
  durationSec: number;
  steps: Array<{
    t: number; // 0..1 normalized progress
    cameraAzimuth: number;
    cameraPolar: number;
    label: string;
    caption: string;
  }>;
}

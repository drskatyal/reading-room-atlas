import {
  Activity,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers2,
  Maximize2,
  Moon,
  Sun,
} from 'lucide-react';
import type { AppWorkspaceMode, ThemeMode } from '../types/atlas';

interface TopModuleBarProps {
  workspaceMode: AppWorkspaceMode;
  onChangeWorkspaceMode: (mode: AppWorkspaceMode) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const MODE_TABS: Array<{ id: AppWorkspaceMode; label: string }> = [
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'fullscreen-3d', label: '3D Full Screen' },
  { id: 'pathology', label: 'Pathologies' },
  { id: 'report-guide', label: 'How to Report MRI' },
  { id: 'quiz', label: 'Quiz' },
];

export function TopModuleBar({
  workspaceMode,
  onChangeWorkspaceMode,
  drawerOpen,
  onToggleDrawer,
  theme,
  onToggleTheme,
}: TopModuleBarProps) {
  const showDictation = workspaceMode === 'anatomy' || workspaceMode === 'pathology';

  return (
    <header className="top-nav-shell">
      <div className="atlas-topbar">
        <div className="brand-lockup">
          <h1 className="brand-title">ReadingRoom Atlas</h1>
          <span className="brand-pill">3T Knee</span>
        </div>

        <nav className="track-tabs" role="tablist" aria-label="Workspace modes">
          {MODE_TABS.map((tab) => {
            const active = workspaceMode === tab.id;
            const Icon =
              tab.id === 'anatomy'
                ? Layers2
                : tab.id === 'fullscreen-3d'
                  ? Maximize2
                  : tab.id === 'pathology'
                    ? Activity
                    : tab.id === 'report-guide'
                      ? BookOpen
                      : GraduationCap;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`track-tab ${active ? 'active' : ''}`}
                onClick={() => onChangeWorkspaceMode(tab.id)}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="topbar-actions">
          {showDictation && (
            <button
              type="button"
              className={`chip-btn ${drawerOpen ? 'active' : ''}`}
              onClick={onToggleDrawer}
              title="Open structured dictation & board pearls (R)"
            >
              <FileText size={13} />
              <span>Dictation</span>
            </button>
          )}

          {workspaceMode === 'report-guide' && (
            <button
              type="button"
              className="chip-btn"
              onClick={() => onChangeWorkspaceMode('pathology')}
              title="Jump back to 3D + MRI pathologies"
            >
              <ClipboardCheck size={13} />
              <span>Open Viewer</span>
            </button>
          )}

          <button
            type="button"
            className="chip-btn"
            onClick={onToggleTheme}
            title="Toggle PACS Darkroom / Monograph light mode"
            aria-label="Toggle theme"
          >
            {theme === 'darkroom' ? <Sun size={13} /> : <Moon size={13} />}
            <span>{theme === 'darkroom' ? 'Monograph' : 'Darkroom'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

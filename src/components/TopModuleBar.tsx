import {
  Activity,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Home,
  Layers2,
  Maximize2,
  Moon,
  Sun,
} from 'lucide-react';
import type { AppWorkspaceMode, JointAtlasDefinition, JointId, ThemeMode } from '../types/atlas';

interface TopModuleBarProps {
  activeJoint: JointAtlasDefinition;
  joints: JointAtlasDefinition[];
  onChangeJoint: (jointId: JointId) => void;
  workspaceMode: AppWorkspaceMode;
  onChangeWorkspaceMode: (mode: AppWorkspaceMode) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const MODE_TABS: Array<{ id: Exclude<AppWorkspaceMode, 'landing'>; label: string }> = [
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'fullscreen-3d', label: '3D Full Screen' },
  { id: 'pathology', label: 'Pathologies' },
  { id: 'report-guide', label: 'How to Report MRI' },
  { id: 'quiz', label: 'Quiz' },
];

export function TopModuleBar({
  activeJoint,
  joints,
  onChangeJoint,
  workspaceMode,
  onChangeWorkspaceMode,
  theme,
  onToggleTheme,
}: TopModuleBarProps) {
  const isLanding = workspaceMode === 'landing';

  return (
    <header className="top-nav-shell">
      <div className="atlas-topbar">
        <div className="brand-lockup">
          <button
            type="button"
            className="brand-home-btn"
            onClick={() => onChangeWorkspaceMode('landing')}
            title="Return to ReadingRoom Atlas overview"
          >
            <h1 className="brand-title">ReadingRoom Atlas</h1>
          </button>

          {!isLanding ? (
            <>
              <button
                type="button"
                className="chip-btn topbar-home-pill"
                onClick={() => onChangeWorkspaceMode('landing')}
                title="View all 6 joint atlases & modules"
              >
                <Home size={12} />
                <span>All Joints</span>
              </button>
              <select
                className="joint-select"
                value={activeJoint.id}
                onChange={(e) => onChangeJoint(e.target.value as JointId)}
                aria-label="Switch joint atlas"
              >
                {joints.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.shortName} · {j.scannerBadge}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className="brand-pill">6-Joint 3T MSK Platform</span>
          )}
        </div>

        {isLanding ? (
          <nav className="track-tabs" aria-label="Quick joint atlas launch">
            {joints.map((j) => (
              <button
                key={j.id}
                type="button"
                className="track-tab"
                onClick={() => onChangeJoint(j.id)}
              >
                <span>{j.shortName}</span>
              </button>
            ))}
          </nav>
        ) : (
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
        )}

        <div className="topbar-actions">
          {workspaceMode === 'report-guide' && (
            <button
              type="button"
              className="chip-btn"
              onClick={() => onChangeWorkspaceMode('pathology')}
              title="Open 3D + MRI viewer"
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

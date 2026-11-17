import {
  Crosshair,
  Film,
  Maximize2,
  Minimize2,
  Moon,
  MonitorOff,
  Search,
  Sun,
} from 'lucide-react';
import { MODULES_CATALOG } from '../data/modulesCatalog';
import type { ModuleId, ThemeMode } from '../types/radiology';

interface TopBarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  presenterMode: boolean;
  onTogglePresenter: () => void;
  onTriggerBlank: () => void;
  onOpenSearch: () => void;
  onOpenReelStudio: () => void;
}

export function TopBar({
  activeModule,
  onSelectModule,
  theme,
  onToggleTheme,
  presenterMode,
  onTogglePresenter,
  onTriggerBlank,
  onOpenSearch,
  onOpenReelStudio,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-cluster">
        <div className="brand-mark" aria-hidden="true">
          <Crosshair size={16} />
        </div>
        <div className="brand-titles">
          <span className="brand-name">ReadingRoom Atlas</span>
          <span className="brand-sub">3D Anatomy • PACS Physics • Sign-Out</span>
        </div>
      </div>

      <nav className="module-nav" aria-label="Clinical Modules">
        {MODULES_CATALOG.map((mod, idx) => (
          <button
            key={mod.id}
            id={`nav-module-${mod.id}`}
            type="button"
            className={`module-tab ${activeModule === mod.id ? 'active' : ''}`}
            onClick={() => onSelectModule(mod.id)}
          >
            <span className="module-tab-num">0{idx + 1}</span>
            <span>{mod.shortTitle}</span>
            <span className="module-tab-mod">{mod.modalityTag}</span>
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          id="btn-global-search"
          type="button"
          className="search-trigger"
          onClick={onOpenSearch}
          title="Search structures, RADS calculators, and exam pearls (Ctrl+K)"
        >
          <Search size={14} />
          <span>Search</span>
          <span className="kbd">Ctrl+K</span>
        </button>

        <button
          id="btn-reel-studio"
          type="button"
          className="icon-btn"
          onClick={onOpenReelStudio}
          title="Export 9:16 Instagram Reel / Teaching Clip"
        >
          <Film size={14} />
          <span>Reel</span>
        </button>

        <button
          id="btn-theme-toggle"
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'obsidian' ? 'Switch to Parchment Light Mode' : 'Switch to Obsidian Dark Mode'}
        >
          {theme === 'obsidian' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          id="btn-presenter-mode"
          type="button"
          className={`icon-btn ${presenterMode ? 'active' : ''}`}
          onClick={onTogglePresenter}
          title="Fullscreen Presenter Mode (F)"
        >
          {presenterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        <button
          id="btn-blank-screen"
          type="button"
          className="icon-btn"
          onClick={onTriggerBlank}
          title="Blank Screen for Case Conference (B)"
        >
          <MonitorOff size={14} />
        </button>
      </div>
    </header>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { ReelStudioModal } from './components/ReelStudioModal';
import { SignOutSidecar } from './components/SignOutSidecar';
import { TopBar } from './components/TopBar';
import { MODULES_CATALOG } from './data/modulesCatalog';
import { CarotidDopplerModule } from './modules/CarotidDopplerModule';
import { KneeMriModule } from './modules/KneeMriModule';
import { LiverLiradsModule } from './modules/LiverLiradsModule';
import { TemporalBoneModule } from './modules/TemporalBoneModule';
import { ThyroidTiradsModule } from './modules/ThyroidTiradsModule';
import type { ModuleId, StructuredReport, ThemeMode } from './types/radiology';

const INITIAL_REPORT: StructuredReport = {
  title: 'Loading Module...',
  modality: 'Workstation',
  categoryBadge: 'Ready',
  categoryTone: 'info',
  technique: '',
  findings: [],
  impression: [],
  recommendation: '',
  metricsSummary: [],
};

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('knee-mri');
  const [presetTrigger, setPresetTrigger] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<ThemeMode>('obsidian');
  const [sidecarCollapsed, setSidecarCollapsed] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);
  const [screenBlanked, setScreenBlanked] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [report, setReport] = useState<StructuredReport>(INITIAL_REPORT);
  const [toast, setToast] = useState<string | null>(null);

  const canvasGettersRef = useRef<{
    get3d: () => HTMLCanvasElement | null;
    get2d: () => HTMLCanvasElement | null;
  }>({
    get3d: () => null,
    get2d: () => null,
  });

  const handleExposeCanvases = useCallback(
    (get3d: () => HTMLCanvasElement | null, get2d: () => HTMLCanvasElement | null) => {
      canvasGettersRef.current = { get3d, get2d };
    },
    []
  );

  // Sync theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const togglePresenter = useCallback(() => {
    setPresenterMode((prev) => {
      const next = !prev;
      if (next && document.fullscreenEnabled && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      showToast(next ? 'Presenter Mode On (Press F to exit)' : 'Workstation Mode Restored');
      return next;
    });
  }, [showToast]);

  // Global keyboard shortcuts: Ctrl+K, F, B, 1-5
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
        return;
      }

      if (isTyping || searchOpen || reelOpen) return;

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        togglePresenter();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setScreenBlanked((b) => !b);
      } else if (e.key === 'Escape' && screenBlanked) {
        setScreenBlanked(false);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const mod = MODULES_CATALOG[Number(e.key) - 1];
        if (mod) {
          setActiveModule(mod.id);
          setPresetTrigger(undefined);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, reelOpen, screenBlanked, togglePresenter]);

  const activeMeta = useMemo(
    () => MODULES_CATALOG.find((m) => m.id === activeModule) ?? MODULES_CATALOG[0],
    [activeModule]
  );

  const handleSelectModule = (id: ModuleId, preset?: string) => {
    setActiveModule(id);
    setPresetTrigger(preset);
  };

  return (
    <div className="app-shell">
      <TopBar
        activeModule={activeModule}
        onSelectModule={(id) => handleSelectModule(id)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'obsidian' ? 'parchment' : 'obsidian'))}
        presenterMode={presenterMode}
        onTogglePresenter={togglePresenter}
        onTriggerBlank={() => setScreenBlanked(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenReelStudio={() => setReelOpen(true)}
      />

      <div
        key={activeModule}
        className={`workspace-frame ${sidecarCollapsed ? 'sidecar-collapsed' : ''} ${presenterMode ? 'presenter-mode' : ''}`}
      >
        <div className="module-stage-transition">
          {activeModule === 'knee-mri' && (
            <KneeMriModule
              presetTrigger={presetTrigger}
              onReportChange={setReport}
              onExposeCanvases={handleExposeCanvases}
            />
          )}
          {activeModule === 'carotid-doppler' && (
            <CarotidDopplerModule
              presetTrigger={presetTrigger}
              onReportChange={setReport}
              onExposeCanvases={handleExposeCanvases}
            />
          )}
          {activeModule === 'temporal-bone' && (
            <TemporalBoneModule
              presetTrigger={presetTrigger}
              onReportChange={setReport}
              onExposeCanvases={handleExposeCanvases}
            />
          )}
          {activeModule === 'thyroid-tirads' && (
            <ThyroidTiradsModule
              presetTrigger={presetTrigger}
              onReportChange={setReport}
              onExposeCanvases={handleExposeCanvases}
            />
          )}
          {activeModule === 'liver-lirads' && (
            <LiverLiradsModule
              presetTrigger={presetTrigger}
              onReportChange={setReport}
              onExposeCanvases={handleExposeCanvases}
            />
          )}
        </div>

        {!presenterMode && (
          <SignOutSidecar
            report={report}
            pearls={activeMeta.pearls}
            collapsed={sidecarCollapsed}
            onToggleCollapse={() => setSidecarCollapsed((c) => !c)}
          />
        )}
      </div>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectEntry={(modId, preset) => handleSelectModule(modId, preset)}
      />

      <ReelStudioModal
        open={reelOpen}
        onClose={() => setReelOpen(false)}
        moduleId={activeModule}
        get3DCanvas={() => canvasGettersRef.current.get3d()}
        get2DCanvas={() => canvasGettersRef.current.get2d()}
      />

      {screenBlanked && (
        <div
          className="blank-overlay"
          role="button"
          tabIndex={0}
          onClick={() => setScreenBlanked(false)}
          onKeyDown={() => setScreenBlanked(false)}
        >
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#d4a853' }}>
            Conference Screen Blanked
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            Press B, Esc, or Click anywhere to resume
          </div>
        </div>
      )}

      {toast && <div className="toast-pill">{toast}</div>}
    </div>
  );
}

export default App;

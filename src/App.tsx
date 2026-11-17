import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Moon, Sun } from 'lucide-react';
import { ChapterBar } from './components/ChapterBar';
import { KneeSpecimen3D } from './components/KneeSpecimen3D';
import { RealKneeMriViewer } from './components/RealKneeMriViewer';
import { SignOutDrawer } from './components/SignOutDrawer';
import { computeKneeKinematics } from './core/coordinates';
import { buildKneeFellowshipReport, KNEE_CHAPTERS } from './data/kneeClinicalAtlas';
import type {
  KneeChapterId,
  KneeLandmarks,
  MriContrastPreset,
  MriPlaneMode,
  StructureId,
  ThemeMode,
  TissueVisibility,
} from './types/atlas';

export function App() {
  const [landmarks, setLandmarks] = useState<KneeLandmarks | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('darkroom');
  const [chapterId, setChapterId] = useState<KneeChapterId>('normal-anatomy');
  const [flexionDeg, setFlexionDeg] = useState<number>(4);
  const [contrastPreset, setContrastPreset] = useState<MriContrastPreset>('qdess-clinical');
  const [planeMode, setPlaneMode] = useState<MriPlaneMode>('sagittal');
  const [activeStructure, setActiveStructure] = useState<StructureId>('ACL');
  const [targetRasMm, setTargetRasMm] = useState<[number, number, number] | null>(null);
  const [mriCrosshairRas, setMriCrosshairRas] = useState<[number, number, number] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [visibility, setVisibility] = useState<TissueVisibility>({
    bones: true,
    xrayBones: false,
    extensor: true,
    cartilage: true,
    thicknessMap: false,
    menisci: true,
    cruciates: true,
    collaterals: true,
    callouts: false,
    crossSection: false,
  });

  // Sync theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch co-registered OpenMSK Right-Knee landmarks & quantitative chondral telemetry
  useEffect(() => {
    let active = true;
    fetch('/data/knee-landmarks.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<KneeLandmarks>;
      })
      .then((data) => {
        if (!active) return;
        setLandmarks(data);
        const initial = data.structures.ACL?.centroidRas ?? data.jointCenterRas;
        setTargetRasMm(initial);
        setMriCrosshairRas(initial);
      })
      .catch(() => {
        // Landmarks fetch errors handled gracefully via fallbacks
      });
    return () => {
      active = false;
    };
  }, []);

  const chapter = useMemo(
    () => KNEE_CHAPTERS.find((c) => c.id === chapterId) ?? KNEE_CHAPTERS[0],
    [chapterId]
  );

  const kinematics = useMemo(
    () =>
      computeKneeKinematics(
        flexionDeg,
        chapterId,
        landmarks?.threeScale ?? 0.04,
        landmarks?.laterality ?? 'Right'
      ),
    [flexionDeg, chapterId, landmarks?.threeScale, landmarks?.laterality]
  );

  const report = useMemo(
    () => buildKneeFellowshipReport(chapterId, flexionDeg, kinematics.anteriorDrawerMm),
    [chapterId, flexionDeg, kinematics.anteriorDrawerMm]
  );

  const selectChapter = useCallback(
    (id: KneeChapterId) => {
      const next = KNEE_CHAPTERS.find((c) => c.id === id);
      if (!next) return;
      setChapterId(next.id);
      setFlexionDeg(next.defaultFlexionDeg);
      setContrastPreset(next.defaultContrast);
      setPlaneMode(next.defaultPlane);
      setActiveStructure(next.focusStructure);
      setVisibility((prev) => ({
        ...prev,
        extensor: id === 'normal-anatomy',
        xrayBones: id === 'bucket-handle' || id === 'acl-rupture' || id === 'pcl-dashboard',
      }));
      const lm = landmarks?.structures[next.focusStructure]?.centroidRas;
      if (lm) {
        setTargetRasMm(lm);
      }
    },
    [landmarks]
  );

  const toggleVisibility = useCallback((key: keyof TissueVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Keyboard shortcuts: 1-6 Chapters | X X-ray Bone | T Thickness Map | L Labels | S MRI Cut | R Dictation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const ch = KNEE_CHAPTERS[Number(e.key) - 1];
        if (ch) selectChapter(ch.id);
      } else if (e.key.toLowerCase() === 'x') {
        toggleVisibility('xrayBones');
      } else if (e.key.toLowerCase() === 't') {
        toggleVisibility('thicknessMap');
      } else if (e.key.toLowerCase() === 'l') {
        toggleVisibility('callouts');
      } else if (e.key.toLowerCase() === 's') {
        toggleVisibility('crossSection');
      } else if (e.key.toLowerCase() === 'r') {
        setDrawerOpen((o) => !o);
      } else if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, selectChapter, toggleVisibility]);

  const handleSelectFrom3D = useCallback((id: StructureId, centroidRas: [number, number, number]) => {
    setActiveStructure(id);
    setTargetRasMm(centroidRas);
  }, []);

  return (
    <div className="atlas-shell">
      <header className="atlas-topbar">
        <div className="brand-lockup">
          <h1 className="brand-title">ReadingRoom Atlas</h1>
          <span className="brand-subtitle">
            Knee 3T MRI &amp; Meniscal / Cruciate Biomechanics
          </span>
        </div>

        <div className="topbar-meta">
          <span className="specimen-chip" title="Stanford OpenMSK In-Vivo 3T qDESS + Open Knee(s)">
            In-Vivo 3.0T qDESS · Right Knee
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'darkroom' ? 'monograph' : 'darkroom'))}
            aria-label="Toggle Darkroom or Monograph theme"
          >
            {theme === 'darkroom' ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === 'darkroom' ? 'Monograph' : 'Darkroom'}</span>
          </button>
          <button
            type="button"
            className="icon-btn primary"
            onClick={() => setDrawerOpen(true)}
          >
            <FileText size={14} />
            <span>Dictation &amp; Pearls</span>
          </button>
        </div>
      </header>

      <main className="atlas-stage-grid">
        <KneeSpecimen3D
          landmarks={landmarks}
          chapter={chapter}
          kinematics={kinematics}
          theme={theme}
          activeStructure={activeStructure}
          onSelectStructure={handleSelectFrom3D}
          visibility={visibility}
          onToggleVisibility={toggleVisibility}
          mriPlaneMode={planeMode}
          mriCrosshairRas={mriCrosshairRas}
        />

        <RealKneeMriViewer
          landmarks={landmarks}
          contrastPreset={contrastPreset}
          onContrastChange={setContrastPreset}
          planeMode={planeMode}
          onPlaneModeChange={setPlaneMode}
          activeStructure={activeStructure}
          targetRasMm={targetRasMm}
          onRasCrosshairChange={setMriCrosshairRas}
          onSelectStructureFromMri={setActiveStructure}
        />
      </main>

      <ChapterBar
        chapters={KNEE_CHAPTERS}
        activeChapterId={chapterId}
        onSelectChapter={selectChapter}
        flexionDeg={flexionDeg}
        onChangeFlexion={setFlexionDeg}
        kinematics={kinematics}
      />

      <SignOutDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        chapter={chapter}
        report={report}
      />
    </div>
  );
}

export default App;

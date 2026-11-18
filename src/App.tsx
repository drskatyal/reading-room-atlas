import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnatomySidebar } from './components/AnatomySidebar';
import { EditorialGuidePanel } from './components/EditorialGuidePanel';
import { FullScreen3DOverlay } from './components/FullScreen3DView';
import { KneeSpecimen3D } from './components/KneeSpecimen3D';
import { MriReportingGuidePage } from './components/MriReportingGuidePage';
import { PathologySidebar } from './components/PathologySidebar';
import { RealKneeMriViewer } from './components/RealKneeMriViewer';
import { TopModuleBar } from './components/TopModuleBar';
import { computeKneeKinematics } from './core/coordinates';
import {
  ALL_STRUCTURE_IDS,
  ANATOMY_SYSTEM_GROUPS,
  LAYER_GROUPS,
  modeToPath,
  PATIENT_DEMO_PRESETS,
  pathToMode,
} from './data/anatomyAndReportingData';
import {
  KNEE_MODULES,
  RESIDENT_QUIZ_QUESTIONS,
} from './data/kneeClinicalAtlas';
import type {
  AnatomyLandmarkItem,
  AppWorkspaceMode,
  CameraPresetKey,
  KneeLandmarks,
  KneeModule,
  KneeModuleId,
  LayerSelectMode,
  MriAnnotation,
  MriContrastPreset,
  MriOverlayMode,
  MriPlaneMode,
  PatientDemoPreset,
  ResidentQuizQuestion,
  SpecimenViewMode,
  StructureId,
  ThemeMode,
  TissueGroup,
  TissueVisibility,
} from './types/atlas';

const BASE_VISIBILITY: TissueVisibility = {
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
};

const INITIAL_ANATOMY_LANDMARK = ANATOMY_SYSTEM_GROUPS[0].entries[0].defaultLandmark;
const FIRST_PATHOLOGY_MODULE =
  KNEE_MODULES.find((m) => m.category === 'pathology') ?? KNEE_MODULES[0];

function findDefaultLandmarkForStructure(sid: StructureId): AnatomyLandmarkItem {
  for (const group of ANATOMY_SYSTEM_GROUPS) {
    for (const entry of group.entries) {
      if (entry.structureId === sid) return entry.defaultLandmark;
    }
  }
  return INITIAL_ANATOMY_LANDMARK;
}

export function App() {
  const [landmarks, setLandmarks] = useState<KneeLandmarks | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<AppWorkspaceMode>(() =>
    typeof window !== 'undefined' ? pathToMode(window.location.pathname) : 'anatomy'
  );
  const [lastDualMode, setLastDualMode] = useState<'anatomy' | 'pathology'>('anatomy');
  const [theme, setTheme] = useState<ThemeMode>('darkroom');
  const fsHostRef = useRef<HTMLDivElement | null>(null);

  // Module & sub-step state (Pathology, Fullscreen Demo, Quiz)
  const [moduleId, setModuleId] = useState<KneeModuleId>(() =>
    typeof window !== 'undefined' && pathToMode(window.location.pathname) === 'pathology'
      ? FIRST_PATHOLOGY_MODULE.id
      : 'normal-overview'
  );
  const [subStepIndex, setSubStepIndex] = useState(0);

  // Individual structure visibility + Multi/Single layer mode
  const [enabledStructures, setEnabledStructures] = useState<Set<StructureId>>(
    () => new Set(ALL_STRUCTURE_IDS)
  );
  const [layerMode, setLayerMode] = useState<LayerSelectMode>('multiple');

  // Anatomy mode state
  const [activeLandmark, setActiveLandmark] = useState<AnatomyLandmarkItem>(
    INITIAL_ANATOMY_LANDMARK
  );
  const [customMriAnnotations, setCustomMriAnnotations] = useState<MriAnnotation[] | undefined>(
    INITIAL_ANATOMY_LANDMARK.mriAnnotations
  );
  const [mriOverlayMode, setMriOverlayMode] = useState<MriOverlayMode>('none');
  const [activeDemoPresetId, setActiveDemoPresetId] = useState<string>(
    PATIENT_DEMO_PRESETS[0].id
  );
  const [hideFull3DPins, setHideFull3DPins] = useState(false);

  // Synchronized 3D + MRI state
  const [viewMode, setViewMode] = useState<SpecimenViewMode>(
    INITIAL_ANATOMY_LANDMARK.viewMode3D
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPresetKey>(
    INITIAL_ANATOMY_LANDMARK.cameraPreset
  );
  const [cameraDistanceScale, setCameraDistanceScale] = useState<number>(
    INITIAL_ANATOMY_LANDMARK.cameraDistanceScale ?? 1.05
  );
  const [cameraTrigger, setCameraTrigger] = useState(1);

  const [mriPlane, setMriPlane] = useState<MriPlaneMode>(INITIAL_ANATOMY_LANDMARK.mriPlane);
  const [mriContrast, setMriContrast] = useState<MriContrastPreset>(
    INITIAL_ANATOMY_LANDMARK.mriContrast
  );
  const [mriZoom, setMriZoom] = useState<number>(INITIAL_ANATOMY_LANDMARK.mriZoom);

  const [flexionDeg, setFlexionDeg] = useState<number>(6);
  const [patellaSubluxation, setPatellaSubluxation] = useState<number>(0);

  const [activeStructure, setActiveStructure] = useState<StructureId>(
    INITIAL_ANATOMY_LANDMARK.structureId
  );
  const [targetRasOverride, setTargetRasOverride] = useState<[number, number, number] | undefined>(
    INITIAL_ANATOMY_LANDMARK.targetRas
  );
  const [targetBadge, setTargetBadge] = useState<string | undefined>(INITIAL_ANATOMY_LANDMARK.label);
  const [mriSliceRas, setMriSliceRas] = useState<[number, number, number]>([112.6, 20.6, -11.9]);

  const [showTargetPointer, setShowTargetPointer] = useState(true);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showSlicePlane, setShowSlicePlane] = useState(false);

  // Active Recall Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Load OpenMSK 3T landmarks JSON once
  useEffect(() => {
    let cancelled = false;
    fetch('/data/knee-landmarks.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<KneeLandmarks>;
      })
      .then((data) => {
        if (cancelled) return;
        setLandmarks(data);
        setMriSliceRas(data.jointCenterRas);
      })
      .catch(() => {
        // Fallback Right-knee landmarks exist inside viewer helpers
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const activeModule = useMemo<KneeModule>(
    () => KNEE_MODULES.find((m) => m.id === moduleId) ?? FIRST_PATHOLOGY_MODULE,
    [moduleId]
  );

  const activeSubStep = useMemo(
    () => activeModule.subSteps[subStepIndex] ?? activeModule.subSteps[0],
    [activeModule, subStepIndex]
  );

  const activeQuiz = useMemo<ResidentQuizQuestion>(
    () => RESIDENT_QUIZ_QUESTIONS[quizIndex] ?? RESIDENT_QUIZ_QUESTIONS[0],
    [quizIndex]
  );

  const quizHideTarget =
    workspaceMode === 'quiz' && quizAnswers[activeQuiz.id] === undefined;

  const pushRouteForMode = useCallback((mode: AppWorkspaceMode) => {
    if (typeof window === 'undefined') return;
    const nextPath = modeToPath(mode);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
  }, []);

  const enableAllStructures = useCallback(() => {
    setEnabledStructures(new Set(ALL_STRUCTURE_IDS));
  }, []);

  const handleToggleStructure = useCallback(
    (id: StructureId) => {
      if (layerMode === 'single') {
        setEnabledStructures(new Set([id]));
        return;
      }
      setEnabledStructures((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [layerMode]
  );

  const handleIsolateStructure = useCallback((id: StructureId) => {
    setEnabledStructures(new Set([id]));
  }, []);

  const applyAnatomyLandmark = useCallback((item: AnatomyLandmarkItem) => {
    setActiveLandmark(item);
    setCustomMriAnnotations(item.mriAnnotations);
    setModuleId('normal-overview');
    setSubStepIndex(0);
    setViewMode(item.viewMode3D);
    setCameraPreset(item.cameraPreset);
    setCameraDistanceScale(item.cameraDistanceScale ?? 1.04);
    setCameraTrigger((t) => t + 1);
    setMriPlane(item.mriPlane);
    setMriContrast(item.mriContrast);
    setMriZoom(item.mriZoom);
    setFlexionDeg(6);
    setPatellaSubluxation(0);
    setActiveStructure(item.structureId);
    setTargetRasOverride(item.targetRas);
    setTargetBadge(item.label);
    setEnabledStructures((prev) => {
      if (prev.has(item.structureId)) return prev;
      const next = new Set(prev);
      next.add(item.structureId);
      return next;
    });
  }, []);

  const handleToggleLayerGroup = useCallback(
    (groupId: TissueGroup) => {
      const group = LAYER_GROUPS.find((g) => g.id === groupId);
      if (!group) return;

      if (layerMode === 'single') {
        setEnabledStructures(new Set(group.structures));
        if (workspaceMode === 'anatomy' && group.structures.length > 0) {
          applyAnatomyLandmark(findDefaultLandmarkForStructure(group.structures[0]));
        }
        return;
      }

      setEnabledStructures((prev) => {
        const next = new Set(prev);
        const allOn = group.structures.every((s) => next.has(s));
        for (const s of group.structures) {
          if (allOn) next.delete(s);
          else next.add(s);
        }
        return next;
      });
    },
    [layerMode, workspaceMode, applyAnatomyLandmark]
  );

  const applySubStep = useCallback((mod: KneeModule, nextIdx: number) => {
    const safeIdx = Math.max(0, Math.min(mod.subSteps.length - 1, nextIdx));
    const step = mod.subSteps[safeIdx];
    setCustomMriAnnotations(undefined);
    setModuleId(mod.id);
    setSubStepIndex(safeIdx);
    setViewMode(step.viewMode3D);
    setCameraPreset(step.cameraPreset);
    setCameraDistanceScale(step.cameraDistanceScale ?? 1.05);
    setCameraTrigger((t) => t + 1);
    setMriPlane(step.mriPlane);
    setMriContrast(step.mriContrast);
    setMriZoom(step.mriZoom);
    setFlexionDeg(step.flexionDeg);
    setPatellaSubluxation(step.patellaSubluxation ?? 0);
    setActiveStructure(step.focusStructure);
    setTargetRasOverride(step.targetRasOverride);
    setTargetBadge(step.targetBadge);
  }, []);

  const applyQuizQuestion = useCallback((idx: number) => {
    const safeIdx = Math.max(0, Math.min(RESIDENT_QUIZ_QUESTIONS.length - 1, idx));
    const q = RESIDENT_QUIZ_QUESTIONS[safeIdx];
    setCustomMriAnnotations(undefined);
    setQuizIndex(safeIdx);
    setModuleId(q.moduleId);
    setViewMode(q.viewMode3D);
    setCameraPreset(q.cameraPreset);
    setCameraDistanceScale(q.cameraDistanceScale ?? 1.05);
    setCameraTrigger((t) => t + 1);
    setMriPlane(q.mriPlane);
    setMriContrast(q.mriContrast);
    setMriZoom(q.mriZoom);
    setFlexionDeg(q.flexionDeg);
    setPatellaSubluxation(q.patellaSubluxation ?? 0);
    setActiveStructure(q.targetStructure ?? 'ACL');
    setTargetRasOverride(q.targetRasOverride);
    setTargetBadge(q.targetBadge);
  }, []);

  const handleSelectPathologyModule = useCallback(
    (id: KneeModuleId) => {
      const mod = KNEE_MODULES.find((m) => m.id === id);
      if (mod) {
        enableAllStructures();
        applySubStep(mod, 0);
        const matchPreset = PATIENT_DEMO_PRESETS.find((p) => p.moduleId === mod.id);
        if (matchPreset) setActiveDemoPresetId(matchPreset.id);
      }
    },
    [enableAllStructures, applySubStep]
  );

  const handleSelectPatientPreset = useCallback(
    (preset: PatientDemoPreset) => {
      setActiveDemoPresetId(preset.id);
      const mod = KNEE_MODULES.find((m) => m.id === preset.moduleId);
      if (mod) {
        applySubStep(mod, preset.subStepIndex);
      }
    },
    [applySubStep]
  );

  const handleWorkspaceModeChange = useCallback(
    (mode: AppWorkspaceMode) => {
      setWorkspaceMode(mode);
      pushRouteForMode(mode);
      if (mode === 'anatomy' || mode === 'pathology') {
        setLastDualMode(mode);
      }

      if (mode === 'anatomy') {
        applyAnatomyLandmark(activeLandmark);
        return;
      }
      if (mode === 'pathology') {
        enableAllStructures();
        const mod =
          activeModule.category === 'pathology' ? activeModule : FIRST_PATHOLOGY_MODULE;
        applySubStep(mod, activeModule.category === 'pathology' ? subStepIndex : 0);
        return;
      }
      if (mode === 'quiz') {
        enableAllStructures();
        applyQuizQuestion(quizIndex);
        return;
      }
      if (mode === 'fullscreen-3d') {
        const preset =
          PATIENT_DEMO_PRESETS.find((p) => p.moduleId === moduleId) ??
          PATIENT_DEMO_PRESETS[0];
        setActiveDemoPresetId(preset.id);
      }
    },
    [
      pushRouteForMode,
      applyAnatomyLandmark,
      activeLandmark,
      enableAllStructures,
      activeModule,
      applySubStep,
      subStepIndex,
      applyQuizQuestion,
      quizIndex,
      moduleId,
    ]
  );

  useEffect(() => {
    const onPopState = () => {
      setWorkspaceMode(pathToMode(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleJumpFromGuide = useCallback(
    (targetMode: 'anatomy' | 'pathology', targetModId?: KneeModuleId, targetStruct?: StructureId) => {
      setWorkspaceMode(targetMode);
      setLastDualMode(targetMode);
      pushRouteForMode(targetMode);
      enableAllStructures();
      if (targetMode === 'pathology' && targetModId) {
        const mod = KNEE_MODULES.find((m) => m.id === targetModId) ?? FIRST_PATHOLOGY_MODULE;
        applySubStep(mod, 0);
      } else {
        const item = targetStruct
          ? findDefaultLandmarkForStructure(targetStruct)
          : INITIAL_ANATOMY_LANDMARK;
        applyAnatomyLandmark(item);
      }
    },
    [pushRouteForMode, enableAllStructures, applySubStep, applyAnatomyLandmark]
  );

  const handleToggleFullScreen3D = useCallback(() => {
    if (workspaceMode === 'fullscreen-3d') {
      handleWorkspaceModeChange(lastDualMode);
    } else {
      handleWorkspaceModeChange('fullscreen-3d');
    }
  }, [workspaceMode, lastDualMode, handleWorkspaceModeChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === 'l') {
        setShowAllLabels((v) => !v);
      } else if (key === 'h') {
        setShowTargetPointer((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleManualStructureSelect = useCallback(
    (id: StructureId) => {
      if (workspaceMode === 'anatomy') {
        applyAnatomyLandmark(findDefaultLandmarkForStructure(id));
      } else {
        setActiveStructure(id);
        setTargetRasOverride(undefined);
        setTargetBadge(undefined);
      }
    },
    [workspaceMode, applyAnatomyLandmark]
  );

  const handleQuizLocateClick = useCallback(
    (clickedId: StructureId) => {
      if (workspaceMode !== 'quiz' || activeQuiz.kind !== 'locate') return;
      const normalized =
        activeQuiz.targetStructure === 'Fibula' && clickedId === 'LCL'
          ? 'Fibula'
          : clickedId;
      setQuizAnswers((prev) => ({ ...prev, [activeQuiz.id]: normalized }));
      setActiveStructure(activeQuiz.targetStructure ?? normalized);
    },
    [workspaceMode, activeQuiz]
  );

  const handleAnswerQuizOption = useCallback(
    (optionId: string) => {
      setQuizAnswers((prev) => ({ ...prev, [activeQuiz.id]: optionId }));
      if (activeQuiz.targetStructure) {
        setActiveStructure(activeQuiz.targetStructure);
      }
    },
    [activeQuiz]
  );

  const targetRasMm = useMemo<[number, number, number] | null>(() => {
    if (targetRasOverride) return targetRasOverride;
    const s = landmarks?.structures[activeStructure];
    if (s) return s.centroidRas;
    return landmarks?.jointCenterRas ?? null;
  }, [targetRasOverride, landmarks, activeStructure]);

  const effectiveModuleId = workspaceMode === 'quiz' ? activeQuiz.moduleId : activeModule.id;
  const effectiveSubStepId = workspaceMode === 'quiz' ? activeQuiz.id : activeSubStep.id;
  const effectiveTearMorphology =
    workspaceMode === 'quiz'
      ? activeQuiz.meniscalTearMorphology
      : activeSubStep.meniscalTearMorphology;
  const effectiveAnnotations = useMemo(
    () =>
      workspaceMode === 'quiz'
        ? activeQuiz.mriAnnotations ?? []
        : customMriAnnotations ?? activeSubStep.mriAnnotations ?? [],
    [workspaceMode, activeQuiz.mriAnnotations, customMriAnnotations, activeSubStep.mriAnnotations]
  );

  const kinematics = useMemo(
    () =>
      computeKneeKinematics(
        flexionDeg,
        effectiveModuleId,
        landmarks?.threeScale ?? 0.04,
        landmarks?.laterality ?? 'Right',
        patellaSubluxation
      ),
    [
      flexionDeg,
      effectiveModuleId,
      landmarks?.threeScale,
      landmarks?.laterality,
      patellaSubluxation,
    ]
  );

  const quizCandidateStructures = useMemo<StructureId[] | undefined>(() => {
    if (workspaceMode !== 'quiz' || activeQuiz.kind !== 'locate') return undefined;
    const ids = activeQuiz.options.map((o) => o.id) as StructureId[];
    if (activeQuiz.targetStructure === 'Fibula' && !ids.includes('LCL')) {
      return [...ids, 'LCL'];
    }
    return ids;
  }, [workspaceMode, activeQuiz]);

  const isGuidePage = workspaceMode === 'report-guide';
  const isFullScreen3D = workspaceMode === 'fullscreen-3d';
  const hasLeftSidebar =
    workspaceMode === 'anatomy' || workspaceMode === 'pathology' || workspaceMode === 'quiz';
  const xrayBones = viewMode === 'joint-interior';

  return (
    <div className="atlas-shell">
      <TopModuleBar
        workspaceMode={workspaceMode}
        onChangeWorkspaceMode={handleWorkspaceModeChange}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'darkroom' ? 'monograph' : 'darkroom'))}
      />

      {/* Dedicated How to Report MRI Webpage */}
      {isGuidePage && (
        <main className="atlas-stage-layout full-width">
          <MriReportingGuidePage onJumpToModule={handleJumpFromGuide} />
        </main>
      )}

      {/* Persistent Zero-Lag WebGL Stage (stays mounted across ALL mode transitions!) */}
      <main
        className={`atlas-stage-layout workstation-persistent ${
          workspaceMode === 'pathology'
            ? 'with-pathology-sidebar'
            : hasLeftSidebar
              ? 'with-left-sidebar'
              : 'full-width'
        } ${isGuidePage ? 'is-hidden' : ''}`}
      >
        {workspaceMode === 'anatomy' && (
          <AnatomySidebar
            activeLandmark={activeLandmark}
            activeStructure={activeStructure}
            onSelectLandmark={applyAnatomyLandmark}
            enabledStructures={enabledStructures}
            layerMode={layerMode}
            onChangeLayerMode={setLayerMode}
            onToggleStructure={handleToggleStructure}
            onToggleLayerGroup={handleToggleLayerGroup}
            onIsolateStructure={handleIsolateStructure}
            onEnableAllStructures={enableAllStructures}
            xrayBones={xrayBones}
            onToggleXrayBones={() =>
              setViewMode((v) => (v === 'joint-interior' ? 'solid' : 'joint-interior'))
            }
            showAllLabels={showAllLabels}
            onToggleAllLabels={() => setShowAllLabels((v) => !v)}
            mriOverlayMode={mriOverlayMode}
            onChangeMriOverlayMode={setMriOverlayMode}
          />
        )}

        {workspaceMode === 'pathology' && (
          <PathologySidebar
            activeModuleId={activeModule.id}
            subStepIndex={subStepIndex}
            onSelectModule={handleSelectPathologyModule}
            onSelectSubStep={(idx) => applySubStep(activeModule, idx)}
            flexionDeg={flexionDeg}
            onChangeFlexionDeg={setFlexionDeg}
            patellaSubluxation={patellaSubluxation}
            onChangePatellaSubluxation={setPatellaSubluxation}
            onOpenReportGuide={() => handleWorkspaceModeChange('report-guide')}
          />
        )}

        {workspaceMode === 'quiz' && (
          <EditorialGuidePanel
            quizQuestion={activeQuiz}
            quizIndex={quizIndex}
            quizAnswers={quizAnswers}
            onSelectQuizQuestion={applyQuizQuestion}
            onAnswerQuiz={handleAnswerQuizOption}
            onResetQuiz={() => setQuizAnswers({})}
          />
        )}

        <div
          ref={fsHostRef}
          className={`viewports-split ${isFullScreen3D ? 'single-3d-fill' : ''}`}
        >
          <KneeSpecimen3D
            landmarks={landmarks}
            moduleId={effectiveModuleId}
            subStepId={effectiveSubStepId}
            meniscalTearMorphology={effectiveTearMorphology}
            targetRasOverride={targetRasOverride}
            targetBadge={targetBadge}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            visibility={BASE_VISIBILITY}
            enabledStructures={enabledStructures}
            paused={isGuidePage}
            cameraPreset={cameraPreset}
            cameraDistanceScale={cameraDistanceScale}
            cameraTrigger={cameraTrigger}
            onSelectCameraPreset={(preset) => {
              setCameraPreset(preset);
              setCameraDistanceScale(1.05);
              setCameraTrigger((t) => t + 1);
            }}
            activeStructure={activeStructure}
            onSelectStructure={handleManualStructureSelect}
            flexionDeg={flexionDeg}
            kinematics={kinematics}
            showAllLabels={showAllLabels}
            onToggleAllLabels={() => setShowAllLabels((v) => !v)}
            showSlicePlane={showSlicePlane}
            onToggleSlicePlane={() => setShowSlicePlane((v) => !v)}
            mriSliceRas={mriSliceRas}
            mriPlane={mriPlane}
            theme={theme}
            hideLabels={quizHideTarget || (isFullScreen3D && hideFull3DPins)}
            isFullScreenPage={isFullScreen3D}
            onToggleFullScreenPage={handleToggleFullScreen3D}
            onQuizStructureClick={handleQuizLocateClick}
          />

          <div className={`mri-pane-slot ${isFullScreen3D ? 'is-hidden' : ''}`}>
            <RealKneeMriViewer
              landmarks={landmarks}
              contrastPreset={mriContrast}
              onContrastChange={setMriContrast}
              planeMode={mriPlane}
              onPlaneModeChange={setMriPlane}
              mriZoom={mriZoom}
              onMriZoomChange={setMriZoom}
              targetRasMm={targetRasMm}
              targetBadge={targetBadge}
              mriAnnotations={effectiveAnnotations}
              showTargetPointer={showTargetPointer}
              onToggleTargetPointer={() => setShowTargetPointer((v) => !v)}
              hideTargetForQuiz={quizHideTarget}
              quizCandidateStructures={quizCandidateStructures}
              overlayModeProp={workspaceMode === 'anatomy' ? mriOverlayMode : undefined}
              onOverlayModeChange={
                workspaceMode === 'anatomy' ? setMriOverlayMode : undefined
              }
              hidden={isGuidePage || isFullScreen3D}
              onRasCrosshairChange={setMriSliceRas}
              onSelectStructureFromMri={handleManualStructureSelect}
              onQuizMriClick={handleQuizLocateClick}
            />
          </div>

          {isFullScreen3D && (
            <FullScreen3DOverlay
              hostElement={fsHostRef.current}
              activePresetId={activeDemoPresetId}
              onSelectPreset={handleSelectPatientPreset}
              moduleId={activeModule.id}
              flexionDeg={flexionDeg}
              onChangeFlexionDeg={setFlexionDeg}
              patellaSubluxation={patellaSubluxation}
              onChangePatellaSubluxation={setPatellaSubluxation}
              enabledStructures={enabledStructures}
              layerMode={layerMode}
              onChangeLayerMode={setLayerMode}
              onToggleStructure={handleToggleStructure}
              onToggleLayerGroup={handleToggleLayerGroup}
              onEnableAllStructures={enableAllStructures}
              hideLabels={hideFull3DPins}
              onToggleHideLabels={() => setHideFull3DPins((v) => !v)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

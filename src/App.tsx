import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnatomySidebar } from './components/AnatomySidebar';
import { EditorialGuidePanel } from './components/EditorialGuidePanel';
import { FullScreen3DOverlay } from './components/FullScreen3DView';
import { KneeSpecimen3D } from './components/KneeSpecimen3D';
import { LandingHomePage } from './components/LandingHomePage';
import { MriReportingGuidePage } from './components/MriReportingGuidePage';
import { PathologySidebar } from './components/PathologySidebar';
import { RealKneeMriViewer } from './components/RealKneeMriViewer';
import { TopModuleBar } from './components/TopModuleBar';
import { computeKneeKinematics } from './core/coordinates';
import { buildRoute, parseRoute } from './core/routing';
import { ALL_JOINT_ATLASES, getJointAtlas } from './data/joints';
import type {
  AnatomyLandmarkItem,
  AppWorkspaceMode,
  CameraPresetKey,
  JointAtlasDefinition,
  JointId,
  KneeLandmarks,
  KneeModule,
  LayerSelectMode,
  ModuleId,
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

function getFirstLandmark(jointDef: JointAtlasDefinition): AnatomyLandmarkItem {
  const firstEntry = jointDef.anatomySystemGroups[0]?.entries[0];
  if (firstEntry) return firstEntry.defaultLandmark;
  const firstId = Object.keys(jointDef.structuresInfo)[0] ?? 'Femur';
  return {
    id: `${jointDef.id}-fallback`,
    label: firstId,
    structureId: firstId,
    targetRas: jointDef.defaultMriSliceRas,
    cameraPreset: 'anterior',
    viewMode3D: 'solid',
    mriPlane: 'coronal',
    mriContrast: jointDef.mriContrastPresets[0]?.id ?? 'qdess-clinical',
    mriZoom: 1.2,
    keyFact: '',
  };
}

function findDefaultLandmarkForStructure(
  jointDef: JointAtlasDefinition,
  sid: StructureId
): AnatomyLandmarkItem {
  for (const group of jointDef.anatomySystemGroups) {
    for (const entry of group.entries) {
      if (entry.structureId === sid) return entry.defaultLandmark;
    }
  }
  return getFirstLandmark(jointDef);
}

function resolveModuleForJoint(
  jointDef: JointAtlasDefinition,
  mode: AppWorkspaceMode,
  requestedModuleId?: string
): KneeModule {
  if (requestedModuleId) {
    const exact = jointDef.modules.find((m) => m.id === requestedModuleId);
    if (exact) return exact;
  }
  if (mode === 'pathology') {
    return jointDef.modules.find((m) => m.category === 'pathology') ?? jointDef.modules[0];
  }
  return jointDef.modules[0];
}

export function App() {
  const initialRoute = useMemo(
    () =>
      typeof window !== 'undefined'
        ? parseRoute(window.location.pathname, window.location.search)
        : { jointId: 'ankle' as JointId, mode: 'landing' as AppWorkspaceMode },
    []
  );

  const initialJointDef = useMemo(() => getJointAtlas(initialRoute.jointId), [initialRoute.jointId]);
  const initialLandmark = useMemo(() => getFirstLandmark(initialJointDef), [initialJointDef]);
  const initialModule = useMemo(
    () => resolveModuleForJoint(initialJointDef, initialRoute.mode, initialRoute.moduleParam),
    [initialJointDef, initialRoute.mode, initialRoute.moduleParam]
  );
  const initialStep = useMemo(() => {
    if (initialRoute.mode === 'pathology' || initialRoute.mode === 'fullscreen-3d') {
      return initialModule.subSteps[0];
    }
    return undefined;
  }, [initialRoute.mode, initialModule]);

  const [jointId, setJointId] = useState<JointId>(initialRoute.jointId);
  const [landmarks, setLandmarks] = useState<KneeLandmarks | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<AppWorkspaceMode>(initialRoute.mode);
  const [lastDualMode, setLastDualMode] = useState<'anatomy' | 'pathology'>(
    initialRoute.mode === 'pathology' ? 'pathology' : 'anatomy'
  );
  const [theme, setTheme] = useState<ThemeMode>('darkroom');
  const fsHostRef = useRef<HTMLDivElement | null>(null);

  const jointDef = useMemo(() => getJointAtlas(jointId), [jointId]);

  const [moduleId, setModuleId] = useState<ModuleId>(initialModule.id);
  const [subStepIndex, setSubStepIndex] = useState(0);

  const [enabledStructures, setEnabledStructures] = useState<Set<StructureId>>(
    () => new Set(Object.keys(initialJointDef.structuresInfo))
  );
  const [layerMode, setLayerMode] = useState<LayerSelectMode>('multiple');

  const [activeLandmark, setActiveLandmark] = useState<AnatomyLandmarkItem>(initialLandmark);
  const [customMriAnnotations, setCustomMriAnnotations] = useState<MriAnnotation[] | undefined>(
    initialStep ? undefined : initialLandmark.mriAnnotations
  );
  const [mriOverlayMode, setMriOverlayMode] = useState<MriOverlayMode>('none');
  const [activeDemoPresetId, setActiveDemoPresetId] = useState<string>(
    initialJointDef.patientDemoPresets[0]?.id ?? ''
  );
  const [hideFull3DPins, setHideFull3DPins] = useState(false);

  const [viewMode, setViewMode] = useState<SpecimenViewMode>(
    initialStep?.viewMode3D ?? initialLandmark.viewMode3D
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPresetKey>(
    initialStep?.cameraPreset ?? initialLandmark.cameraPreset
  );
  const [cameraDistanceScale, setCameraDistanceScale] = useState<number>(
    initialStep?.cameraDistanceScale ?? initialLandmark.cameraDistanceScale ?? 1.05
  );
  const [cameraTrigger, setCameraTrigger] = useState(1);

  const [mriPlane, setMriPlane] = useState<MriPlaneMode>(
    initialStep?.mriPlane ?? initialLandmark.mriPlane
  );
  const [mriContrast, setMriContrast] = useState<MriContrastPreset>(
    initialStep?.mriContrast ?? initialLandmark.mriContrast
  );
  const [mriZoom, setMriZoom] = useState<number>(
    initialStep?.mriZoom ?? initialLandmark.mriZoom
  );
  const [mriFocusTrigger, setMriFocusTrigger] = useState(1);

  const [flexionDeg, setFlexionDeg] = useState<number>(
    initialStep?.flexionDeg ?? initialJointDef.kinematicConfig.defaultDeg
  );
  const [patellaSubluxation, setPatellaSubluxation] = useState<number>(
    initialStep?.patellaSubluxation ?? 0
  );

  const [activeStructure, setActiveStructure] = useState<StructureId>(
    initialStep?.focusStructure ?? initialLandmark.structureId
  );
  const [targetRasOverride, setTargetRasOverride] = useState<[number, number, number] | undefined>(
    initialStep ? initialStep.targetRasOverride : initialLandmark.targetRas
  );
  const [targetBadge, setTargetBadge] = useState<string | undefined>(
    initialStep?.targetBadge ?? initialLandmark.label
  );
  const [mriSliceRas, setMriSliceRas] = useState<[number, number, number]>(
    initialJointDef.defaultMriSliceRas
  );

  const [showTargetPointer, setShowTargetPointer] = useState(true);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showSlicePlane, setShowSlicePlane] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Fetch per-joint landmarks JSON whenever active joint changes
  useEffect(() => {
    let cancelled = false;
    setLandmarks(null);
    fetch(jointDef.landmarksUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<KneeLandmarks>;
      })
      .then((data) => {
        if (cancelled) return;
        setLandmarks(data);
        setMriSliceRas(data.jointCenterRas);
        setMriFocusTrigger((t) => t + 1);
      })
      .catch(() => {
        // Fallback default slice center remains active
      });
    return () => {
      cancelled = true;
    };
  }, [jointDef.landmarksUrl]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (workspaceMode === 'landing') {
      document.title = 'ReadingRoom Atlas — 6-Joint 3D & 3T MSK MRI Platform';
    } else if (workspaceMode === 'report-guide') {
      document.title = `${jointDef.shortName} MRI Reporting Guide — ReadingRoom Atlas`;
    } else {
      document.title = `${jointDef.name} — ReadingRoom Atlas`;
    }
  }, [workspaceMode, jointDef.name, jointDef.shortName]);

  const firstPathologyModule = useMemo(
    () => jointDef.modules.find((m) => m.category === 'pathology') ?? jointDef.modules[0],
    [jointDef]
  );

  const activeModule = useMemo<KneeModule>(
    () => jointDef.modules.find((m) => m.id === moduleId) ?? firstPathologyModule,
    [jointDef.modules, moduleId, firstPathologyModule]
  );

  const activeSubStep = useMemo(
    () => activeModule.subSteps[subStepIndex] ?? activeModule.subSteps[0],
    [activeModule, subStepIndex]
  );

  const activeQuiz = useMemo<ResidentQuizQuestion>(
    () => jointDef.quizQuestions[quizIndex] ?? jointDef.quizQuestions[0],
    [jointDef.quizQuestions, quizIndex]
  );

  const quizHideTarget =
    workspaceMode === 'quiz' && quizAnswers[activeQuiz.id] === undefined;

  const pushRoute = useCallback(
    (jId: JointId, mode: AppWorkspaceMode, modId?: string, skipPush = false) => {
      if (skipPush || typeof window === 'undefined') return;
      const nextUrl = buildRoute(jId, mode, mode === 'pathology' ? modId : undefined);
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl !== nextUrl) {
        window.history.pushState(null, '', nextUrl);
      }
    },
    []
  );

  const enableAllStructures = useCallback((targetDef: JointAtlasDefinition = jointDef) => {
    setEnabledStructures(new Set(Object.keys(targetDef.structuresInfo)));
  }, [jointDef]);

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

  const applyAnatomyLandmark = useCallback(
    (item: AnatomyLandmarkItem, targetDef: JointAtlasDefinition = jointDef) => {
      setActiveLandmark(item);
      setCustomMriAnnotations(item.mriAnnotations);
      setModuleId(targetDef.modules[0].id);
      setSubStepIndex(0);
      setViewMode(item.viewMode3D);
      setCameraPreset(item.cameraPreset);
      setCameraDistanceScale(item.cameraDistanceScale ?? 1.04);
      setCameraTrigger((t) => t + 1);
      setMriPlane(item.mriPlane);
      setMriContrast(item.mriContrast);
      setMriZoom(item.mriZoom);
      setFlexionDeg(targetDef.kinematicConfig.defaultDeg);
      setPatellaSubluxation(0);
      setActiveStructure(item.structureId);
      setTargetRasOverride(item.targetRas);
      setTargetBadge(item.label);
      setMriFocusTrigger((t) => t + 1);
      setEnabledStructures((prev) => {
        if (prev.has(item.structureId)) return prev;
        const next = new Set(prev);
        next.add(item.structureId);
        return next;
      });
    },
    [jointDef]
  );

  const handleToggleLayerGroup = useCallback(
    (groupId: TissueGroup) => {
      const group = jointDef.layerGroups.find((g) => g.id === groupId);
      if (!group) return;

      if (layerMode === 'single') {
        setEnabledStructures(new Set(group.structures));
        if (workspaceMode === 'anatomy' && group.structures.length > 0) {
          applyAnatomyLandmark(findDefaultLandmarkForStructure(jointDef, group.structures[0]), jointDef);
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
    [jointDef, layerMode, workspaceMode, applyAnatomyLandmark]
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
    setMriFocusTrigger((t) => t + 1);
  }, []);

  const applyQuizQuestion = useCallback(
    (idx: number, targetDef: JointAtlasDefinition = jointDef) => {
      const questions = targetDef.quizQuestions;
      const safeIdx = Math.max(0, Math.min(questions.length - 1, idx));
      const q = questions[safeIdx];
      const fallbackStruct = Object.keys(targetDef.structuresInfo)[0] ?? 'Femur';
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
      setActiveStructure(q.targetStructure ?? fallbackStruct);
      setTargetRasOverride(q.targetRasOverride);
      setTargetBadge(q.targetBadge);
      setMriFocusTrigger((t) => t + 1);
    },
    [jointDef]
  );

  const handleSelectPathologyModule = useCallback(
    (id: ModuleId) => {
      const mod = jointDef.modules.find((m) => m.id === id);
      if (mod) {
        enableAllStructures(jointDef);
        applySubStep(mod, 0);
        pushRoute(jointId, 'pathology', mod.id);
        const matchPreset = jointDef.patientDemoPresets.find((p) => p.moduleId === mod.id);
        if (matchPreset) setActiveDemoPresetId(matchPreset.id);
      }
    },
    [jointDef, jointId, enableAllStructures, applySubStep, pushRoute]
  );

  const handleSelectPatientPreset = useCallback(
    (preset: PatientDemoPreset) => {
      setActiveDemoPresetId(preset.id);
      const mod = jointDef.modules.find((m) => m.id === preset.moduleId);
      if (mod) {
        applySubStep(mod, preset.subStepIndex);
      }
    },
    [jointDef.modules, applySubStep]
  );

  const switchJointAndMode = useCallback(
    (
      nextJointId: JointId,
      nextMode: AppWorkspaceMode,
      options?: { moduleId?: string; structureId?: StructureId; skipPush?: boolean }
    ) => {
      const targetDef = getJointAtlas(nextJointId);
      const switchingJoint = nextJointId !== jointId;

      setWorkspaceMode(nextMode);
      if (nextMode === 'anatomy' || nextMode === 'pathology') {
        setLastDualMode(nextMode);
      }

      if (switchingJoint) {
        setJointId(nextJointId);
        setMriOverlayMode('none');
        setLayerMode('multiple');
        setQuizIndex(0);
        setQuizAnswers({});
        setEnabledStructures(new Set(Object.keys(targetDef.structuresInfo)));
        setMriSliceRas(targetDef.defaultMriSliceRas);
        setActiveDemoPresetId(targetDef.patientDemoPresets[0]?.id ?? '');
      }

      const resolvedMod = resolveModuleForJoint(targetDef, nextMode, options?.moduleId);
      pushRoute(nextJointId, nextMode, resolvedMod.id, options?.skipPush);

      if (nextMode === 'landing') {
        return;
      }

      if (nextMode === 'anatomy') {
        enableAllStructures(targetDef);
        const lm = options?.structureId
          ? findDefaultLandmarkForStructure(targetDef, options.structureId)
          : switchingJoint
            ? getFirstLandmark(targetDef)
            : activeLandmark;
        applyAnatomyLandmark(lm, targetDef);
        return;
      }

      if (nextMode === 'pathology') {
        enableAllStructures(targetDef);
        const modToUse =
          !options?.moduleId && !switchingJoint && activeModule.category === 'pathology'
            ? activeModule
            : resolvedMod;
        const stepIdx = !options?.moduleId && !switchingJoint && activeModule.category === 'pathology'
          ? subStepIndex
          : 0;
        applySubStep(modToUse, stepIdx);
        const matchPreset = targetDef.patientDemoPresets.find((p) => p.moduleId === modToUse.id);
        if (matchPreset) setActiveDemoPresetId(matchPreset.id);
        return;
      }

      if (nextMode === 'quiz') {
        enableAllStructures(targetDef);
        applyQuizQuestion(switchingJoint ? 0 : quizIndex, targetDef);
        return;
      }

      if (nextMode === 'fullscreen-3d') {
        enableAllStructures(targetDef);
        const preset = switchingJoint
          ? targetDef.patientDemoPresets[0]
          : targetDef.patientDemoPresets.find((p) => p.moduleId === moduleId) ??
            targetDef.patientDemoPresets[0];
        if (preset) {
          setActiveDemoPresetId(preset.id);
          const pMod = targetDef.modules.find((m) => m.id === preset.moduleId) ?? resolvedMod;
          applySubStep(pMod, preset.subStepIndex);
        } else {
          applyAnatomyLandmark(getFirstLandmark(targetDef), targetDef);
        }
      }
    },
    [
      jointId,
      pushRoute,
      enableAllStructures,
      activeLandmark,
      applyAnatomyLandmark,
      activeModule,
      subStepIndex,
      applySubStep,
      applyQuizQuestion,
      quizIndex,
      moduleId,
    ]
  );

  const handleWorkspaceModeChange = useCallback(
    (mode: AppWorkspaceMode) => {
      switchJointAndMode(jointId, mode);
    },
    [jointId, switchJointAndMode]
  );

  const handleChangeJoint = useCallback(
    (nextJointId: JointId) => {
      const targetMode: AppWorkspaceMode =
        workspaceMode === 'landing' ? 'anatomy' : workspaceMode;
      switchJointAndMode(nextJointId, targetMode);
    },
    [workspaceMode, switchJointAndMode]
  );

  useEffect(() => {
    const onPopState = () => {
      const r = parseRoute(window.location.pathname, window.location.search);
      switchJointAndMode(r.jointId, r.mode, { moduleId: r.moduleParam, skipPush: true });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [switchJointAndMode]);

  const handleJumpFromGuide = useCallback(
    (targetMode: 'anatomy' | 'pathology', targetModId?: ModuleId, targetStruct?: StructureId) => {
      switchJointAndMode(jointId, targetMode, {
        moduleId: targetModId,
        structureId: targetStruct,
      });
    },
    [jointId, switchJointAndMode]
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
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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

  const handleViewportStructurePick = useCallback(
    (id: StructureId) => {
      setActiveStructure(id);
      setTargetRasOverride(undefined);
      setTargetBadge(undefined);
      if (workspaceMode === 'anatomy') {
        const item = findDefaultLandmarkForStructure(jointDef, id);
        setActiveLandmark(item);
        setCustomMriAnnotations(undefined);
      }
    },
    [workspaceMode, jointDef]
  );

  const handleQuizLocateClick = useCallback(
    (clickedId: StructureId) => {
      if (workspaceMode !== 'quiz' || activeQuiz.kind !== 'locate') return;
      const normalized =
        jointId === 'knee' && activeQuiz.targetStructure === 'Fibula' && clickedId === 'LCL'
          ? 'Fibula'
          : clickedId;
      setQuizAnswers((prev) => ({ ...prev, [activeQuiz.id]: normalized }));
      setActiveStructure(activeQuiz.targetStructure ?? normalized);
    },
    [workspaceMode, activeQuiz, jointId]
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
    return landmarks?.jointCenterRas ?? jointDef.defaultMriSliceRas;
  }, [targetRasOverride, landmarks, activeStructure, jointDef.defaultMriSliceRas]);

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
        patellaSubluxation,
        jointId,
        jointDef.kinematicConfig.minDeg,
        jointDef.kinematicConfig.maxDeg
      ),
    [
      flexionDeg,
      effectiveModuleId,
      landmarks?.threeScale,
      landmarks?.laterality,
      patellaSubluxation,
      jointId,
      jointDef.kinematicConfig.minDeg,
      jointDef.kinematicConfig.maxDeg,
    ]
  );

  const quizCandidateStructures = useMemo<StructureId[] | undefined>(() => {
    if (workspaceMode !== 'quiz' || activeQuiz.kind !== 'locate') return undefined;
    const ids = activeQuiz.options.map((o) => o.id) as StructureId[];
    if (jointId === 'knee' && activeQuiz.targetStructure === 'Fibula' && !ids.includes('LCL')) {
      return [...ids, 'LCL'];
    }
    return ids;
  }, [workspaceMode, activeQuiz, jointId]);

  const isLanding = workspaceMode === 'landing';
  const isGuidePage = workspaceMode === 'report-guide';
  const isWorkstationHidden = isLanding || isGuidePage;
  const isFullScreen3D = workspaceMode === 'fullscreen-3d';
  const hasLeftSidebar =
    workspaceMode === 'anatomy' || workspaceMode === 'pathology' || workspaceMode === 'quiz';
  const xrayBones = viewMode === 'joint-interior';

  return (
    <div className="atlas-shell">
      <TopModuleBar
        activeJoint={jointDef}
        joints={ALL_JOINT_ATLASES}
        onChangeJoint={handleChangeJoint}
        workspaceMode={workspaceMode}
        onChangeWorkspaceMode={handleWorkspaceModeChange}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'darkroom' ? 'monograph' : 'darkroom'))}
      />

      {isLanding && (
        <main className="atlas-stage-layout full-width">
          <LandingHomePage
            joints={ALL_JOINT_ATLASES}
            onLaunchJointMode={(targetJoint, targetMode, opts) =>
              switchJointAndMode(targetJoint, targetMode, opts)
            }
          />
        </main>
      )}

      {isGuidePage && (
        <main className="atlas-stage-layout full-width">
          <MriReportingGuidePage jointDef={jointDef} onJumpToModule={handleJumpFromGuide} />
        </main>
      )}

      {/* Persistent Zero-Lag WebGL Stage (stays mounted cleanly behind Landing/Guide pages) */}
      <main
        className={`atlas-stage-layout workstation-persistent ${
          workspaceMode === 'pathology'
            ? 'with-pathology-sidebar'
            : hasLeftSidebar
              ? 'with-left-sidebar'
              : 'full-width'
        } ${isWorkstationHidden ? 'is-hidden' : ''}`}
      >
        {workspaceMode === 'anatomy' && (
          <AnatomySidebar
            jointDef={jointDef}
            activeLandmark={activeLandmark}
            activeStructure={activeStructure}
            onSelectLandmark={(lm) => applyAnatomyLandmark(lm, jointDef)}
            enabledStructures={enabledStructures}
            layerMode={layerMode}
            onChangeLayerMode={setLayerMode}
            onToggleStructure={handleToggleStructure}
            onToggleLayerGroup={handleToggleLayerGroup}
            onIsolateStructure={handleIsolateStructure}
            onEnableAllStructures={() => enableAllStructures(jointDef)}
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
            jointDef={jointDef}
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
            quizQuestions={jointDef.quizQuestions}
            quizQuestion={activeQuiz}
            quizIndex={quizIndex}
            quizAnswers={quizAnswers}
            onSelectQuizQuestion={(idx) => applyQuizQuestion(idx, jointDef)}
            onAnswerQuiz={handleAnswerQuizOption}
            onResetQuiz={() => setQuizAnswers({})}
          />
        )}

        <div
          ref={fsHostRef}
          className={`viewports-split ${isFullScreen3D ? 'single-3d-fill' : ''}`}
        >
          <KneeSpecimen3D
            jointDef={jointDef}
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
            paused={isWorkstationHidden}
            cameraPreset={cameraPreset}
            cameraDistanceScale={cameraDistanceScale}
            cameraTrigger={cameraTrigger}
            onSelectCameraPreset={(preset) => {
              setCameraPreset(preset);
              setCameraDistanceScale(1.05);
              setCameraTrigger((t) => t + 1);
            }}
            activeStructure={activeStructure}
            onSelectStructure={handleViewportStructurePick}
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
              jointDef={jointDef}
              landmarks={landmarks}
              contrastPreset={mriContrast}
              onContrastChange={setMriContrast}
              planeMode={mriPlane}
              onPlaneModeChange={setMriPlane}
              mriZoom={mriZoom}
              onMriZoomChange={setMriZoom}
              targetRasMm={targetRasMm}
              focusTrigger={mriFocusTrigger}
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
              hidden={isWorkstationHidden || isFullScreen3D}
              onRasCrosshairChange={setMriSliceRas}
              onSelectStructureFromMri={handleViewportStructurePick}
              onQuizMriClick={handleQuizLocateClick}
            />
          </div>

          {isFullScreen3D && (
            <FullScreen3DOverlay
              jointDef={jointDef}
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
              onEnableAllStructures={() => enableAllStructures(jointDef)}
              hideLabels={hideFull3DPins}
              onToggleHideLabels={() => setHideFull3DPins((v) => !v)}
              showAllLabels={showAllLabels}
              onToggleAllLabels={() => setShowAllLabels((v) => !v)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

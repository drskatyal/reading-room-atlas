import { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Columns2,
  EyeOff,
  Maximize,
  Minimize,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { PATIENT_DEMO_PRESETS } from '../data/anatomyAndReportingData';
import type {
  CameraPresetKey,
  KneeKinematics,
  KneeLandmarks,
  KneeModuleId,
  MriPlaneMode,
  PatientDemoPreset,
  SpecimenViewMode,
  StructureId,
  ThemeMode,
  TissueVisibility,
} from '../types/atlas';
import { KneeSpecimen3D } from './KneeSpecimen3D';

interface FullScreen3DViewProps {
  landmarks: KneeLandmarks | null;
  activePresetId: string;
  onSelectPreset: (preset: PatientDemoPreset) => void;
  moduleId: KneeModuleId;
  subStepId: string;
  targetRasOverride?: [number, number, number];
  targetBadge?: string;
  viewMode: SpecimenViewMode;
  onChangeViewMode: (mode: SpecimenViewMode) => void;
  visibility: TissueVisibility;
  onChangeVisibility: (next: TissueVisibility) => void;
  cameraPreset: CameraPresetKey;
  cameraDistanceScale?: number;
  cameraTrigger: number;
  onSelectCameraPreset: (preset: CameraPresetKey) => void;
  activeStructure: StructureId;
  onSelectStructure: (id: StructureId) => void;
  flexionDeg: number;
  onChangeFlexionDeg: (deg: number) => void;
  patellaSubluxation: number;
  onChangePatellaSubluxation: (val: number) => void;
  kinematics: KneeKinematics;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  showSlicePlane: boolean;
  onToggleSlicePlane: () => void;
  mriSliceRas: [number, number, number];
  mriPlane: MriPlaneMode;
  theme: ThemeMode;
  onExitFullScreenMode: () => void;
}

type CaptionMode = 'patient' | 'clinical' | 'off';

export function FullScreen3DView({
  landmarks,
  activePresetId,
  onSelectPreset,
  moduleId,
  subStepId,
  targetRasOverride,
  targetBadge,
  viewMode,
  onChangeViewMode,
  visibility,
  onChangeVisibility,
  cameraPreset,
  cameraDistanceScale,
  cameraTrigger,
  onSelectCameraPreset,
  activeStructure,
  onSelectStructure,
  flexionDeg,
  onChangeFlexionDeg,
  patellaSubluxation,
  onChangePatellaSubluxation,
  kinematics,
  showAllLabels,
  onToggleAllLabels,
  showSlicePlane,
  onToggleSlicePlane,
  mriSliceRas,
  mriPlane,
  theme,
  onExitFullScreenMode,
}: FullScreen3DViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [selectorOpen, setSelectorOpen] = useState(true);
  const [captionMode, setCaptionMode] = useState<CaptionMode>('patient');
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  const activePreset =
    PATIENT_DEMO_PRESETS.find((p) => p.id === activePresetId) ?? PATIENT_DEMO_PRESETS[0];
  const isPatella = moduleId === 'patellar-dislocation';

  const handleBrowserFullscreen = async () => {
    const el = hostRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsBrowserFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsBrowserFullscreen(false);
      }
    } catch {
      // Clipboard/fullscreen fallback when blocked by headless iframe
    }
  };

  return (
    <div className="fullscreen-3d-host" ref={hostRef}>
      <KneeSpecimen3D
        landmarks={landmarks}
        moduleId={moduleId}
        subStepId={subStepId}
        targetRasOverride={targetRasOverride}
        targetBadge={targetBadge}
        viewMode={viewMode}
        onChangeViewMode={onChangeViewMode}
        visibility={visibility}
        onChangeVisibility={onChangeVisibility}
        cameraPreset={cameraPreset}
        cameraDistanceScale={cameraDistanceScale}
        cameraTrigger={cameraTrigger}
        onSelectCameraPreset={onSelectCameraPreset}
        activeStructure={activeStructure}
        onSelectStructure={onSelectStructure}
        flexionDeg={flexionDeg}
        kinematics={kinematics}
        showAllLabels={showAllLabels}
        onToggleAllLabels={onToggleAllLabels}
        showSlicePlane={showSlicePlane}
        onToggleSlicePlane={onToggleSlicePlane}
        mriSliceRas={mriSliceRas}
        mriPlane={mriPlane}
        theme={theme}
        hideLabels={captionMode === 'off'}
        isFullScreenPage
        onToggleFullScreenPage={onExitFullScreenMode}
      />

      {/* Collapsible Top-Left Floating Showcase Preset Selector */}
      <div className={`fs-selector-drawer ${selectorOpen ? 'open' : 'collapsed'}`}>
        <button
          type="button"
          className="fs-drawer-toggle"
          onClick={() => setSelectorOpen((v) => !v)}
        >
          <span>Showcase Model: <strong>{activePreset.label}</strong></span>
          {selectorOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {selectorOpen && (
          <div className="fs-drawer-body">
            <div className="fs-group-label">Healthy &amp; Pathologies in 3D</div>
            <div className="fs-preset-grid">
              {PATIENT_DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`fs-preset-pill ${preset.id === activePreset.id ? 'active' : ''}`}
                  onClick={() => onSelectPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom-Center Interactive Dock & Patient/Clinical Caption */}
      <div className="fs-bottom-dock">
        {captionMode !== 'off' && (
          <div className="fs-caption-card">
            <div className="fs-caption-title">{activePreset.patientTitle}</div>
            <p className="fs-caption-text">
              {captionMode === 'patient'
                ? activePreset.patientSummary
                : activePreset.clinicalSummary}
            </p>
          </div>
        )}

        <div className="fs-controls-bar">
          <label className="fs-motion-slider">
            <span>{isPatella ? 'Patella Slip' : 'Knee Bend'}</span>
            <input
              type="range"
              min={0}
              max={isPatella ? 1 : 90}
              step={isPatella ? 0.05 : 2}
              value={isPatella ? patellaSubluxation : flexionDeg}
              onChange={(e) =>
                isPatella
                  ? onChangePatellaSubluxation(Number(e.target.value))
                  : onChangeFlexionDeg(Number(e.target.value))
              }
              aria-label="3D knee motion control"
            />
            <strong>{isPatella ? `${Math.round(patellaSubluxation * 100)}%` : `${flexionDeg}°`}</strong>
          </label>

          <div className="segmented-pill" role="group" aria-label="Caption mode">
            <button
              type="button"
              className={`pill-btn ${captionMode === 'patient' ? 'active' : ''}`}
              onClick={() => setCaptionMode('patient')}
            >
              <UserCheck size={12} /> Patient
            </button>
            <button
              type="button"
              className={`pill-btn ${captionMode === 'clinical' ? 'active' : ''}`}
              onClick={() => setCaptionMode('clinical')}
            >
              <Sparkles size={12} /> Clinical
            </button>
            <button
              type="button"
              className={`pill-btn ${captionMode === 'off' ? 'active' : ''}`}
              onClick={() => setCaptionMode('off')}
            >
              <EyeOff size={12} /> Pure 3D
            </button>
          </div>

          <button
            type="button"
            className="chip-btn"
            onClick={handleBrowserFullscreen}
            title="Expand monitor fullscreen"
          >
            {isBrowserFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
            <span>{isBrowserFullscreen ? 'Window' : 'Monitor Full'}</span>
          </button>

          <button
            type="button"
            className="chip-btn primary-chip"
            onClick={onExitFullScreenMode}
          >
            <Columns2 size={13} />
            <span>3D + MRI</span>
          </button>
        </div>
      </div>
    </div>
  );
}

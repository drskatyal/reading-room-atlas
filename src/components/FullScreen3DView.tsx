import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  EyeOff,
  Layers,
  Maximize,
  Minimize,
  RotateCcw,
} from 'lucide-react';
import {
  ANATOMY_SYSTEM_GROUPS,
  LAYER_GROUPS,
  PATIENT_DEMO_PRESETS,
} from '../data/anatomyAndReportingData';
import type {
  LayerSelectMode,
  PatientDemoPreset,
  StructureId,
  TissueGroup,
} from '../types/atlas';

interface FullScreen3DOverlayProps {
  hostElement: HTMLDivElement | null;
  activePresetId: string;
  onSelectPreset: (preset: PatientDemoPreset) => void;
  moduleId: string;
  flexionDeg: number;
  onChangeFlexionDeg: (deg: number) => void;
  patellaSubluxation: number;
  onChangePatellaSubluxation: (val: number) => void;
  enabledStructures: ReadonlySet<StructureId>;
  layerMode: LayerSelectMode;
  onChangeLayerMode: (mode: LayerSelectMode) => void;
  onToggleStructure: (id: StructureId) => void;
  onToggleLayerGroup: (groupId: TissueGroup) => void;
  onEnableAllStructures: () => void;
  hideLabels: boolean;
  onToggleHideLabels: () => void;
}

export function FullScreen3DOverlay({
  hostElement,
  activePresetId,
  onSelectPreset,
  moduleId,
  flexionDeg,
  onChangeFlexionDeg,
  patellaSubluxation,
  onChangePatellaSubluxation,
  enabledStructures,
  layerMode,
  onChangeLayerMode,
  onToggleStructure,
  onToggleLayerGroup,
  onEnableAllStructures,
  hideLabels,
  onToggleHideLabels,
}: FullScreen3DOverlayProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [isMonitorFullscreen, setIsMonitorFullscreen] = useState(false);

  const activePreset =
    PATIENT_DEMO_PRESETS.find((p) => p.id === activePresetId) ?? PATIENT_DEMO_PRESETS[0];
  const isPatella = moduleId === 'patellar-dislocation';

  const handleBrowserFullscreen = async () => {
    if (!hostElement) return;
    try {
      if (!document.fullscreenElement) {
        await hostElement.requestFullscreen();
        setIsMonitorFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsMonitorFullscreen(false);
      }
    } catch {
      // Safe fallback when blocked by browser security policy
    }
  };

  return (
    <div className="fs-selector-drawer">
      <button
        type="button"
        className="fs-drawer-toggle"
        onClick={() => setPanelOpen((v) => !v)}
      >
        <span>
          3D View: <strong>{activePreset.label}</strong>
        </span>
        {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {panelOpen && (
        <div className="fs-drawer-body">
          <label className="fs-select-label">
            <span>Model / Pathology</span>
            <select
              className="fs-select-input"
              value={activePreset.id}
              onChange={(e) => {
                const found = PATIENT_DEMO_PRESETS.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
            >
              {PATIENT_DEMO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <p className="fs-inline-summary">{activePreset.patientSummary}</p>

          <label className="fs-motion-row">
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
            <strong>
              {isPatella ? `${Math.round(patellaSubluxation * 100)}%` : `${flexionDeg}°`}
            </strong>
          </label>

          <div className="fs-layers-toggle-bar">
            <button
              type="button"
              className={`mini-chip ${layersOpen ? 'active' : ''}`}
              onClick={() => setLayersOpen((v) => !v)}
            >
              <Layers size={11} />
              <span>Layers ({enabledStructures.size}/16)</span>
            </button>

            <div className="segmented-pill mini-seg">
              <button
                type="button"
                className={`pill-btn ${layerMode === 'multiple' ? 'active' : ''}`}
                onClick={() => onChangeLayerMode('multiple')}
              >
                Multi
              </button>
              <button
                type="button"
                className={`pill-btn ${layerMode === 'single' ? 'active' : ''}`}
                onClick={() => onChangeLayerMode('single')}
              >
                Single
              </button>
            </div>

            <button
              type="button"
              className="reset-link-btn"
              onClick={onEnableAllStructures}
              title="Show all structures"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          {layersOpen && (
            <div className="fs-layers-scroll">
              <div className="layer-chips-grid">
                {LAYER_GROUPS.map((lg) => {
                  const onCount = lg.structures.filter((sid) => enabledStructures.has(sid)).length;
                  const active = onCount > 0;
                  return (
                    <button
                      key={lg.id}
                      type="button"
                      className={`layer-chip-btn ${active ? 'active' : ''}`}
                      onClick={() => onToggleLayerGroup(lg.id)}
                    >
                      <span className="layer-chip-dot" />
                      <span>{lg.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="fs-struct-switches">
                {ANATOMY_SYSTEM_GROUPS.flatMap((g) => g.entries).map((entry) => {
                  const on = enabledStructures.has(entry.structureId);
                  return (
                    <div key={entry.structureId} className="outliner-item-row compact">
                      <span className="outliner-label-btn static">{entry.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        className={`anat-switch ${on ? 'on' : ''}`}
                        onClick={() => onToggleStructure(entry.structureId)}
                      >
                        <span className="anat-switch-thumb" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="fs-panel-actions">
            <button
              type="button"
              className={`mini-chip ${hideLabels ? 'active' : ''}`}
              onClick={onToggleHideLabels}
            >
              <EyeOff size={11} />
              <span>{hideLabels ? 'Show Pins' : 'Hide Pins'}</span>
            </button>
            <button type="button" className="mini-chip" onClick={handleBrowserFullscreen}>
              {isMonitorFullscreen ? <Minimize size={11} /> : <Maximize size={11} />}
              <span>Full Monitor</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

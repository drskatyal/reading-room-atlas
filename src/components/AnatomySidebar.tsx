import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Palette,
  RotateCcw,
  Scan,
  Search,
  Tags,
} from 'lucide-react';
import type {
  AnatomyLandmarkItem,
  JointAtlasDefinition,
  LayerSelectMode,
  MriOverlayMode,
  StructureId,
  TissueGroup,
} from '../types/atlas';

interface AnatomySidebarProps {
  jointDef: JointAtlasDefinition;
  activeLandmark: AnatomyLandmarkItem;
  activeStructure: StructureId;
  onSelectLandmark: (item: AnatomyLandmarkItem) => void;
  enabledStructures: ReadonlySet<StructureId>;
  layerMode: LayerSelectMode;
  onChangeLayerMode: (mode: LayerSelectMode) => void;
  onToggleStructure: (id: StructureId) => void;
  onToggleLayerGroup: (groupId: TissueGroup) => void;
  onIsolateStructure: (id: StructureId) => void;
  onEnableAllStructures: () => void;
  xrayBones: boolean;
  onToggleXrayBones: () => void;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  mriOverlayMode: MriOverlayMode;
  onChangeMriOverlayMode: (mode: MriOverlayMode) => void;
}

export function AnatomySidebar({
  jointDef,
  activeLandmark,
  activeStructure,
  onSelectLandmark,
  enabledStructures,
  layerMode,
  onChangeLayerMode,
  onToggleStructure,
  onToggleLayerGroup,
  onIsolateStructure,
  onEnableAllStructures,
  xrayBones,
  onToggleXrayBones,
  showAllLabels,
  onToggleAllLabels,
  mriOverlayMode,
  onChangeMriOverlayMode,
}: AnatomySidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedStructures, setExpandedStructures] = useState<Record<string, boolean>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const totalCount = useMemo(
    () =>
      jointDef.anatomySystemGroups.reduce((acc, g) => acc + g.entries.length, 0),
    [jointDef]
  );

  const mriOverlayOptions: Array<{ id: MriOverlayMode; label: string }> = useMemo(
    () =>
      jointDef.supportsSubregionOverlay
        ? [
            { id: 'none', label: 'Off' },
            { id: 'atlas', label: String(totalCount) },
            { id: 'subregions', label: 'Sub' },
          ]
        : [
            { id: 'none', label: 'Off' },
            { id: 'atlas', label: 'Labels' },
          ],
    [jointDef.supportsSubregionOverlay, totalCount]
  );

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return jointDef.anatomySystemGroups;
    return jointDef.anatomySystemGroups
      .map((group) => {
        const groupMatches = group.title.toLowerCase().includes(normalizedQuery);
        const matchingEntries = group.entries.filter((entry) => {
          if (groupMatches || entry.label.toLowerCase().includes(normalizedQuery)) {
            return true;
          }
          return (entry.subLandmarks ?? []).some((sub) =>
            sub.label.toLowerCase().includes(normalizedQuery)
          );
        });
        return { ...group, entries: matchingEntries };
      })
      .filter((g) => g.entries.length > 0);
  }, [jointDef.anatomySystemGroups, normalizedQuery]);

  const handleStructureClick = (item: AnatomyLandmarkItem) => {
    onSelectLandmark(item);
    if (layerMode === 'single') {
      onIsolateStructure(item.structureId);
    }
  };

  const structInfo = jointDef.structuresInfo[activeStructure];

  return (
    <aside className="mode-sidebar" aria-label={`3D and MRI ${jointDef.shortName} anatomy outliner`}>
      {/* Compact Layer Controls + MRI Color Sync */}
      <div className="sidebar-sticky-head">
        <div className="tool-row-head">
          <span className="tool-row-label">Layers</span>
          <div className="layer-head-actions">
            <div className="segmented-pill mini-seg" role="group" aria-label="Layer selection mode">
              <button
                type="button"
                className={`pill-btn ${layerMode === 'multiple' ? 'active' : ''}`}
                onClick={() => onChangeLayerMode('multiple')}
                title="Toggle multiple layers & structures independently"
              >
                Multi
              </button>
              <button
                type="button"
                className={`pill-btn ${layerMode === 'single' ? 'active' : ''}`}
                onClick={() => onChangeLayerMode('single')}
                title="Isolate single selected layer or structure"
              >
                Single
              </button>
            </div>
            <button
              type="button"
              className="reset-link-btn"
              onClick={onEnableAllStructures}
              title={`Show all ${totalCount} anatomical structures`}
            >
              <RotateCcw size={11} />
              <span>All</span>
            </button>
          </div>
        </div>

        {/* 3x2 Compact Layer Chips (Check multiple or isolate single) */}
        <div className="layer-chips-grid">
          {jointDef.layerGroups.map((lg) => {
            const onCount = lg.structures.filter((sid) => enabledStructures.has(sid)).length;
            const active =
              layerMode === 'single'
                ? onCount === lg.structures.length && enabledStructures.size === lg.structures.length
                : onCount > 0;
            const partial = layerMode === 'multiple' && onCount > 0 && onCount < lg.structures.length;
            return (
              <button
                key={lg.id}
                type="button"
                aria-pressed={active}
                className={`layer-chip-btn ${active ? 'active' : ''} ${partial ? 'partial' : ''}`}
                onClick={() => onToggleLayerGroup(lg.id)}
              >
                <span className="layer-chip-dot" />
                <span>{lg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Visual Strip: X-Ray | MRI Colors | 3D Pins */}
        <div className="anatomy-visual-strip">
          <button
            type="button"
            className={`mini-chip ${xrayBones ? 'active' : ''}`}
            onClick={onToggleXrayBones}
            title="Make bones translucent to see internal ligaments"
          >
            <Scan size={11} />
            <span>X-Ray</span>
          </button>

          <div className="inline-mri-map" title="MRI Color Segmentation Overlay">
            <Palette size={11} className="inline-mri-icon" />
            <div className="segmented-pill mini-seg" role="group" aria-label="MRI color overlay">
              {mriOverlayOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={mriOverlayMode === opt.id}
                  className={`pill-btn ${mriOverlayMode === opt.id ? 'active' : ''}`}
                  onClick={() => onChangeMriOverlayMode(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={`mini-chip ${showAllLabels ? 'active' : ''}`}
            onClick={onToggleAllLabels}
            title="Toggle 3D anatomy pins (L)"
          >
            <Tags size={11} />
            <span>Pins</span>
          </button>
        </div>

        <div className="sidebar-search-box">
          <Search size={12} className="sidebar-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter structures…"
            aria-label="Filter anatomical structures"
            className="sidebar-search-input"
          />
        </div>
      </div>

      {/* Single Unified Scrollable Anatomy Outliner Card */}
      <div className="sidebar-scroll-tree">
        <div className="outliner-card">
          {filteredGroups.map((group) => {
            const isCollapsed = !normalizedQuery && !!collapsedGroups[group.id];
            const anyOn = group.entries.some((e) => enabledStructures.has(e.structureId));

            return (
              <div key={group.id} className="outliner-section">
                <div className="outliner-group-row">
                  <button
                    type="button"
                    className="outliner-group-toggle"
                    onClick={() =>
                      setCollapsedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                    }
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>{group.title}</span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={anyOn}
                    aria-label={`Toggle ${group.title}`}
                    className={`anat-switch ${anyOn ? 'on' : ''}`}
                    onClick={() => onToggleLayerGroup(group.id)}
                  >
                    <span className="anat-switch-thumb" />
                  </button>
                </div>

                {!isCollapsed &&
                  group.entries.map((entry) => {
                    const subs = entry.subLandmarks ?? [];
                    const hasSubs = subs.length > 0;
                    const isSubOpen = !!normalizedQuery || !!expandedStructures[entry.structureId];
                    const isEnabled = enabledStructures.has(entry.structureId);
                    const isRowFocused =
                      activeLandmark.id === entry.defaultLandmark.id ||
                      (activeStructure === entry.structureId &&
                        !subs.some((s) => s.id === activeLandmark.id));

                    return (
                      <div key={entry.structureId} className="outliner-item-wrap">
                        <div className={`outliner-item-row ${isRowFocused ? 'focused' : ''}`}>
                          {hasSubs ? (
                            <button
                              type="button"
                              className="outliner-caret-btn"
                              onClick={() =>
                                setExpandedStructures((prev) => ({
                                  ...prev,
                                  [entry.structureId]: !prev[entry.structureId],
                                }))
                              }
                              aria-label={`Expand ${entry.label} landmarks`}
                              aria-expanded={isSubOpen}
                            >
                              {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                          ) : (
                            <span className="outliner-caret-spacer" />
                          )}

                          <button
                            type="button"
                            className={`outliner-label-btn ${!isEnabled ? 'muted' : ''}`}
                            onClick={() => handleStructureClick(entry.defaultLandmark)}
                          >
                            {entry.label}
                          </button>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            aria-label={`Toggle ${entry.label} in 3D`}
                            className={`anat-switch ${isEnabled ? 'on' : ''}`}
                            onClick={() => onToggleStructure(entry.structureId)}
                          >
                            <span className="anat-switch-thumb" />
                          </button>
                        </div>

                        {hasSubs && isSubOpen && (
                          <div className="outliner-sublist">
                            {subs.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                className={`outliner-sub-btn ${activeLandmark.id === sub.id ? 'active' : ''}`}
                                onClick={() => handleStructureClick(sub)}
                              >
                                <span className="outliner-sub-dot" />
                                <span>{sub.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact 3-part Structure & MRI Inspector */}
      <div className="sidebar-active-note">
        <div className="active-note-head">
          <span className="active-note-title">{activeLandmark.label}</span>
          {structInfo && <span className="active-note-group">{structInfo.group}</span>}
        </div>
        {structInfo && (
          <div className="active-note-meta">
            <strong>Attachments:</strong> {structInfo.attachmentSummary}
          </div>
        )}
        <div className="active-note-fact">
          <strong>3T MRI &amp; Pearl:</strong> {activeLandmark.keyFact}
        </div>
      </div>
    </aside>
  );
}

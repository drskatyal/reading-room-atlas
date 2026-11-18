import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Scan,
  Search,
  Tags,
} from 'lucide-react';
import { ANATOMY_SYSTEM_GROUPS } from '../data/anatomyAndReportingData';
import type {
  AnatomyLandmarkItem,
  MriOverlayMode,
  StructureId,
  TissueVisibility,
} from '../types/atlas';

interface AnatomySidebarProps {
  activeLandmarkId: string;
  activeStructure: StructureId;
  onSelectLandmark: (item: AnatomyLandmarkItem) => void;
  visibility: TissueVisibility;
  onToggleVisibilityKey: (key: keyof TissueVisibility) => void;
  onResetVisibility: () => void;
  xrayBones: boolean;
  onToggleXrayBones: () => void;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  mriOverlayMode: MriOverlayMode;
  onChangeMriOverlayMode: (mode: MriOverlayMode) => void;
}

const MRI_OVERLAY_OPTIONS: Array<{ id: MriOverlayMode; label: string }> = [
  { id: 'none', label: 'Off' },
  { id: 'atlas', label: '16 Tissues' },
  { id: 'subregions', label: 'Subregions' },
];

export function AnatomySidebar({
  activeLandmarkId,
  activeStructure,
  onSelectLandmark,
  visibility,
  onToggleVisibilityKey,
  onResetVisibility,
  xrayBones,
  onToggleXrayBones,
  showAllLabels,
  onToggleAllLabels,
  mriOverlayMode,
  onChangeMriOverlayMode,
}: AnatomySidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedStructures, setExpandedStructures] = useState<Record<string, boolean>>({
    Femur: true,
    MedialMeniscus: true,
    ACL: true,
  });

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return ANATOMY_SYSTEM_GROUPS;
    return ANATOMY_SYSTEM_GROUPS.map((group) => {
      const groupMatches = group.title.toLowerCase().includes(normalizedQuery);
      const matchingEntries = group.entries.filter((entry) => {
        if (
          groupMatches ||
          entry.label.toLowerCase().includes(normalizedQuery) ||
          entry.shortMeta.toLowerCase().includes(normalizedQuery)
        ) {
          return true;
        }
        return (entry.subLandmarks ?? []).some((sub) =>
          sub.label.toLowerCase().includes(normalizedQuery)
        );
      });
      return { ...group, entries: matchingEntries };
    }).filter((g) => g.entries.length > 0);
  }, [normalizedQuery]);

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="mode-sidebar" aria-label="3D and MRI anatomy navigator">
      <div className="sidebar-sticky-head">
        <div className="sidebar-search-box">
          <Search size={13} className="sidebar-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter structures & landmarks…"
            aria-label="Filter anatomical structures"
            className="sidebar-search-input"
          />
        </div>

        {/* Synchronized MRI Color Map + 3D Quick Aids */}
        <div className="anatomy-tools-block">
          <div className="tool-row-head">
            <span className="tool-row-label">
              <Palette size={12} /> MRI Color Map
            </span>
            <button
              type="button"
              className="reset-link-btn"
              onClick={onResetVisibility}
              title="Show all anatomical systems"
            >
              <RotateCcw size={11} />
              <span>Show All</span>
            </button>
          </div>

          <div className="segmented-pill compact-seg" role="group" aria-label="MRI segmentation map">
            {MRI_OVERLAY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pill-btn ${mriOverlayMode === opt.id ? 'active' : ''}`}
                onClick={() => onChangeMriOverlayMode(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="anatomy-quick-toggles">
            <button
              type="button"
              className={`mini-chip ${xrayBones ? 'active' : ''}`}
              onClick={onToggleXrayBones}
              title="Make femur & tibia translucent to see internal ligaments"
            >
              <Scan size={12} />
              <span>X-Ray Bone</span>
            </button>
            <button
              type="button"
              className={`mini-chip ${showAllLabels ? 'active' : ''}`}
              onClick={onToggleAllLabels}
              title="Toggle 3D anatomical pins (L)"
            >
              <Tags size={12} />
              <span>All 3D Pins</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible 6-System Structure & Sub-Landmark Tree */}
      <div className="sidebar-scroll-tree">
        {filteredGroups.map((group) => {
          const isCollapsed = !normalizedQuery && !!collapsedGroups[group.id];
          const isLayerVisible = visibility[group.visibilityKey];

          return (
            <section key={group.id} className="anat-group">
              <div className="anat-group-header">
                <button
                  type="button"
                  className="anat-group-toggle"
                  onClick={() => toggleGroupCollapse(group.id)}
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <span className="anat-group-title">{group.title}</span>
                  <span className="anat-group-count">{group.entries.length}</span>
                </button>

                <button
                  type="button"
                  className={`eye-btn ${isLayerVisible ? 'visible' : 'hidden'}`}
                  onClick={() => onToggleVisibilityKey(group.visibilityKey)}
                  title={isLayerVisible ? `Hide ${group.title} in 3D` : `Show ${group.title} in 3D`}
                  aria-label={`Toggle visibility for ${group.title}`}
                >
                  {isLayerVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>

              {!isCollapsed && (
                <div className="anat-entry-list">
                  {group.entries.map((entry) => {
                    const hasSubs = (entry.subLandmarks?.length ?? 0) > 0;
                    const isExpanded =
                      !!normalizedQuery ||
                      !!expandedStructures[entry.structureId] ||
                      activeStructure === entry.structureId;
                    const isStructActive =
                      activeLandmarkId === entry.defaultLandmark.id ||
                      (activeStructure === entry.structureId &&
                        !(entry.subLandmarks ?? []).some((s) => s.id === activeLandmarkId));

                    return (
                      <div key={entry.structureId} className="anat-entry">
                        <div className="anat-item-row">
                          <button
                            type="button"
                            className={`anat-item-btn ${isStructActive ? 'active' : ''}`}
                            onClick={() => {
                              onSelectLandmark(entry.defaultLandmark);
                              if (hasSubs) {
                                setExpandedStructures((prev) => ({
                                  ...prev,
                                  [entry.structureId]: true,
                                }));
                              }
                            }}
                          >
                            <span className="anat-item-name">{entry.label}</span>
                            <span className="anat-item-meta">{entry.shortMeta}</span>
                          </button>

                          {hasSubs && (
                            <button
                              type="button"
                              className="sub-expand-btn"
                              onClick={() =>
                                setExpandedStructures((prev) => ({
                                  ...prev,
                                  [entry.structureId]: !prev[entry.structureId],
                                }))
                              }
                              aria-label={`Expand ${entry.label} sub-landmarks`}
                            >
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                          )}
                        </div>

                        {hasSubs && isExpanded && (
                          <div className="anat-sublist">
                            {entry.subLandmarks!.map((sub) => {
                              const subActive = activeLandmarkId === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  className={`anat-sub-btn ${subActive ? 'active' : ''}`}
                                  onClick={() => onSelectLandmark(sub)}
                                >
                                  <span className="anat-sub-dot" />
                                  <span>{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

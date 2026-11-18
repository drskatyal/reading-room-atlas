import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Layers2,
  Maximize2,
  Search,
} from 'lucide-react';
import type {
  AppWorkspaceMode,
  JointAtlasDefinition,
  JointId,
  StructureId,
} from '../types/atlas';

interface LandingHomePageProps {
  joints: JointAtlasDefinition[];
  onLaunchJointMode: (
    jointId: JointId,
    mode: Exclude<AppWorkspaceMode, 'landing'>,
    options?: { moduleId?: string; structureId?: StructureId; chapterId?: string }
  ) => void;
}

type DirectoryFilterCategory = 'all' | 'pathology' | 'guide' | 'system';

interface DirectoryItem {
  key: string;
  jointId: JointId;
  jointShort: string;
  category: Exclude<DirectoryFilterCategory, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  launchMode: 'anatomy' | 'pathology' | 'report-guide';
  moduleId?: string;
  structureId?: StructureId;
  chapterId?: string;
}

export function LandingHomePage({ joints, onLaunchJointMode }: LandingHomePageProps) {
  const [selectedJointFilter, setSelectedJointFilter] = useState<'all' | JointId>('all');
  const [selectedCategory, setSelectedCategory] = useState<DirectoryFilterCategory>('all');
  const [query, setQuery] = useState('');

  const totals = useMemo(() => {
    let structures = 0;
    let pathologies = 0;
    let chapters = 0;
    let quizzes = 0;
    for (const j of joints) {
      structures += Object.keys(j.structuresInfo).length;
      pathologies += j.modules.filter((m) => m.category === 'pathology').length;
      chapters += j.reportGuide.chapters.length;
      quizzes += j.quizQuestions.length;
    }
    return { structures, pathologies, chapters, quizzes };
  }, [joints]);

  const directoryItems = useMemo<DirectoryItem[]>(() => {
    const items: DirectoryItem[] = [];
    for (const j of joints) {
      for (const m of j.modules) {
        if (m.category !== 'pathology') continue;
        items.push({
          key: `${j.id}-mod-${m.id}`,
          jointId: j.id,
          jointShort: j.shortName,
          category: 'pathology',
          categoryLabel: 'Pathology Clinic',
          title: m.title,
          subtitle: m.diagnosticSign,
          meta: `${m.subSteps.length} steps · ${j.shortName}`,
          launchMode: 'pathology',
          moduleId: m.id,
        });
      }
      for (const ch of j.reportGuide.chapters) {
        items.push({
          key: `${j.id}-ch-${ch.id}`,
          jointId: j.id,
          jointShort: j.shortName,
          category: 'guide',
          categoryLabel: 'Reporting Guide',
          title: `${ch.number}. ${ch.title}`,
          subtitle: ch.lead,
          meta: `${ch.plates.length} MRI plate${ch.plates.length === 1 ? '' : 's'} · ${j.shortName}`,
          launchMode: 'report-guide',
          chapterId: ch.id,
        });
      }
      for (const grp of j.anatomySystemGroups) {
        const firstEntry = grp.entries[0];
        items.push({
          key: `${j.id}-sys-${grp.id}`,
          jointId: j.id,
          jointShort: j.shortName,
          category: 'system',
          categoryLabel: '3D System',
          title: grp.title,
          subtitle: grp.entries.map((e) => e.label).join(' · '),
          meta: `${grp.entries.length} structures · ${j.shortName}`,
          launchMode: 'anatomy',
          structureId: firstEntry?.structureId,
        });
      }
    }
    return items;
  }, [joints]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryItems.filter((item) => {
      if (selectedJointFilter !== 'all' && item.jointId !== selectedJointFilter) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.jointShort.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [directoryItems, selectedJointFilter, selectedCategory, query]);

  return (
    <div className="landing-scroll-page">
      <div className="landing-container">
        <header className="landing-hero">
          <div className="landing-hero-copy">
            <span className="ra-eyebrow">
              Musculoskeletal 3D + 3.0T MRI Education Platform
            </span>
            <h1 className="landing-hero-title">
              Six-Joint Interactive 3T MRI &amp; Surgical Anatomy Atlas
            </h1>
            <p className="landing-hero-lead">
              Explore voxel-synced 3D dissections alongside 3.0T MRI stacks, structured pathology
              clinics, reporting monographs, and board-style active recall cases across the
              major appendicular joints.
            </p>
            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-primary-btn"
                onClick={() => onLaunchJointMode('ankle', 'pathology')}
              >
                <Activity size={15} />
                <span>Launch Flagship Ankle Atlas</span>
                <ArrowUpRight size={14} />
              </button>
              <button
                type="button"
                className="landing-secondary-btn"
                onClick={() => onLaunchJointMode('knee', 'anatomy')}
              >
                <Layers2 size={15} />
                <span>Open OpenMSK 3T Knee</span>
              </button>
              <button
                type="button"
                className="landing-secondary-btn"
                onClick={() => onLaunchJointMode('ankle', 'report-guide')}
              >
                <BookOpen size={15} />
                <span>Ankle Reporting Guide</span>
              </button>
            </div>
          </div>

          <div className="landing-kpi-grid" aria-label="Platform scope metrics">
            <div className="landing-kpi-card">
              <span className="landing-kpi-val">{joints.length}</span>
              <span className="landing-kpi-label">Joint Atlases</span>
            </div>
            <div className="landing-kpi-card">
              <span className="landing-kpi-val">{totals.structures}</span>
              <span className="landing-kpi-label">3D Structures</span>
            </div>
            <div className="landing-kpi-card">
              <span className="landing-kpi-val">{totals.pathologies}</span>
              <span className="landing-kpi-label">Pathology Clinics</span>
            </div>
            <div className="landing-kpi-card">
              <span className="landing-kpi-val">{totals.chapters}</span>
              <span className="landing-kpi-label">Guide Chapters</span>
            </div>
            <div className="landing-kpi-card">
              <span className="landing-kpi-val">{totals.quizzes}</span>
              <span className="landing-kpi-label">Active-Recall Cases</span>
            </div>
          </div>
        </header>

        <section className="landing-section" aria-labelledby="joints-grid-heading">
          <div className="landing-section-head">
            <div>
              <h2 id="joints-grid-heading" className="landing-section-title">
                Interactive 3T Joint Workstations
              </h2>
              <p className="landing-section-sub">
                Select any joint to open synchronized 3D osteology &amp; multiplanar MRI, pathology
                clinics, systematic reporting guides, or board-style quizzes.
              </p>
            </div>
          </div>

          <div className="landing-joints-grid">
            {joints.map((joint) => {
              const structCount = Object.keys(joint.structuresInfo).length;
              const pathCount = joint.modules.filter((m) => m.category === 'pathology').length;
              const guideCount = joint.reportGuide.chapters.length;
              const isFlagship = Boolean(joint.featuredBadge);

              return (
                <article
                  key={joint.id}
                  className={`landing-joint-card ${isFlagship ? 'is-flagship' : ''}`}
                >
                  <div className="landing-joint-top">
                    <div className="landing-joint-thumb-wrap">
                      <img
                        src={joint.previewPlateSrc}
                        alt={`${joint.shortName} 3T MRI slice preview`}
                        className="landing-joint-thumb"
                        loading="lazy"
                      />
                      <span className="landing-joint-scanner">{joint.scannerBadge}</span>
                    </div>

                    <div className="landing-joint-headinfo">
                      <div className="landing-joint-badges">
                        {joint.featuredBadge && (
                          <span className="landing-badge-flagship">{joint.featuredBadge}</span>
                        )}
                        <span className="landing-badge-metric">{structCount} 3D structures</span>
                        <span className="landing-badge-metric">{pathCount} clinics</span>
                        <span className="landing-badge-metric">{guideCount} chapters</span>
                      </div>
                      <h3 className="landing-joint-title">{joint.name}</h3>
                      <p className="landing-joint-tagline">{joint.tagline}</p>
                    </div>
                  </div>

                  <p className="landing-joint-summary">{joint.heroSummary}</p>

                  <ul className="landing-joint-highlights">
                    {joint.clinicalHighlights.map((hl) => (
                      <li key={hl}>{hl}</li>
                    ))}
                  </ul>

                  <div className="landing-joint-actions">
                    <button
                      type="button"
                      className="landing-mode-btn is-primary"
                      onClick={() => onLaunchJointMode(joint.id, 'anatomy')}
                    >
                      <Layers2 size={13} />
                      <span>Anatomy</span>
                    </button>
                    <button
                      type="button"
                      className="landing-mode-btn"
                      onClick={() => onLaunchJointMode(joint.id, 'pathology')}
                    >
                      <ClipboardCheck size={13} />
                      <span>Pathologies ({pathCount})</span>
                    </button>
                    <button
                      type="button"
                      className="landing-mode-btn"
                      onClick={() => onLaunchJointMode(joint.id, 'report-guide')}
                    >
                      <BookOpen size={13} />
                      <span>Report Guide</span>
                    </button>
                    <button
                      type="button"
                      className="landing-mode-btn"
                      onClick={() => onLaunchJointMode(joint.id, 'fullscreen-3d')}
                    >
                      <Maximize2 size={13} />
                      <span>3D View</span>
                    </button>
                    <button
                      type="button"
                      className="landing-mode-btn"
                      onClick={() => onLaunchJointMode(joint.id, 'quiz')}
                    >
                      <GraduationCap size={13} />
                      <span>Quiz ({joint.quizQuestions.length})</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="directory-heading">
          <div className="landing-section-head">
            <div>
              <h2 id="directory-heading" className="landing-section-title">
                All Modules &amp; Pathology Directory
              </h2>
              <p className="landing-section-sub">
                Search or filter {directoryItems.length} pathology clinics, reporting chapters, and
                3D anatomical systems across all 6 joints.
              </p>
            </div>
            <div className="landing-search-box">
              <Search size={14} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lesions, ligaments, grading systems..."
                aria-label="Search modules and pathologies"
              />
            </div>
          </div>

          <div className="landing-filter-bars">
            <div className="landing-pill-row" role="group" aria-label="Filter by joint">
              <button
                type="button"
                className={`landing-filter-pill ${selectedJointFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setSelectedJointFilter('all')}
              >
                All Joints
              </button>
              {joints.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  className={`landing-filter-pill ${selectedJointFilter === j.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedJointFilter(j.id)}
                >
                  {j.shortName}
                </button>
              ))}
            </div>

            <div className="landing-pill-row" role="group" aria-label="Filter by module category">
              {(
                [
                  { id: 'all', label: 'All Modules' },
                  { id: 'pathology', label: 'Pathology Clinics' },
                  { id: 'guide', label: 'Reporting Guides' },
                  { id: 'system', label: '3D Systems' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`landing-filter-pill ${selectedCategory === cat.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-directory-grid">
            {filteredItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="landing-directory-card"
                onClick={() =>
                  onLaunchJointMode(item.jointId, item.launchMode, {
                    moduleId: item.moduleId,
                    structureId: item.structureId,
                    chapterId: item.chapterId,
                  })
                }
              >
                <div className="landing-dir-head">
                  <span className={`landing-dir-cat cat-${item.category}`}>
                    {item.categoryLabel}
                  </span>
                  <span className="landing-dir-meta">{item.meta}</span>
                </div>
                <strong className="landing-dir-title">{item.title}</strong>
                <span className="landing-dir-sub">{item.subtitle}</span>
              </button>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <div className="landing-empty-state">
              No matching modules found. Try clearing your filter or searching another clinical sign.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

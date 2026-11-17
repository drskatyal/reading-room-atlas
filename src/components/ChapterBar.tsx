import { motion } from 'motion/react';
import type { KneeChapter, KneeChapterId, KneeKinematics } from '../types/atlas';

interface ChapterBarProps {
  chapters: KneeChapter[];
  activeChapterId: KneeChapterId;
  onSelectChapter: (id: KneeChapterId) => void;
  flexionDeg: number;
  onChangeFlexion: (deg: number) => void;
  kinematics: KneeKinematics;
}

export function ChapterBar({
  chapters,
  activeChapterId,
  onSelectChapter,
  flexionDeg,
  onChangeFlexion,
  kinematics,
}: ChapterBarProps) {
  return (
    <footer className="chapter-footer" aria-label="Clinical chapters and knee kinematics">
      <div className="chapter-pills" role="tablist" aria-label="Knee MRI clinical chapters">
        {chapters.map((ch, idx) => {
          const isActive = ch.id === activeChapterId;
          return (
            <button
              key={ch.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`chapter-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectChapter(ch.id)}
              title={`${ch.title} (Shortcut ${idx + 1})`}
            >
              {isActive && (
                <motion.span
                  layoutId="chapter-active-ring"
                  className="seg-indicator"
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                />
              )}
              <span className="chapter-tag">{idx + 1}</span>
              <span>{ch.shortTitle}</span>
            </button>
          );
        })}
      </div>

      <div className="biomech-bar">
        <label className="slider-inline" htmlFor="flexion-range">
          <span>Flexion</span>
          <input
            id="flexion-range"
            type="range"
            min={0}
            max={90}
            step={1}
            value={flexionDeg}
            onChange={(e) => onChangeFlexion(Number(e.target.value))}
          />
          <span className="mono-val">{flexionDeg}°</span>
        </label>

        <div className="biomech-readout" aria-label="Biomechanical kinematics telemetry">
          <span>
            Screw-home <strong className="mono-val">{kinematics.screwHomeDeg}°</strong>
          </span>
          <span>
            AP drawer{' '}
            <strong className="mono-val">
              {kinematics.anteriorDrawerMm >= 0 ? '+' : ''}
              {kinematics.anteriorDrawerMm} mm
            </strong>
          </span>
          {kinematics.meniscalExtrusionMm > 1 && (
            <span>
              Extrusion <strong className="mono-val">{kinematics.meniscalExtrusionMm} mm</strong>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

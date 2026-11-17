import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, type CameraPreset, type ThreeSceneContext } from '../components/ThreeViewport';
import {
  buildLiradsReport,
  calculateAcrLirads,
  type LiradsInput,
} from '../core/clinicalCalculators';
import {
  applyWindowLevel,
  drawPacsOrientationMarkers,
  drawPacsScaleBar,
  fastPixelNoise,
  type WindowLevel,
} from '../core/dicomCanvas';
import { createAnatomyMaterial, tagAnatomyMesh } from '../core/threeUtils';
import type { StructuredReport } from '../types/radiology';

type DynamicPhase = 'Pre-Contrast' | 'Arterial' | 'Portal Venous' | 'Delayed / HBP';

interface LiverLiradsModuleProps {
  presetTrigger?: string;
  onReportChange: (report: StructuredReport) => void;
  onExposeCanvases: (get3d: () => HTMLCanvasElement | null, get2d: () => HTMLCanvasElement | null) => void;
}

const SEGMENT_COORDS: Record<LiradsInput['segment'], { pos: [number, number, number]; color: number; desc: string; level: 'sup' | 'inf' }> = {
  I: { pos: [0.05, 0.05, -0.58], color: 0xa78bfa, desc: 'Caudate lobe (autonomous drainage directly to IVC; hypertrophies in cirrhosis).', level: 'sup' },
  II: { pos: [1.02, 0.5, -0.1], color: 0x38bdf8, desc: 'Left lateral superior segment (lateral to Left HV, above portal plane).', level: 'sup' },
  III: { pos: [1.1, -0.42, 0.16], color: 0x22d3ee, desc: 'Left lateral inferior segment (lateral to falciform ligament, below portal plane).', level: 'inf' },
  IVa: { pos: [0.42, 0.55, 0.14], color: 0x34d399, desc: 'Left medial superior segment (between Middle HV and Left HV).', level: 'sup' },
  IVb: { pos: [0.42, -0.45, 0.25], color: 0x6ee7b7, desc: 'Left medial inferior / quadrate segment adjacent to gallbladder fossa.', level: 'inf' },
  V: { pos: [-0.36, -0.48, 0.25], color: 0xfbbf24, desc: 'Right anterior inferior segment (between Middle HV and Right HV).', level: 'inf' },
  VI: { pos: [-1.05, -0.46, -0.2], color: 0xf59e0b, desc: 'Right posterior inferior segment (posterior to Right HV, below portal vein).', level: 'inf' },
  VII: { pos: [-1.02, 0.52, -0.25], color: 0xf97316, desc: 'Right posterior superior segment (subdiaphragmatic posterior to Right HV).', level: 'sup' },
  VIII: { pos: [-0.38, 0.58, 0.12], color: 0xf87171, desc: 'Right anterior superior dome segment (between Middle and Right HV).', level: 'sup' },
};

const CAMERA_PRESETS: CameraPreset[] = [
  { label: 'AP', position: [0, 0.7, 5.2], target: [0, 0, 0] },
  { label: 'Dome', position: [0.2, 4.6, 2.1], target: [0, 0, 0] },
  { label: 'Caudate', position: [0.4, 0.5, -5.0], target: [0, 0, 0] },
];

export function LiverLiradsModule({
  presetTrigger,
  onReportChange,
  onExposeCanvases,
}: LiverLiradsModuleProps) {
  const [input, setInput] = useState<LiradsInput>({
    segment: 'VIII',
    sizeMm: 24,
    aphe: true,
    washout: true,
    capsule: true,
    thresholdGrowth: false,
    isBenignCystOrHemangioma: false,
    isTargetoidLrm: false,
    isTumorInVein: false,
    ancillaryMalignancy: false,
    ancillaryBenign: false,
  });

  const [phase, setPhase] = useState<DynamicPhase>('Arterial');
  const [wl, setWl] = useState<WindowLevel>({ width: 380, level: 55 });
  const [showVessels, setShowVessels] = useState(true);
  const [showSegments, setShowSegments] = useState(true);

  const pacsCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (presetTrigger === 'lr5') {
      setInput((prev) => ({
        ...prev,
        segment: 'VIII',
        sizeMm: 24,
        aphe: true,
        washout: true,
        capsule: true,
        isBenignCystOrHemangioma: false,
        isTargetoidLrm: false,
        isTumorInVein: false,
      }));
      setPhase('Arterial');
    }
  }, [presetTrigger]);

  useEffect(() => {
    onExposeCanvases(
      () => threeCanvasRef.current,
      () => pacsCanvasRef.current
    );
  }, [onExposeCanvases]);

  const result = useMemo(() => calculateAcrLirads(input), [input]);
  const report = useMemo(() => buildLiradsReport(input, result), [input, result]);

  useEffect(() => {
    onReportChange(report);
  }, [report, onReportChange]);

  const refs = useRef<{
    segmentsGroup?: THREE.Group;
    vesselsGroup?: THREE.Group;
    lesionMesh?: THREE.Mesh;
    lesionMat?: THREE.MeshStandardMaterial;
  }>({});

  const buildLiver3D = useCallback((ctx: ThreeSceneContext) => {
    const r = refs.current;
    const root = ctx.root;

    const segmentsGroup = new THREE.Group();
    r.segmentsGroup = segmentsGroup;
    root.add(segmentsGroup);

    (Object.keys(SEGMENT_COORDS) as LiradsInput['segment'][]).forEach((seg) => {
      const cfg = SEGMENT_COORDS[seg];
      const mat = createAnatomyMaterial({
        color: cfg.color,
        roughness: 0.45,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      });
      const radius = seg === 'I' ? 0.32 : seg === 'II' || seg === 'III' ? 0.44 : 0.54;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), mat);
      mesh.scale.set(1.05, 0.92, 0.95);
      mesh.position.set(...cfg.pos);
      tagAnatomyMesh(mesh, {
        structureId: `seg-${seg}`,
        label: `Couinaud Segment ${seg}`,
        description: cfg.desc,
      });
      segmentsGroup.add(mesh);
    });

    // Hepatic Veins + Portal Vein + IVC + Gallbladder
    const vesselsGroup = new THREE.Group();
    r.vesselsGroup = vesselsGroup;
    root.add(vesselsGroup);

    const hvMat = createAnatomyMaterial({ color: 0x3b82f6, roughness: 0.38 });
    const pvMat = createAnatomyMaterial({ color: 0xa855f7, roughness: 0.4 });

    const ivc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 16), hvMat);
    ivc.position.set(-0.08, 0.1, -0.78);
    tagAnatomyMesh(ivc, {
      structureId: 'ivc',
      label: 'Inferior Vena Cava (IVC)',
      description: 'Receives Right, Middle, and Left Hepatic Veins at the superior dome confluence.',
    });

    const hvPaths: Array<{ name: string; pts: THREE.Vector3[]; desc: string }> = [
      {
        name: 'Right Hepatic Vein',
        pts: [new THREE.Vector3(-0.08, 0.85, -0.7), new THREE.Vector3(-0.72, 0.45, -0.15), new THREE.Vector3(-0.98, -0.1, 0.02)],
        desc: 'Vertical scissural plane separating Right Anterior (V/VIII) from Right Posterior (VI/VII) sectors.',
      },
      {
        name: 'Middle Hepatic Vein (Cantlie Line)',
        pts: [new THREE.Vector3(-0.08, 0.85, -0.7), new THREE.Vector3(0.02, 0.35, 0.12), new THREE.Vector3(0.04, -0.35, 0.36)],
        desc: 'Defines Cantlie’s line separating functional Right and Left hemilivers (runs toward gallbladder fossa).',
      },
      {
        name: 'Left Hepatic Vein',
        pts: [new THREE.Vector3(-0.08, 0.85, -0.7), new THREE.Vector3(0.66, 0.48, -0.05), new THREE.Vector3(0.95, 0.05, 0.08)],
        desc: 'Separates Left Lateral (II/III) from Left Medial (IVa/IVb) segments.',
      },
    ];

    hvPaths.forEach((hv, i) => {
      const m = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hv.pts), 18, 0.068, 10, false),
        hvMat
      );
      tagAnatomyMesh(m, { structureId: `hv-${i}`, label: hv.name, description: hv.desc });
      vesselsGroup.add(m);
    });

    // Portal Vein Bifurcation (Horizontal plane dividing superior & inferior segments!)
    const mainPv = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.1, -0.95, -0.25),
          new THREE.Vector3(-0.05, -0.25, -0.15),
          new THREE.Vector3(-0.02, 0.02, -0.08),
        ]),
        16,
        0.11,
        12,
        false
      ),
      pvMat
    );
    const rightPv = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.02, 0.02, -0.08),
          new THREE.Vector3(-0.55, 0.02, -0.06),
          new THREE.Vector3(-0.98, 0.04, -0.14),
        ]),
        14,
        0.075,
        10,
        false
      ),
      pvMat
    );
    const leftPv = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.02, 0.02, -0.08),
          new THREE.Vector3(0.55, 0.04, 0.06),
          new THREE.Vector3(0.95, 0.06, 0.08),
        ]),
        14,
        0.072,
        10,
        false
      ),
      pvMat
    );
    tagAnatomyMesh(mainPv, {
      structureId: 'portal-vein',
      label: 'Portal Vein Bifurcation (Horizontal Plane)',
      description: 'Transverse plane at the portal bifurcation separates superior segments (II, IVa, VIII, VII) from inferior segments (III, IVb, V, VI).',
    });

    // Gallbladder
    const gb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 14),
      createAnatomyMaterial({ color: 0x10b981, roughness: 0.3 })
    );
    gb.scale.set(0.85, 0.85, 1.65);
    gb.position.set(0.02, -0.68, 0.48);
    tagAnatomyMesh(gb, {
      structureId: 'gallbladder',
      label: 'Gallbladder Fossa (Inferior Cantlie Line)',
      description: 'Marks the inferior boundary between Segment IVb (left medial) and Segment V (right anterior).',
    });

    vesselsGroup.add(ivc, mainPv, rightPv, leftPv, gb);

    // Target Hepatic Observation
    const lesionMat = createAnatomyMaterial({
      color: 0xf87171,
      emissive: 0x991b1b,
      emissiveIntensity: 0.55,
      roughness: 0.3,
    });
    r.lesionMat = lesionMat;
    const lesionMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), lesionMat);
    tagAnatomyMesh(lesionMesh, {
      structureId: 'hepatic-observation',
      label: 'Target Hepatic Observation',
      description: 'Positioned in the selected Couinaud segment; color reflects current ACR LI-RADS category.',
    });
    r.lesionMesh = lesionMesh;
    root.add(lesionMesh);
  }, []);

  const updateLiver3D = useCallback(() => {
    const r = refs.current;
    if (r.segmentsGroup) r.segmentsGroup.visible = showSegments;
    if (r.vesselsGroup) r.vesselsGroup.visible = showVessels;

    if (r.lesionMesh && r.lesionMat) {
      const cfg = SEGMENT_COORDS[input.segment];
      r.lesionMesh.position.set(...cfg.pos);
      const s = Math.max(0.55, Math.min(1.65, input.sizeMm / 24));
      r.lesionMesh.scale.set(s, s, s);

      if (result.category === 'LR-1' || result.category === 'LR-2') {
        r.lesionMat.color.setHex(0x34d399);
        r.lesionMat.emissive.setHex(0x065f46);
      } else if (result.category === 'LR-3') {
        r.lesionMat.color.setHex(0x38bdf8);
        r.lesionMat.emissive.setHex(0x0369a1);
      } else if (result.category === 'LR-4') {
        r.lesionMat.color.setHex(0xfbbf24);
        r.lesionMat.emissive.setHex(0xb45309);
      } else {
        r.lesionMat.color.setHex(0xf87171);
        r.lesionMat.emissive.setHex(0x991b1b);
      }
    }
  }, [input.segment, input.sizeMm, result.category, showSegments, showVessels]);

  // 2D 4-Phase Dynamic CT / Time-Intensity Curve Renderer
  useEffect(() => {
    const canvas = pacsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const imgH = 290;
    const img = ctx.createImageData(W, imgH);
    const data = img.data;

    // Parenchyma HU across dynamic phases
    const liverHu =
      phase === 'Pre-Contrast'
        ? 52
        : phase === 'Arterial'
          ? 70
          : phase === 'Portal Venous'
            ? 122
            : 102;
    const vesselHu =
      phase === 'Pre-Contrast'
        ? 44
        : phase === 'Arterial'
          ? 275
          : phase === 'Portal Venous'
            ? 175
            : 120;

    // Observation HU kinetics
    let lesionHu = liverHu - 12;
    if (input.isBenignCystOrHemangioma) {
      lesionHu = 10; // cyst
    } else if (input.isTargetoidLrm) {
      lesionHu = phase === 'Delayed / HBP' ? 128 : 58;
    } else {
      if (phase === 'Pre-Contrast') lesionHu = 42;
      else if (phase === 'Arterial') lesionHu = input.aphe ? 168 : 66;
      else if (phase === 'Portal Venous') lesionHu = input.washout ? 82 : 126;
      else lesionHu = input.washout ? 68 : 106;
    }

    // Place lesion in axial liver according to segment
    const segPositions2D: Record<LiradsInput['segment'], [number, number]> = {
      I: [0.02, 0.14],
      II: [0.36, -0.05],
      III: [0.44, -0.22],
      IVa: [0.18, -0.22],
      IVb: [0.16, -0.32],
      V: [-0.22, -0.26],
      VI: [-0.48, 0.08],
      VII: [-0.46, 0.22],
      VIII: [-0.26, -0.06],
    };
    const [lx, ly] = segPositions2D[input.segment];
    const lr = Math.max(0.06, Math.min(0.16, input.sizeMm / 240));

    for (let py = 0; py < imgH; py++) {
      const ny = (py / imgH) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const nx = (px / W) * 2 - 1;
        let hu = -920;

        // Body contour
        const bodyR = Math.hypot(nx * 0.92, ny * 1.25);
        if (bodyR < 0.88) {
          hu = bodyR > 0.78 ? -85 : 38; // Subcutaneous fat vs muscle/abdomen

          // Liver silhouette (anatomical right = left side of image nx < 0, extending across midline to nx ~ +0.55)
          const inRightLobe = Math.hypot((nx + 0.28) * 1.25, (ny - 0.02) * 1.35) < 0.48;
          const inLeftLobe = Math.hypot((nx - 0.18) * 1.0, (ny + 0.16) * 1.85) < 0.42;
          if (inRightLobe || inLeftLobe) {
            hu = liverHu;

            // Aorta (bright on arterial!) & IVC
            if (Math.hypot(nx - 0.02, ny - 0.34) < 0.065) hu = vesselHu;
            if (Math.hypot(nx + 0.08, ny - 0.22) < 0.06) hu = phase === 'Arterial' ? 95 : vesselHu * 0.8;

            // Target Observation
            const ld = Math.hypot(nx - lx, ny - ly);
            if (ld < lr) {
              if (input.isTargetoidLrm) {
                // Rim APHE in arterial, delayed central fill
                hu = phase === 'Arterial' && ld > lr * 0.65 ? 165 : lesionHu;
              } else {
                hu = lesionHu;
              }
            }
            // Enhancing capsule on Portal / Delayed
            if (input.capsule && (phase === 'Portal Venous' || phase === 'Delayed / HBP') && ld >= lr * 0.92 && ld <= lr * 1.15) {
              hu = 148;
            }
          }

          // Spleen (posterior-right of image nx > 0.45, ny > 0.05)
          if (Math.hypot((nx - 0.56) * 1.5, (ny - 0.14) * 1.35) < 0.28) {
            hu = phase === 'Arterial' ? 145 : liverHu + 12;
          }

          // Spine (vertebral body posterior midline)
          if (Math.hypot(nx, ny - 0.48) < 0.14) {
            hu = 480;
          }
        }

        const noisy = hu + fastPixelNoise(px, py, 33) * 11;
        const gray = applyWindowLevel(noisy, wl);
        const idx = (py * W + px) * 4;
        data[idx] = gray;
        data[idx + 1] = gray;
        data[idx + 2] = gray;
        data[idx + 3] = 255;
      }
    }

    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, W, H);
    ctx.putImageData(img, 0, 0);

    drawPacsOrientationMarkers(ctx, W, imgH, { top: 'A', bottom: 'P', left: 'R', right: 'L' });
    drawPacsScaleBar(ctx, W - 26, 85, 90, '10 cm');

    // Bottom Strip: 4-Phase Time-Intensity Enhancement Curve (y: 292..400)
    const cTop = 294;
    const cH = H - cTop - 8;
    ctx.fillStyle = '#090d14';
    ctx.fillRect(8, cTop, W - 16, cH);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeRect(8, cTop, W - 16, cH);

    ctx.fillStyle = '#a1a7b3';
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillText('ENHANCEMENT: LESION (AMBER) vs LIVER (CYAN)', 14, cTop + 14);

    const phases: DynamicPhase[] = ['Pre-Contrast', 'Arterial', 'Portal Venous', 'Delayed / HBP'];
    const liverVals = [52, 70, 122, 102];
    const lesVals = [
      input.isBenignCystOrHemangioma ? 10 : 42,
      input.isBenignCystOrHemangioma ? 10 : input.aphe ? 168 : 66,
      input.isBenignCystOrHemangioma ? 10 : input.washout ? 82 : 126,
      input.isBenignCystOrHemangioma ? 10 : input.washout ? 68 : 106,
    ];

    const plotCurve = (vals: number[], color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      vals.forEach((v, i) => {
        const x = 36 + (i / 3) * (W - 72);
        const y = cTop + cH - 18 - (v / 190) * (cH - 38);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    plotCurve(liverVals, '#38bdf8');
    plotCurve(lesVals, '#fbbf24');

    phases.forEach((p, i) => {
      const x = 36 + (i / 3) * (W - 72);
      ctx.fillStyle = phase === p ? '#e5be70' : '#6f7785';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.split(' ')[0], x, cTop + cH - 5);
    });
    ctx.textAlign = 'left';
  }, [input, phase, wl]);

  return (
    <div className="workstation-body">
      <aside className="control-rail" aria-label="Liver LI-RADS Controls">
        <div className="rail-header">
          <h1 className="rail-title">Liver LI-RADS v2018</h1>
          <div className="rail-subtitle">Couinaud Segments I–VIII &amp; 4-Phase CT/MRI Kinetics</div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>Couinaud Segment</span>
            <span>Seg {input.segment}</span>
          </div>
          <div className="chip-grid">
            {(['I', 'II', 'III', 'IVa', 'IVb', 'V', 'VI', 'VII', 'VIII'] as const).map((seg) => (
              <button
                key={seg}
                type="button"
                className={`chip-btn ${input.segment === seg ? 'active' : ''}`}
                onClick={() => setInput({ ...input, segment: seg })}
              >
                {seg}
              </button>
            ))}
          </div>

          <div className="slider-field">
            <div className="slider-meta">
              <span>Observation Size</span>
              <span className="slider-val">{input.sizeMm} mm</span>
            </div>
            <input
              id="lirads-size-slider"
              type="range"
              min={6}
              max={52}
              value={input.sizeMm}
              onChange={(e) => setInput({ ...input, sizeMm: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>Major HCC Features</span>
            <span>{result.category}</span>
          </div>
          <div className="toggle-list">
            <label className="toggle-row">
              <span>Nonrim Arterial Hyperenhancement (APHE)</span>
              <input
                type="checkbox"
                checked={input.aphe}
                onChange={(e) => setInput({ ...input, aphe: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>Nonperipheral Washout</span>
              <input
                type="checkbox"
                checked={input.washout}
                onChange={(e) => setInput({ ...input, washout: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>Enhancing "Capsule"</span>
              <input
                type="checkbox"
                checked={input.capsule}
                onChange={(e) => setInput({ ...input, capsule: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>Threshold Growth (≥ 50% in ≤ 6 mo)</span>
              <input
                type="checkbox"
                checked={input.thresholdGrowth}
                onChange={(e) => setInput({ ...input, thresholdGrowth: e.target.checked })}
              />
            </label>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">Special Categories &amp; Ancillary</div>
          <div className="toggle-list">
            <label className="toggle-row">
              <span>Ancillary Favoring Malignancy</span>
              <input
                type="checkbox"
                checked={input.ancillaryMalignancy}
                onChange={(e) =>
                  setInput({ ...input, ancillaryMalignancy: e.target.checked, ancillaryBenign: false })
                }
              />
            </label>
            <label className="toggle-row">
              <span>LR-M Targetoid (Cholangio)</span>
              <input
                type="checkbox"
                checked={input.isTargetoidLrm}
                onChange={(e) =>
                  setInput({ ...input, isTargetoidLrm: e.target.checked, isBenignCystOrHemangioma: false, isTumorInVein: false })
                }
              />
            </label>
            <label className="toggle-row">
              <span>LR-TIV (Tumor in Vein)</span>
              <input
                type="checkbox"
                checked={input.isTumorInVein}
                onChange={(e) =>
                  setInput({ ...input, isTumorInVein: e.target.checked, isBenignCystOrHemangioma: false })
                }
              />
            </label>
            <label className="toggle-row">
              <span>LR-1 Definite Benign (Cyst)</span>
              <input
                type="checkbox"
                checked={input.isBenignCystOrHemangioma}
                onChange={(e) =>
                  setInput({ ...input, isBenignCystOrHemangioma: e.target.checked, isTargetoidLrm: false, isTumorInVein: false })
                }
              />
            </label>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">3D Layers</div>
          <label className="toggle-row">
            <span>Couinaud Segments I–VIII</span>
            <input type="checkbox" checked={showSegments} onChange={(e) => setShowSegments(e.target.checked)} />
          </label>
          <label className="toggle-row">
            <span>Hepatic &amp; Portal Veins</span>
            <input type="checkbox" checked={showVessels} onChange={(e) => setShowVessels(e.target.checked)} />
          </label>
        </div>
      </aside>

      <main className="stage-area">
        <ThreeViewport
          title="3D Couinaud Liver & Vascular Planes"
          badge="3D WEBGL"
          cameraPresets={CAMERA_PRESETS}
          initialCamera={[0, 0.7, 5.2]}
          onBuildScene={(ctx) => {
            buildLiver3D(ctx);
            updateLiver3D();
          }}
          onUpdateScene={updateLiver3D}
          deps={[updateLiver3D]}
          onCanvasExpose={(canvas) => {
            threeCanvasRef.current = canvas;
          }}
        />

        <section className="viewport-card" aria-label="4-Phase Dynamic Liver CT Viewer">
          <div className="viewport-header">
            <div className="vp-title-group">
              <span className="vp-badge">{result.category}</span>
              <span className="vp-title">
                {phase} • Seg {input.segment}
              </span>
            </div>
            <div className="vp-toolbar">
              {(
                [
                  { id: 'Pre-Contrast', short: 'Pre' },
                  { id: 'Arterial', short: 'Art' },
                  { id: 'Portal Venous', short: 'PV' },
                  { id: 'Delayed / HBP', short: 'Del' },
                ] as const
              ).map((ph) => (
                <button
                  key={ph.id}
                  type="button"
                  className={`vp-mini-btn ${phase === ph.id ? 'active' : ''}`}
                  onClick={() => setPhase(ph.id)}
                >
                  {ph.short}
                </button>
              ))}
              <button
                type="button"
                className={`vp-mini-btn ${wl.width < 220 ? 'active' : ''}`}
                onClick={() => setWl(wl.width < 220 ? { width: 380, level: 55 } : { width: 160, level: 85 })}
                title="Toggle Narrow Liver Window (W:160 L:85) vs Abdomen (W:380 L:55)"
              >
                {wl.width < 220 ? 'Liv' : 'Abd'}
              </button>
            </div>
          </div>

          <div className="pacs-stage" style={{ padding: 6 }}>
            <div className="pacs-canvas-wrap">
              <canvas ref={pacsCanvasRef} width={400} height={410} className="pacs-canvas" />
              <div className="pacs-overlay-tl">
                <div>DYNAMIC 4-PHASE CT</div>
                <div>PHASE: {phase.toUpperCase()}</div>
              </div>
              <div className="pacs-overlay-tr">
                <div>{result.category}</div>
                <div>SEG {input.segment}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

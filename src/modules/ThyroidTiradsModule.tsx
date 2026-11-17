import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, type CameraPreset, type ThreeSceneContext } from '../components/ThreeViewport';
import {
  buildTiradsReport,
  calculateAcrTirads,
  type TiradsInput,
} from '../core/clinicalCalculators';
import { fastPixelNoise } from '../core/dicomCanvas';
import { createAnatomyMaterial, tagAnatomyMesh } from '../core/threeUtils';
import type { StructuredReport } from '../types/radiology';

interface ThyroidTiradsModuleProps {
  presetTrigger?: string;
  onReportChange: (report: StructuredReport) => void;
  onExposeCanvases: (get3d: () => HTMLCanvasElement | null, get2d: () => HTMLCanvasElement | null) => void;
}

const CAMERA_PRESETS: CameraPreset[] = [
  { label: 'AP Neck', position: [0, 0.3, 5.2], target: [0, 0, 0] },
  { label: 'Oblique', position: [3.6, 0.7, 3.8], target: [0, 0, 0] },
  { label: 'TE Groove', position: [-3.9, 0.1, -2.9], target: [0, -0.1, -0.3] },
];

export function ThyroidTiradsModule({
  presetTrigger,
  onReportChange,
  onExposeCanvases,
}: ThyroidTiradsModuleProps) {
  const [input, setInput] = useState<TiradsInput>({
    lobe: 'Right',
    pole: 'Mid',
    sizeMm: 14,
    composition: 'solid',
    echogenicity: 'very-hypoechoic',
    shape: 'taller',
    margin: 'lobulated',
    foci: 'punctate',
  });
  const [usPlane, setUsPlane] = useState<'Transverse' | 'Longitudinal'>('Transverse');
  const [colorDoppler, setColorDoppler] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showRln, setShowRln] = useState(true);

  const usCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (presetTrigger === 'tr5') {
      setInput({
        lobe: 'Right',
        pole: 'Mid',
        sizeMm: 14,
        composition: 'solid',
        echogenicity: 'very-hypoechoic',
        shape: 'taller',
        margin: 'lobulated',
        foci: 'punctate',
      });
    }
  }, [presetTrigger]);

  useEffect(() => {
    onExposeCanvases(
      () => threeCanvasRef.current,
      () => usCanvasRef.current
    );
  }, [onExposeCanvases]);

  const result = useMemo(() => calculateAcrTirads(input), [input]);
  const report = useMemo(() => buildTiradsReport(input, result), [input, result]);

  useEffect(() => {
    onReportChange(report);
  }, [report, onReportChange]);

  const refs = useRef<{
    thyroidMat?: THREE.MeshStandardMaterial;
    noduleMesh?: THREE.Mesh;
    noduleMat?: THREE.MeshStandardMaterial;
    vesselsGroup?: THREE.Group;
    rlnGroup?: THREE.Group;
  }>({});

  const buildThyroid3D = useCallback((ctx: ThreeSceneContext) => {
    const r = refs.current;
    const root = ctx.root;

    const thyroidMat = createAnatomyMaterial({
      color: 0xc9646b,
      roughness: 0.44,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    r.thyroidMat = thyroidMat;

    // Right & Left Thyroid Lobes + Isthmus
    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 20), thyroidMat);
    rightLobe.scale.set(0.75, 1.85, 0.72);
    rightLobe.position.set(-0.68, 0, 0.15);
    tagAnatomyMesh(rightLobe, {
      structureId: 'right-thyroid',
      label: 'Right Thyroid Lobe',
      description: 'Normal adult lobe ~4–6 cm craniocaudal, 1.3–1.8 cm AP/TR; homogeneous echogenic parenchyma.',
    });

    const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 20), thyroidMat);
    leftLobe.scale.set(0.74, 1.82, 0.72);
    leftLobe.position.set(0.68, 0, 0.15);
    tagAnatomyMesh(leftLobe, {
      structureId: 'left-thyroid',
      label: 'Left Thyroid Lobe',
      description: 'Posteromedial border abuts the trachea, esophagus, and left tracheoesophageal groove (RLN).',
    });

    const isthmus = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.32), thyroidMat);
    isthmus.position.set(0, -0.05, 0.42);
    tagAnatomyMesh(isthmus, {
      structureId: 'isthmus',
      label: 'Thyroid Isthmus',
      description: 'Crosses anterior to 2nd–4th tracheal rings; normal thickness ≤ 3–4 mm.',
    });

    // Trachea + Cartilage Rings
    const tracheaGroup = new THREE.Group();
    const tracheaCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 3.2, 24),
      createAnatomyMaterial({ color: 0x334155, roughness: 0.65 })
    );
    tracheaGroup.add(tracheaCore);
    const ringMat = createAnatomyMaterial({ color: 0x99d6ea, roughness: 0.35 });
    for (let i = -5; i <= 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 8, 24), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 0.27;
      tracheaGroup.add(ring);
    }
    tagAnatomyMesh(tracheaCore, {
      structureId: 'trachea',
      label: 'Trachea & Cartilage Rings',
      description: 'Central airway landmark casting characteristic posterior ring-down/shadowing artifact on transverse US.',
    });

    // Esophagus (posterior-left!)
    const esophagus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 3.1, 18),
      createAnatomyMaterial({ color: 0xa75a62, roughness: 0.6 })
    );
    esophagus.scale.set(1.2, 1, 0.65);
    esophagus.position.set(0.28, 0, -0.62);
    tagAnatomyMesh(esophagus, {
      structureId: 'esophagus',
      label: 'Cervical Esophagus',
      description: 'Slightly left-posterior to trachea; target-like peristalsing structure ("bowel signature") not to be confused with a parathyroid adenoma.',
    });

    // Recurrent Laryngeal Nerves + Parathyroids (Danger Zone)
    const rlnGroup = new THREE.Group();
    r.rlnGroup = rlnGroup;
    const nerveMat = createAnatomyMaterial({ color: 0xfacc15, roughness: 0.45 });
    const rlnR = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 2.8, 10), nerveMat);
    rlnR.position.set(-0.42, 0, -0.4);
    const rlnL = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 2.8, 10), nerveMat);
    rlnL.position.set(0.42, 0, -0.4);
    tagAnatomyMesh(rlnR, {
      structureId: 'rln-right',
      label: 'Recurrent Laryngeal Nerve (TE Groove)',
      description: 'Runs vertically in the tracheoesophageal groove; check posterior thyroid capsule abutment before biopsy/ablation.',
    });
    tagAnatomyMesh(rlnL, {
      structureId: 'rln-left',
      label: 'Left Recurrent Laryngeal Nerve',
      description: 'Courses in left TE groove; posterior subcapsular TR4/TR5 lesions carry surgical/thermal injury risk.',
    });

    const paraMat = createAnatomyMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const paraPositions: Array<[number, number, number]> = [
      [-0.58, 0.62, -0.32],
      [-0.62, -0.58, -0.28],
      [0.58, 0.62, -0.32],
      [0.62, -0.58, -0.28],
    ];
    paraPositions.forEach((pos, idx) => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), paraMat);
      p.position.set(...pos);
      tagAnatomyMesh(p, {
        structureId: `parathyroid-${idx}`,
        label: 'Parathyroid Gland',
        description: 'Normally 3–5 mm and isoechoic to thyroid; enlarges into hypoechoic oval adenoma with polar feeding artery.',
      });
      rlnGroup.add(p);
    });
    rlnGroup.add(rlnR, rlnL);

    // Great Vessels (CCA + IJV)
    const vesselsGroup = new THREE.Group();
    r.vesselsGroup = vesselsGroup;
    const ccaMat = createAnatomyMaterial({ color: 0xdc2626, roughness: 0.4, transparent: true, opacity: 0.68 });
    const ijvMat = createAnatomyMaterial({ color: 0x2563eb, roughness: 0.45, transparent: true, opacity: 0.42 });
    [-1, 1].forEach((dir) => {
      const cca = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.1, 16), ccaMat);
      cca.position.set(dir * 1.32, 0, -0.05);
      const ijv = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 3.1, 16), ijvMat);
      ijv.position.set(dir * 1.72, 0, 0.12);
      tagAnatomyMesh(cca, {
        structureId: `cca-${dir > 0 ? 'l' : 'r'}`,
        label: 'Common Carotid Artery',
        description: 'Lateral boundary of thyroid bed; key landmark for transverse sweep.',
      });
      tagAnatomyMesh(ijv, {
        structureId: `ijv-${dir > 0 ? 'l' : 'r'}`,
        label: 'Internal Jugular Vein',
        description: 'Lateral to CCA; compresses readily with light transducer pressure.',
      });
      vesselsGroup.add(cca, ijv);
    });

    // Target Thyroid Nodule
    const noduleMat = createAnatomyMaterial({
      color: 0xf87171,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.4,
      roughness: 0.35,
    });
    r.noduleMat = noduleMat;
    const noduleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), noduleMat);
    tagAnatomyMesh(noduleMesh, {
      structureId: 'target-nodule',
      label: 'Index Thyroid Nodule',
      description: 'Color and orientation update live with ACR TI-RADS score, size, and ETE risk.',
    });
    r.noduleMesh = noduleMesh;

    root.add(rightLobe, leftLobe, isthmus, tracheaGroup, esophagus, rlnGroup, vesselsGroup, noduleMesh);
  }, []);

  const updateThyroid3D = useCallback(() => {
    const r = refs.current;
    if (r.vesselsGroup) r.vesselsGroup.visible = showVessels;
    if (r.rlnGroup) r.rlnGroup.visible = showRln;

    if (r.noduleMesh && r.noduleMat) {
      const x = input.lobe === 'Right' ? -0.68 : input.lobe === 'Left' ? 0.68 : 0;
      const y = input.pole === 'Upper' ? 0.68 : input.pole === 'Lower' ? -0.68 : 0;
      const z = input.lobe === 'Isthmus' ? 0.44 : input.margin === 'ete' ? -0.22 : 0.14;
      r.noduleMesh.position.set(x, y, z);

      const scaleBase = Math.max(0.55, Math.min(1.65, input.sizeMm / 16));
      const apStretch = input.shape === 'taller' ? 1.32 : 0.85;
      r.noduleMesh.scale.set(scaleBase, scaleBase, scaleBase * apStretch);

      if (result.category === 'TR1' || result.category === 'TR2') {
        r.noduleMat.color.setHex(0x34d399);
        r.noduleMat.emissive.setHex(0x065f46);
      } else if (result.category === 'TR3') {
        r.noduleMat.color.setHex(0x38bdf8);
        r.noduleMat.emissive.setHex(0x0369a1);
      } else if (result.category === 'TR4') {
        r.noduleMat.color.setHex(0xfbbf24);
        r.noduleMat.emissive.setHex(0xb45309);
      } else {
        r.noduleMat.color.setHex(0xf87171);
        r.noduleMat.emissive.setHex(0x991b1b);
      }
    }
  }, [input, result.category, showVessels, showRln]);

  // 2D Linear Ultrasound + Color Doppler Nodule Synthesizer
  useEffect(() => {
    const canvas = usCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const img = ctx.createImageData(W, H);
    const data = img.data;

    const noduleCx = usPlane === 'Transverse' ? 0.12 : 0.0;
    const noduleCy = 0.04;
    const rx = Math.max(0.14, Math.min(0.32, (input.sizeMm / 35) * 0.24));
    const ry = input.shape === 'taller' ? rx * 1.28 : rx * 0.74;

    for (let py = 0; py < H; py++) {
      const ny = (py / H) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const nx = (px / W) * 2 - 1;
        let lum = 48;

        // Strap muscles superficially (ny < -0.52)
        if (ny < -0.52) {
          lum = 44 + Math.sin(ny * 45) * 6;
        } else if (ny < 0.62) {
          // Thyroid lobe parenchyma (homogeneous medium-high echogenicity)
          const lobeDist = usPlane === 'Transverse'
            ? Math.hypot((nx - 0.1) * 1.35, (ny - 0.02) * 1.45)
            : Math.hypot(nx * 0.75, (ny - 0.02) * 1.45);
          if (lobeDist < 0.72) {
            lum = 128;
          } else if (usPlane === 'Transverse' && Math.hypot(nx + 0.65, ny - 0.1) < 0.24) {
            // CCA anechoic circle on lateral edge
            lum = 14;
          } else if (usPlane === 'Transverse' && Math.hypot(nx - 0.78, ny - 0.2) < 0.28) {
            // Trachea acoustic shadow
            lum = ny > 0.12 ? 12 : 160;
          } else {
            lum = 56;
          }

          // Nodule geometry & lobulation
          const ang = Math.atan2(ny - noduleCy, nx - noduleCx);
          const lobule = input.margin === 'lobulated' || input.margin === 'ete'
            ? 1 + 0.11 * Math.sin(ang * 7)
            : 1;
          const nd = Math.hypot((nx - noduleCx) / (rx * lobule), (ny - noduleCy) / (ry * lobule));

          if (nd < 1.0) {
            if (input.composition === 'cystic') {
              lum = 12;
            } else if (input.composition === 'spongiform') {
              const sponge = Math.sin(nx * 55) * Math.sin(ny * 55);
              lum = sponge > 0.15 ? 18 : 138;
            } else {
              // Mixed or solid echogenicity
              if (input.composition === 'mixed' && Math.hypot(nx - noduleCx + rx * 0.25, ny - noduleCy) < rx * 0.45) {
                lum = 16;
              } else if (input.echogenicity === 'anechoic') lum = 14;
              else if (input.echogenicity === 'hyperechoic') lum = 152;
              else if (input.echogenicity === 'hypoechoic') lum = 68;
              else lum = 34; // very hypoechoic (< strap muscle!)
            }

            // Echogenic foci inside nodule
            if (input.foci === 'punctate') {
              const p1 = Math.hypot(nx - (noduleCx - rx * 0.3), ny - (noduleCy - ry * 0.2));
              const p2 = Math.hypot(nx - (noduleCx + rx * 0.25), ny - (noduleCy + ry * 0.15));
              const p3 = Math.hypot(nx - noduleCx, ny - (noduleCy - ry * 0.35));
              if (p1 < 0.018 || p2 < 0.016 || p3 < 0.017) lum = 248;
            } else if (input.foci === 'macro') {
              if (Math.hypot(nx - noduleCx, ny - (noduleCy - ry * 0.15)) < 0.055) lum = 250;
            } else if (input.foci === 'rim' && nd > 0.88 && ny < noduleCy) {
              lum = 246;
            } else if (input.foci === 'comet-tail') {
              if (Math.abs(nx - noduleCx) < 0.018 && ny > noduleCy - 0.04 && ny < noduleCy + 0.12) {
                lum = 244;
              }
            }
          }

          // Posterior acoustic enhancement (cystic) or shadowing (macro/rim calcifications)
          if (Math.abs(nx - noduleCx) < rx * 0.85 && ny > noduleCy + ry * 0.8) {
            if (input.composition === 'cystic') lum = Math.min(220, lum + 52);
            else if (input.foci === 'macro' && Math.abs(nx - noduleCx) < 0.065) lum = 12;
          }
        }

        const speckle = fastPixelNoise(px, py, 21) * 20;
        const g = Math.max(0, Math.min(255, Math.round(lum + speckle)));
        const idx = (py * W + px) * 4;
        data[idx] = g;
        data[idx + 1] = g;
        data[idx + 2] = g;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    // Optional Color Doppler vascularity overlay
    if (colorDoppler && input.composition !== 'cystic') {
      const cxPx = ((noduleCx + 1) / 2) * W;
      const cyPx = ((noduleCy + 1) / 2) * H;
      const rxPx = (rx * W) / 2;
      const ryPx = (ry * H) / 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.82)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cxPx, cyPx, Math.min(rxPx, ryPx) * 0.92, 0.3, 2.2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.beginPath();
      ctx.moveTo(cxPx - rxPx * 0.35, cyPx);
      ctx.lineTo(cxPx + rxPx * 0.25, cyPx - ryPx * 0.25);
      ctx.stroke();
      ctx.restore();
    }

    // Caliper Measurement Crosshairs (+ ... +)
    const cxPx = ((noduleCx + 1) / 2) * W;
    const cyPx = ((noduleCy + 1) / 2) * H;
    const rxPx = (rx * W) / 2;
    const ryPx = (ry * H) / 2;
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cxPx - rxPx, cyPx);
    ctx.lineTo(cxPx + rxPx, cyPx);
    ctx.moveTo(cxPx, cyPx - ryPx);
    ctx.lineTo(cxPx, cyPx + ryPx);
    ctx.stroke();
    ctx.restore();
  }, [input, usPlane, colorDoppler]);

  const applyPreset = (preset: 'tr1' | 'tr2' | 'tr3' | 'tr4' | 'tr5') => {
    if (preset === 'tr1') {
      setInput({ ...input, sizeMm: 22, composition: 'spongiform', echogenicity: 'hyperechoic', shape: 'wider', margin: 'smooth', foci: 'none' });
    } else if (preset === 'tr2') {
      setInput({ ...input, sizeMm: 18, composition: 'mixed', echogenicity: 'hyperechoic', shape: 'wider', margin: 'smooth', foci: 'comet-tail' });
    } else if (preset === 'tr3') {
      setInput({ ...input, sizeMm: 26, composition: 'solid', echogenicity: 'hyperechoic', shape: 'wider', margin: 'smooth', foci: 'none' });
    } else if (preset === 'tr4') {
      setInput({ ...input, sizeMm: 16, composition: 'solid', echogenicity: 'hypoechoic', shape: 'wider', margin: 'smooth', foci: 'macro' });
    } else {
      setInput({ ...input, sizeMm: 14, composition: 'solid', echogenicity: 'very-hypoechoic', shape: 'taller', margin: 'lobulated', foci: 'punctate' });
    }
  };

  return (
    <div className="workstation-body">
      <aside className="control-rail" aria-label="ACR TI-RADS Calculator Controls">
        <div className="rail-header">
          <h1 className="rail-title">Thyroid TI-RADS &amp; Neck US</h1>
          <div className="rail-subtitle">ACR 2017 Point Matrix + 3D RLN Danger Zone</div>
        </div>

        <div className="panel-section">
          <div className="section-label">Quick TI-RADS Presets</div>
          <div className="chip-grid">
            {(['tr1', 'tr2', 'tr3', 'tr4', 'tr5'] as const).map((tr) => (
              <button
                key={tr}
                type="button"
                className={`chip-btn ${result.category.toLowerCase() === tr ? 'active' : ''}`}
                onClick={() => applyPreset(tr)}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>Location &amp; Size</span>
            <span>{(input.sizeMm / 10).toFixed(1)} cm</span>
          </div>
          <div className="chip-grid">
            {(['Right', 'Left', 'Isthmus'] as const).map((l) => (
              <button
                key={l}
                type="button"
                className={`chip-btn ${input.lobe === l ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setInput({ ...input, lobe: l })}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="slider-field">
            <div className="slider-meta">
              <span>Max Nodule Diameter</span>
              <span className="slider-val">{input.sizeMm} mm</span>
            </div>
            <input
              id="tirads-size-slider"
              type="range"
              min={4}
              max={42}
              value={input.sizeMm}
              onChange={(e) => setInput({ ...input, sizeMm: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>ACR 5-Category Matrix</span>
            <span>{result.points} pts</span>
          </div>

          <label className="slider-meta">1. Composition</label>
          <select
            className="select-input"
            value={input.composition}
            onChange={(e) => setInput({ ...input, composition: e.target.value as TiradsInput['composition'] })}
          >
            <option value="cystic">Cystic (0 pts)</option>
            <option value="spongiform">Spongiform (0 pts)</option>
            <option value="mixed">Mixed Cystic &amp; Solid (1 pt)</option>
            <option value="solid">Solid / Almost Solid (2 pts)</option>
          </select>

          <label className="slider-meta">2. Echogenicity</label>
          <select
            className="select-input"
            value={input.echogenicity}
            onChange={(e) => setInput({ ...input, echogenicity: e.target.value as TiradsInput['echogenicity'] })}
          >
            <option value="anechoic">Anechoic (0 pts)</option>
            <option value="hyperechoic">Hyper / Isoechoic (1 pt)</option>
            <option value="hypoechoic">Hypoechoic (2 pts)</option>
            <option value="very-hypoechoic">Very Hypoechoic (3 pts)</option>
          </select>

          <label className="slider-meta">3. Shape</label>
          <div className="chip-grid">
            <button
              type="button"
              className={`chip-btn ${input.shape === 'wider' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setInput({ ...input, shape: 'wider' })}
            >
              Wider-than-tall (0)
            </button>
            <button
              type="button"
              className={`chip-btn danger ${input.shape === 'taller' ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setInput({ ...input, shape: 'taller' })}
            >
              Taller-than-wide (3)
            </button>
          </div>

          <label className="slider-meta">4. Margin</label>
          <select
            className="select-input"
            value={input.margin}
            onChange={(e) => setInput({ ...input, margin: e.target.value as TiradsInput['margin'] })}
          >
            <option value="smooth">Smooth (0 pts)</option>
            <option value="ill-defined">Ill-defined (0 pts)</option>
            <option value="lobulated">Lobulated / Irregular (2 pts)</option>
            <option value="ete">Extrathyroidal Extension (3 pts)</option>
          </select>

          <label className="slider-meta">5. Echogenic Foci</label>
          <select
            className="select-input"
            value={input.foci}
            onChange={(e) => setInput({ ...input, foci: e.target.value as TiradsInput['foci'] })}
          >
            <option value="none">None (0 pts)</option>
            <option value="comet-tail">Large Comet-Tail (0 pts)</option>
            <option value="macro">Macrocalcifications (1 pt)</option>
            <option value="rim">Peripheral / Rim Calc (2 pts)</option>
            <option value="punctate">Punctate Echogenic Foci (3 pts)</option>
          </select>
        </div>

        <div className="panel-section">
          <div className="section-label">3D Surgical Landmarks</div>
          <label className="toggle-row">
            <span>RLN &amp; Parathyroids (TE Groove)</span>
            <input type="checkbox" checked={showRln} onChange={(e) => setShowRln(e.target.checked)} />
          </label>
          <label className="toggle-row">
            <span>Carotid Sheath (CCA / IJV)</span>
            <input type="checkbox" checked={showVessels} onChange={(e) => setShowVessels(e.target.checked)} />
          </label>
        </div>
      </aside>

      <main className="stage-area">
        <ThreeViewport
          title="Surgical Neck & Thyroid 3D"
          badge="3D WEBGL"
          cameraPresets={CAMERA_PRESETS}
          initialCamera={[0, 0.3, 5.2]}
          onBuildScene={(ctx) => {
            buildThyroid3D(ctx);
            updateThyroid3D();
          }}
          onUpdateScene={updateThyroid3D}
          deps={[updateThyroid3D]}
          onCanvasExpose={(canvas) => {
            threeCanvasRef.current = canvas;
          }}
        />

        <section className="viewport-card" aria-label="Thyroid Linear Ultrasound View">
          <div className="viewport-header">
            <div className="vp-title-group">
              <span className="vp-badge">{result.category}</span>
              <span className="vp-title">
                {usPlane} 15 MHz US • {result.action}
              </span>
            </div>
            <div className="vp-toolbar">
              {(['Transverse', 'Longitudinal'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`vp-mini-btn ${usPlane === p ? 'active' : ''}`}
                  onClick={() => setUsPlane(p)}
                >
                  {p.slice(0, 5)}
                </button>
              ))}
              <button
                type="button"
                className={`vp-mini-btn ${colorDoppler ? 'active' : ''}`}
                onClick={() => setColorDoppler((c) => !c)}
              >
                Color
              </button>
            </div>
          </div>

          <div className="pacs-stage">
            <div className="pacs-canvas-wrap">
              <canvas ref={usCanvasRef} width={380} height={380} className="pacs-canvas" />
              <div className="pacs-overlay-tl">
                <div>LINEAR L15-4 • THYROID</div>
                <div>{input.lobe.toUpperCase()} {usPlane.toUpperCase()}</div>
              </div>
              <div className="pacs-overlay-tr">
                <div>ACR {result.category} ({result.points} PTS)</div>
                <div>D: {(input.sizeMm / 10).toFixed(1)} cm</div>
              </div>
              <div className="pacs-overlay-bl">
                <div>{result.riskLabel}</div>
              </div>
              <div className="pacs-overlay-br">
                <div>{result.action}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

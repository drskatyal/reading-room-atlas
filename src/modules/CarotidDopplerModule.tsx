import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, type CameraPreset, type ThreeSceneContext } from '../components/ThreeViewport';
import {
  buildCarotidReport,
  computeSpencerHemodynamics,
  type CarotidInput,
} from '../core/clinicalCalculators';
import { fastPixelNoise } from '../core/dicomCanvas';
import { createAnatomyMaterial, tagAnatomyMesh } from '../core/threeUtils';
import type { StructuredReport } from '../types/radiology';

interface CarotidDopplerModuleProps {
  presetTrigger?: string;
  onReportChange: (report: StructuredReport) => void;
  onExposeCanvases: (get3d: () => HTMLCanvasElement | null, get2d: () => HTMLCanvasElement | null) => void;
}

type VesselSample = 'ICA' | 'ECA' | 'Vertebral';

const CAMERA_PRESETS: CameraPreset[] = [
  { label: 'AP', position: [0.3, 0.3, 5.1], target: [0, 0.2, 0] },
  { label: 'Lat', position: [4.8, 0.4, 1.2], target: [0, 0.2, 0] },
  { label: 'Bulb', position: [0.6, 0.5, 3.1], target: [0.15, 0.3, 0] },
];

export function CarotidDopplerModule({
  presetTrigger,
  onReportChange,
  onExposeCanvases,
}: CarotidDopplerModuleProps) {
  const [side, setSide] = useState<'Right' | 'Left'>('Left');
  const [stenosisPct, setStenosisPct] = useState<number>(76);
  const [ccaPsv, setCcaPsv] = useState<number>(82);
  const [plaqueType, setPlaqueType] = useState<CarotidInput['plaqueType']>('Calcified');
  const [vertebralFlow, setVertebralFlow] = useState<CarotidInput['vertebralFlow']>('Antegrade');
  const [sampleVessel, setSampleVessel] = useState<VesselSample>('ICA');
  const [dopplerAngle, setDopplerAngle] = useState<number>(58);
  const [temporalTap, setTemporalTap] = useState<boolean>(false);

  const usCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!presetTrigger) return;
    if (presetTrigger === 'steal') {
      setVertebralFlow('Reversed (Subclavian Steal)');
      setSampleVessel('Vertebral');
    } else if (!Number.isNaN(Number(presetTrigger))) {
      setStenosisPct(Number(presetTrigger));
      setSampleVessel('ICA');
    }
  }, [presetTrigger]);

  useEffect(() => {
    onExposeCanvases(
      () => threeCanvasRef.current,
      () => usCanvasRef.current
    );
  }, [onExposeCanvases]);

  const hemo = useMemo(
    () => computeSpencerHemodynamics(stenosisPct, ccaPsv),
    [stenosisPct, ccaPsv]
  );

  // Angle error demonstration (> 60 deg overestimates Doppler shift error)
  const angleOverestimationFactor = useMemo(() => {
    if (dopplerAngle <= 60) return 1;
    return 1 + (dopplerAngle - 60) * 0.028;
  }, [dopplerAngle]);

  const displayedPsv = Math.round(hemo.psv * angleOverestimationFactor);

  const report = useMemo(
    () =>
      buildCarotidReport(
        {
          side,
          stenosisPct,
          ccaPsv,
          plaqueType,
          vertebralFlow,
        },
        hemo
      ),
    [side, stenosisPct, ccaPsv, plaqueType, vertebralFlow, hemo]
  );

  useEffect(() => {
    onReportChange(report);
  }, [report, onReportChange]);

  // 3D Scene Refs
  const refs = useRef<{
    rootGroup?: THREE.Group;
    plaqueMesh?: THREE.Mesh;
    plaqueMat?: THREE.MeshStandardMaterial;
    jetMesh?: THREE.Mesh;
    jetMat?: THREE.MeshStandardMaterial;
    gateRing?: THREE.Mesh;
  }>({});

  const buildCarotid3D = useCallback((ctx: ThreeSceneContext) => {
    const r = refs.current;
    const rootGroup = new THREE.Group();
    r.rootGroup = rootGroup;
    ctx.root.add(rootGroup);

    const arteryMat = createAnatomyMaterial({
      color: 0xd94b54,
      roughness: 0.42,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const veinMat = createAnatomyMaterial({
      color: 0x3b82f6,
      roughness: 0.45,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const nerveMat = createAnatomyMaterial({ color: 0xfacc15, roughness: 0.55 });

    // CCA
    const ccaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.9, 0),
      new THREE.Vector3(0.05, -0.8, 0),
      new THREE.Vector3(0.08, -0.05, 0),
    ]);
    const cca = new THREE.Mesh(new THREE.TubeGeometry(ccaCurve, 22, 0.24, 18, false), arteryMat);
    tagAnatomyMesh(cca, {
      structureId: 'cca',
      label: 'Common Carotid Artery (CCA)',
      description: 'Bifurcates typically at C3–C4. Normal PSV ~60–100 cm/s; forms denominator of ICA/CCA PSV ratio.',
    });

    // Carotid Bulb + ICA (posterolateral, larger caliber, no neck branches)
    const icaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, -0.05, 0),
      new THREE.Vector3(0.32, 0.45, -0.14),
      new THREE.Vector3(0.38, 1.25, -0.18),
      new THREE.Vector3(0.34, 2.05, -0.16),
    ]);
    const ica = new THREE.Mesh(new THREE.TubeGeometry(icaCurve, 26, 0.22, 18, false), arteryMat);
    tagAnatomyMesh(ica, {
      structureId: 'ica',
      label: 'Internal Carotid Artery (ICA)',
      description: 'Posterolateral branch at the carotid bulb with NO cervical branches; feeds low-resistance cerebral circulation.',
    });

    // ECA (anteromedial, smaller, gives off superior thyroid artery)
    const ecaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, -0.05, 0),
      new THREE.Vector3(-0.22, 0.52, 0.14),
      new THREE.Vector3(-0.34, 1.32, 0.18),
      new THREE.Vector3(-0.38, 2.0, 0.14),
    ]);
    const eca = new THREE.Mesh(new THREE.TubeGeometry(ecaCurve, 24, 0.145, 16, false), arteryMat);
    tagAnatomyMesh(eca, {
      structureId: 'eca',
      label: 'External Carotid Artery (ECA)',
      description: 'Anteromedial branch supplying high-resistance facial/scalp beds; gives off superior thyroid artery first.',
    });

    const supThyroidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.21, 0.48, 0.14),
      new THREE.Vector3(-0.55, 0.35, 0.28),
      new THREE.Vector3(-0.78, -0.12, 0.3),
    ]);
    const supThyroid = new THREE.Mesh(
      new THREE.TubeGeometry(supThyroidCurve, 14, 0.05, 10, false),
      arteryMat
    );
    tagAnatomyMesh(supThyroid, {
      structureId: 'sup-thyroid-a',
      label: 'Superior Thyroid Artery (1st ECA Branch)',
      description: 'Key anatomic landmark confirming the External Carotid Artery (ICA has zero extracranial branches).',
    });

    // Internal Jugular Vein (lateral)
    const ijvCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.88, -1.9, 0.12),
      new THREE.Vector3(0.95, 0.1, 0.06),
      new THREE.Vector3(0.92, 2.0, 0.04),
    ]);
    const ijv = new THREE.Mesh(new THREE.TubeGeometry(ijvCurve, 20, 0.3, 18, false), veinMat);
    tagAnatomyMesh(ijv, {
      structureId: 'ijv',
      label: 'Internal Jugular Vein (IJV)',
      description: 'Lateral to carotid artery inside carotid sheath; thin-walled, compressible, respiratory phasicity.',
    });

    // Vagus Nerve (posterior between CCA & IJV)
    const vagusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.48, -1.9, -0.28),
      new THREE.Vector3(0.52, 0.1, -0.32),
      new THREE.Vector3(0.48, 2.0, -0.28),
    ]);
    const vagus = new THREE.Mesh(new THREE.TubeGeometry(vagusCurve, 18, 0.045, 10, false), nerveMat);
    tagAnatomyMesh(vagus, {
      structureId: 'vagus-nerve',
      label: 'Vagus Nerve (CN X)',
      description: 'Travels posteriorly within the carotid sheath between the internal jugular vein and carotid artery.',
    });

    // Vertebral Artery (deep posterior)
    const vertCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.65, -1.9, -0.82),
      new THREE.Vector3(0.62, 0.1, -0.84),
      new THREE.Vector3(0.58, 1.95, -0.78),
    ]);
    const vert = new THREE.Mesh(new THREE.TubeGeometry(vertCurve, 18, 0.095, 14, false), arteryMat);
    tagAnatomyMesh(vert, {
      structureId: 'vertebral-artery',
      label: 'Vertebral Artery (V2 Segment)',
      description: 'Ascends through C6–C1 transverse foramina; flow reversal indicates proximal subclavian steal.',
    });

    // Dynamic Plaque at Proximal ICA Bulb
    const plaqueMat = createAnatomyMaterial({
      color: 0xf4f1de,
      roughness: 0.72,
    });
    r.plaqueMat = plaqueMat;
    const plaqueMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), plaqueMat);
    plaqueMesh.scale.set(0.9, 1.75, 0.9);
    plaqueMesh.position.set(0.26, 0.38, -0.09);
    tagAnatomyMesh(plaqueMesh, {
      structureId: 'carotid-plaque',
      label: 'Proximal ICA Atherosclerotic Plaque',
      description: 'Bulb/proximal ICA plaque narrows residual lumen; calcified plaque casts posterior acoustic shadowing on US.',
    });
    r.plaqueMesh = plaqueMesh;

    // Dynamic Turbulent Color Flow Jet Core
    const jetMat = createAnatomyMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85,
    });
    r.jetMat = jetMat;
    const jetMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.15, 16), jetMat);
    jetMesh.position.set(0.35, 0.78, -0.15);
    jetMesh.rotation.z = -0.08;
    tagAnatomyMesh(jetMesh, {
      structureId: 'stenotic-jet',
      label: 'Post-Stenotic Doppler Flow Jet',
      description: 'High-velocity flow core exhibiting color aliasing mosaic when jet speed exceeds Nyquist limit.',
    });
    r.jetMesh = jetMesh;

    // Sample Gate Ring
    const gateRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.02, 8, 24),
      createAnatomyMaterial({ color: 0xd4a853, emissive: 0xd4a853, emissiveIntensity: 0.6 })
    );
    gateRing.rotation.x = Math.PI / 2;
    gateRing.position.set(0.34, 0.45, -0.14);
    r.gateRing = gateRing;

    rootGroup.add(cca, ica, eca, supThyroid, ijv, vagus, vert, plaqueMesh, jetMesh, gateRing);
  }, []);

  const updateCarotid3D = useCallback(() => {
    const r = refs.current;
    if (!r.rootGroup) return;
    r.rootGroup.scale.x = side === 'Right' ? -1 : 1;

    if (r.plaqueMesh && r.plaqueMat) {
      r.plaqueMesh.visible = plaqueType !== 'None' && stenosisPct > 5;
      const s = 0.25 + (stenosisPct / 100) * 0.78;
      r.plaqueMesh.scale.set(0.82 * s, 1.7, 0.82 * s);
      if (plaqueType === 'Calcified') {
        r.plaqueMat.color.setHex(0xf1efe7);
        r.plaqueMat.roughness = 0.35;
      } else if (plaqueType === 'Ulcerated') {
        r.plaqueMat.color.setHex(0xd97706);
        r.plaqueMat.roughness = 0.85;
      } else {
        r.plaqueMat.color.setHex(0xeab308);
        r.plaqueMat.roughness = 0.65;
      }
    }

    if (r.jetMesh && r.jetMat) {
      r.jetMesh.visible = stenosisPct < 99;
      const lumenRatio = Math.max(0.14, 1 - stenosisPct / 108);
      r.jetMesh.scale.set(lumenRatio, 1, lumenRatio);
      if (stenosisPct >= 70) {
        r.jetMat.color.setHex(0xf87171);
        r.jetMat.emissive.setHex(0xdc2626);
      } else if (stenosisPct >= 50) {
        r.jetMat.color.setHex(0xfbbf24);
        r.jetMat.emissive.setHex(0xd97706);
      } else {
        r.jetMat.color.setHex(0x38bdf8);
        r.jetMat.emissive.setHex(0x0284c7);
      }
    }

    if (r.gateRing) {
      if (sampleVessel === 'ICA') r.gateRing.position.set(0.33, 0.45, -0.14);
      else if (sampleVessel === 'ECA') r.gateRing.position.set(-0.24, 0.56, 0.14);
      else r.gateRing.position.set(0.61, 0.2, -0.82);
    }
  }, [side, stenosisPct, plaqueType, sampleVessel]);

  // Live 60fps Ultrasound B-Mode + Color Aliasing + Animated PW Spectral Doppler + Spencer Curve
  useEffect(() => {
    const canvas = usCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const startTime = performance.now();

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const tSec = (performance.now() - startTime) / 1000;
      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, W, H);

      // TOP SECTION: B-Mode + Color Doppler Longitudinal View (y: 0..175)
      const usH = 172;
      // Soft tissue speckle background
      for (let y = 18; y < usH; y += 3) {
        for (let x = 10; x < W - 10; x += 3) {
          const n = fastPixelNoise(x, y, 7);
          const lum = Math.max(12, Math.min(72, 34 + n * 24));
          ctx.fillStyle = `rgb(${lum},${lum},${lum + 4})`;
          ctx.fillRect(x, y, 3, 3);
        }
      }

      // Vessel lumen (dark anechoic horizontal channel curving slightly)
      const lumenTop = 64;
      const lumenBot = 122;
      ctx.fillStyle = '#05080f';
      ctx.fillRect(14, lumenTop, W - 28, lumenBot - lumenTop);

      // Echogenic vessel intima-media walls
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(14, lumenTop);
      ctx.lineTo(W - 14, lumenTop);
      ctx.moveTo(14, lumenBot);
      ctx.lineTo(W - 14, lumenBot);
      ctx.stroke();

      // Color Doppler ROI box
      const boxX = 76;
      const boxW = 246;
      ctx.save();
      ctx.strokeStyle = '#e5be70';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(boxX + 18, 46);
      ctx.lineTo(boxX + boxW + 18, 46);
      ctx.lineTo(boxX + boxW - 12, 140);
      ctx.lineTo(boxX - 12, 140);
      ctx.closePath();
      ctx.stroke();

      // Plaque bulge from top wall inside lumen
      const plaquePx = plaqueType === 'None' ? 0 : (stenosisPct / 100) * 48;
      if (plaquePx > 2) {
        const plaqueGrad = ctx.createLinearGradient(155, lumenTop, 155, lumenTop + plaquePx);
        if (plaqueType === 'Calcified') {
          plaqueGrad.addColorStop(0, '#f8fafc');
          plaqueGrad.addColorStop(1, '#cbd5e1');
        } else if (plaqueType === 'Ulcerated') {
          plaqueGrad.addColorStop(0, '#94a3b8');
          plaqueGrad.addColorStop(1, '#475569');
        } else {
          plaqueGrad.addColorStop(0, '#64748b');
          plaqueGrad.addColorStop(1, '#334155');
        }
        ctx.fillStyle = plaqueGrad;
        ctx.beginPath();
        ctx.moveTo(118, lumenTop);
        ctx.quadraticCurveTo(168, lumenTop + plaquePx * 1.45, 224, lumenTop);
        ctx.closePath();
        ctx.fill();

        // Posterior acoustic shadow behind calcified plaque!
        if (plaqueType === 'Calcified') {
          ctx.fillStyle = 'rgba(2, 3, 6, 0.84)';
          ctx.fillRect(136, lumenTop + plaquePx * 0.75, 66, usH - (lumenTop + plaquePx * 0.75));
        }
      }

      // Color flow inside lumen (pulsatile + aliasing mosaic jet at stenosis!)
      const beatPhase = (tSec * 1.18) % 1;
      const systolePulse = Math.exp(-Math.pow((beatPhase - 0.16) / 0.1, 2));
      if (stenosisPct < 99) {
        const residualTop = lumenTop + plaquePx * 0.92;
        const residualH = Math.max(4, lumenBot - residualTop - 2);
        const jetColor =
          stenosisPct >= 70 && systolePulse > 0.35
            ? `rgba(56, 189, 248, ${0.65 + systolePulse * 0.3})` // aliasing cyan-blue mosaic
            : `rgba(220, 38, 38, ${0.58 + systolePulse * 0.32})`;

        ctx.fillStyle = 'rgba(220, 38, 38, 0.72)';
        ctx.fillRect(boxX + 4, lumenTop + 2, 54, lumenBot - lumenTop - 4);
        ctx.fillStyle = jetColor;
        ctx.fillRect(boxX + 58, residualTop + 1, 165, residualH);

        // Aliasing mosaic speckles if high-grade stenosis
        if (stenosisPct >= 60) {
          for (let i = 0; i < 24; i++) {
            const mx = boxX + 95 + ((i * 37 + Math.floor(tSec * 180)) % 120);
            const my = residualTop + 2 + ((i * 19) % Math.max(4, residualH - 3));
            ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#38bdf8';
            ctx.fillRect(mx, my, 4, 2);
          }
        }
      }

      // Doppler sample gate & angle cursor
      const gateX = 195;
      const gateY = Math.min(lumenBot - 8, lumenTop + plaquePx * 0.85 + 10);
      const rad = ((90 - dopplerAngle) * Math.PI) / 180;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gateX - Math.sin(rad) * 26, gateY - Math.cos(rad) * 26);
      ctx.lineTo(gateX + Math.sin(rad) * 26, gateY + Math.cos(rad) * 26);
      ctx.stroke();

      // Angle-correction bar (parallel to flow)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gateX - 11, gateY);
      ctx.lineTo(gateX + 11, gateY);
      ctx.stroke();
      ctx.restore();

      // MIDDLE SECTION: Animated PW Spectral Doppler Trace (y: 178..330)
      const pwTop = 180;
      const pwH = 148;
      const baselineY = pwTop + (vertebralFlow !== 'Antegrade' && sampleVessel === 'Vertebral' ? 88 : 120);

      ctx.fillStyle = '#06090e';
      ctx.fillRect(10, pwTop, W - 20, pwH);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(10, pwTop, W - 20, pwH);

      // Baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(10, baselineY);
      ctx.lineTo(W - 10, baselineY);
      ctx.stroke();

      // Velocity scale ticks
      ctx.fillStyle = '#8b94a5';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('cm/s', 14, pwTop + 14);
      ctx.fillText(`${sampleVessel} PW • θ=${dopplerAngle}°`, W - 145, pwTop + 14);

      const scaleMax = Math.max(250, displayedPsv * 1.18);
      const pxPerVel = (baselineY - (pwTop + 18)) / scaleMax;

      // Draw scrolling cardiac cycles
      ctx.beginPath();
      ctx.strokeStyle = '#e5be70';
      ctx.lineWidth = 2;

      const traceW = W - 28;
      for (let x = 0; x < traceW; x++) {
        const phase = ((x / 92) - tSec * 1.18 + 10) % 1;
        let vel = 0;

        if (sampleVessel === 'ICA') {
          if (stenosisPct < 99) {
            const sys = Math.exp(-Math.pow((phase - 0.16) / 0.075, 2));
            const notch = 0.22 * Math.exp(-Math.pow((phase - 0.34) / 0.06, 2));
            const dias = hemo.edv + (displayedPsv * 0.34 - hemo.edv) * (1 - phase);
            vel = dias + (displayedPsv - dias) * sys + displayedPsv * 0.12 * notch;
          }
        } else if (sampleVessel === 'ECA') {
          // High-resistance triphasic waveform + optional Temporal Tap serrations
          const sys = Math.exp(-Math.pow((phase - 0.14) / 0.055, 2));
          const rev = -0.22 * Math.exp(-Math.pow((phase - 0.28) / 0.045, 2));
          const tap = temporalTap ? Math.sin(phase * Math.PI * 16) * 14 : 0;
          vel = 12 + 105 * sys + 105 * rev + tap;
        } else {
          // Vertebral artery
          if (vertebralFlow === 'Antegrade') {
            const sys = Math.exp(-Math.pow((phase - 0.18) / 0.08, 2));
            vel = 22 + 44 * sys;
          } else if (vertebralFlow === 'Bidirectional (Pre-Steal)') {
            // Classic "bunny rabbit" mid-systolic deceleration notch dipping below baseline
            const p1 = Math.exp(-Math.pow((phase - 0.14) / 0.05, 2));
            const dip = -1.1 * Math.exp(-Math.pow((phase - 0.25) / 0.045, 2));
            const p2 = 0.7 * Math.exp(-Math.pow((phase - 0.38) / 0.06, 2));
            vel = 14 + 52 * p1 + 52 * dip + 42 * p2;
          } else {
            // Reversed flow below baseline
            const sys = Math.exp(-Math.pow((phase - 0.18) / 0.08, 2));
            vel = -(20 + 58 * sys);
          }
        }

        const py = baselineY - vel * pxPerVel;
        if (x === 0) ctx.moveTo(14 + x, py);
        else ctx.lineTo(14 + x, py);

        // Spectral broadening fill below envelope
        if (x % 2 === 0 && Math.abs(vel) > 2) {
          const broaden = stenosisPct >= 50 && sampleVessel === 'ICA' ? 0.65 : 0.25;
          ctx.fillStyle = `rgba(229, 190, 112, ${0.14 + broaden * 0.22})`;
          const fillTop = Math.min(py, baselineY);
          const fillH = Math.abs(baselineY - py) * (0.45 + broaden * 0.52);
          ctx.fillRect(14 + x, fillTop, 2, fillH);
        }
      }
      ctx.stroke();

      // BOTTOM SECTION: Interactive Spencer Curve (y: 338..424)
      const spTop = 338;
      const spH = 82;
      ctx.fillStyle = '#090d14';
      ctx.fillRect(10, spTop, W - 20, spH);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(10, spTop, W - 20, spH);

      ctx.fillStyle = '#a1a7b3';
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      ctx.fillText('SPENCER CURVE: ICA PSV (AMBER) vs VOLUME FLOW (CYAN)', 16, spTop + 13);

      // 50% and 70% SRU vertical reference lines
      const x50 = 18 + (50 / 100) * (W - 36);
      const x70 = 18 + (70 / 100) * (W - 36);
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x50, spTop + 18);
      ctx.lineTo(x50, spTop + spH - 8);
      ctx.moveTo(x70, spTop + 18);
      ctx.lineTo(x70, spTop + spH - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // Plot PSV & Flow across 0..100%
      ctx.beginPath();
      ctx.strokeStyle = '#d4a853';
      ctx.lineWidth = 1.8;
      for (let s = 0; s <= 100; s += 2) {
        const h = computeSpencerHemodynamics(s, ccaPsv);
        const px = 18 + (s / 100) * (W - 36);
        const py = spTop + spH - 10 - (Math.min(480, h.psv) / 480) * (spH - 28);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      for (let s = 0; s <= 100; s += 2) {
        const h = computeSpencerHemodynamics(s, ccaPsv);
        const px = 18 + (s / 100) * (W - 36);
        const py = spTop + spH - 10 - (h.spencerFlowIndex / 100) * (spH - 28);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current Stenosis Marker Dot
      const curX = 18 + (stenosisPct / 100) * (W - 36);
      const curY = spTop + spH - 10 - (Math.min(480, hemo.psv) / 480) * (spH - 28);
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [stenosisPct, ccaPsv, plaqueType, vertebralFlow, sampleVessel, dopplerAngle, temporalTap, displayedPsv, hemo]);

  return (
    <div className="workstation-body">
      <aside className="control-rail" aria-label="Carotid Doppler Controls">
        <div className="rail-header">
          <h1 className="rail-title">Carotid &amp; Vertebral Doppler</h1>
          <div className="rail-subtitle">SRU 2003 Consensus, Spencer Curve &amp; Live PW Spectral</div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>NASCET Stenosis &amp; Plaque</span>
            <span>{side} Side</span>
          </div>
          <div className="chip-grid">
            {(['Right', 'Left'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip-btn ${side === s ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setSide(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="slider-field">
            <div className="slider-meta">
              <span>ICA Diameter Stenosis</span>
              <span className="slider-val">{stenosisPct}%</span>
            </div>
            <input
              id="carotid-stenosis-slider"
              type="range"
              min={0}
              max={100}
              value={stenosisPct}
              onChange={(e) => setStenosisPct(Number(e.target.value))}
            />
          </div>

          <div className="chip-grid">
            {[
              { label: 'Normal (15%)', val: 15 },
              { label: '50–69% (60%)', val: 60 },
              { label: '≥70% (82%)', val: 82 },
              { label: 'String Sign (96%)', val: 96 },
              { label: 'Occluded (100%)', val: 100 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className={`chip-btn ${stenosisPct === p.val ? 'active' : ''}`}
                onClick={() => setStenosisPct(p.val)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="slider-field">
            <div className="slider-meta">
              <span>Plaque Morphology</span>
            </div>
            <div className="chip-grid">
              {(['None', 'Soft/Lipid', 'Calcified', 'Ulcerated'] as const).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  className={`chip-btn ${plaqueType === pt ? 'active' : ''}`}
                  onClick={() => setPlaqueType(pt)}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">PW Doppler Physics &amp; Sample Gate</div>
          <div className="chip-grid">
            {(['ICA', 'ECA', 'Vertebral'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`chip-btn ${sampleVessel === v ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setSampleVessel(v)}
              >
                {v}
              </button>
            ))}
          </div>

          {sampleVessel === 'ECA' && (
            <label className="toggle-row">
              <span>Superficial Temporal Tap Test</span>
              <input
                type="checkbox"
                checked={temporalTap}
                onChange={(e) => setTemporalTap(e.target.checked)}
              />
            </label>
          )}

          <div className="slider-field">
            <div className="slider-meta">
              <span>Doppler Angle (Ideal ≤ 60°)</span>
              <span className="slider-val" style={{ color: dopplerAngle > 60 ? 'var(--accent-crimson)' : undefined }}>
                {dopplerAngle}° {dopplerAngle > 60 ? '(Error!)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={35}
              max={75}
              value={dopplerAngle}
              onChange={(e) => setDopplerAngle(Number(e.target.value))}
            />
          </div>

          <div className="slider-field">
            <div className="slider-meta">
              <span>CCA Reference PSV</span>
              <span className="slider-val">{ccaPsv} cm/s</span>
            </div>
            <input
              type="range"
              min={45}
              max={130}
              value={ccaPsv}
              onChange={(e) => setCcaPsv(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">Vertebral Subclavian Steal</div>
          <select
            className="select-input"
            value={vertebralFlow}
            onChange={(e) => {
              setVertebralFlow(e.target.value as CarotidInput['vertebralFlow']);
              if (e.target.value !== 'Antegrade') setSampleVessel('Vertebral');
            }}
          >
            <option value="Antegrade">Antegrade (Normal)</option>
            <option value="Bidirectional (Pre-Steal)">Bidirectional (Pre-Steal Bunny Notch)</option>
            <option value="Reversed (Subclavian Steal)">Reversed (Complete Steal)</option>
          </select>
        </div>
      </aside>

      <main className="stage-area">
        <ThreeViewport
          title={`${side} Carotid Bifurcation 3D`}
          badge="3D WEBGL"
          cameraPresets={CAMERA_PRESETS}
          initialCamera={[0.3, 0.3, 5.1]}
          onBuildScene={(ctx) => {
            buildCarotid3D(ctx);
            updateCarotid3D();
          }}
          onUpdateScene={updateCarotid3D}
          deps={[updateCarotid3D]}
          onCanvasExpose={(canvas) => {
            threeCanvasRef.current = canvas;
          }}
        />

        <section className="viewport-card" aria-label="Live Carotid Ultrasound and PW Doppler">
          <div className="viewport-header">
            <div className="vp-title-group">
              <span className="vp-badge">DUPLEX US</span>
              <span className="vp-title">
                {hemo.sruCategory} • PSV {displayedPsv} cm/s
              </span>
            </div>
            <div className="vp-toolbar">
              <span className="vp-mini-btn active">EDV {hemo.edv}</span>
              <span className="vp-mini-btn">Ratio {hemo.ratio}</span>
            </div>
          </div>

          <div className="pacs-stage" style={{ padding: 6 }}>
            <canvas
              ref={usCanvasRef}
              width={430}
              height={430}
              style={{ width: '100%', height: '100%', display: 'block', borderRadius: 6 }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

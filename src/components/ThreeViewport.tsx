import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AnatomyUserData } from '../core/threeUtils';
import { createStudioLights, disposeObject3D } from '../core/threeUtils';

export interface CameraPreset {
  label: string;
  position: [number, number, number];
  target?: [number, number, number];
}

export interface ThreeSceneContext {
  scene: THREE.Scene;
  root: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
}

interface ThreeViewportProps {
  title: string;
  badge: string;
  cameraPresets: CameraPreset[];
  initialCamera?: [number, number, number];
  initialTarget?: [number, number, number];
  autoRotateDefault?: boolean;
  onBuildScene: (ctx: ThreeSceneContext) => (() => void) | void;
  onUpdateScene?: (ctx: ThreeSceneContext) => void;
  deps?: unknown[];
  onCanvasExpose?: (canvas: HTMLCanvasElement | null, controls?: OrbitControls, camera?: THREE.PerspectiveCamera) => void;
}

export function ThreeViewport({
  title,
  badge,
  cameraPresets,
  initialCamera = [0, 1.4, 5.2],
  initialTarget = [0, 0, 0],
  autoRotateDefault = false,
  onBuildScene,
  onUpdateScene,
  deps = [],
  onCanvasExpose,
}: ThreeViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<ThreeSceneContext | null>(null);
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [selectedInfo, setSelectedInfo] = useState<{ label: string; description: string } | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [initMs, setInitMs] = useState<number>(0);
  const [webglError, setWebglError] = useState<string | null>(null);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const startTime = performance.now();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'default',
        preserveDrawingBuffer: true, // Enables clean Reel capture & screenshots
      });
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'WebGL unavailable');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 400, host.clientHeight || 360);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    createStudioLights(scene);

    const camera = new THREE.PerspectiveCamera(
      38,
      (host.clientWidth || 400) / Math.max(1, host.clientHeight || 360),
      0.1,
      100
    );
    camera.position.set(...initialCamera);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(...initialTarget);
    controls.minDistance = 1.8;
    controls.maxDistance = 14;
    controls.update();

    const root = new THREE.Group();
    scene.add(root);

    const ctx: ThreeSceneContext = { scene, root, camera, controls };
    ctxRef.current = ctx;

    const cleanupBuild = onBuildScene(ctx);
    onCanvasExpose?.(renderer.domElement, controls, camera);

    const elapsed = Math.max(1, Math.round(performance.now() - startTime));
    setInitMs(elapsed);

    // Raycasting for anatomical structure hover & click selection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let lastHighlighted: THREE.Mesh | null = null;
    let downPos = { x: 0, y: 0 };

    const clearHighlight = () => {
      if (lastHighlighted && lastHighlighted.material instanceof THREE.MeshStandardMaterial) {
        const ud = lastHighlighted.userData as Partial<AnatomyUserData>;
        lastHighlighted.material.emissive.setHex(ud.baseEmissive ?? 0x000000);
        lastHighlighted.material.emissiveIntensity = ud.baseEmissive ? 0.35 : 0;
      }
      lastHighlighted = null;
    };

    const pickMesh = (clientX: number, clientY: number): THREE.Mesh | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(root.children, true);
      for (const hit of hits) {
        if (hit.object instanceof THREE.Mesh && hit.object.visible && hit.object.userData?.label) {
          return hit.object;
        }
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hit = pickMesh(e.clientX, e.clientY);
      if (hit !== lastHighlighted) {
        clearHighlight();
        if (hit && hit.material instanceof THREE.MeshStandardMaterial) {
          hit.material.emissive.setHex(0xd4a853);
          hit.material.emissiveIntensity = 0.28;
          lastHighlighted = hit;
        }
      }
      setHoveredName(hit ? (hit.userData.label as string) : null);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };

    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist > 6) return; // Was an orbit drag, not a click
      const hit = pickMesh(e.clientX, e.clientY);
      if (hit) {
        setSelectedInfo({
          label: hit.userData.label as string,
          description: (hit.userData.description as string) || 'Anatomical structure selected.',
        });
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      if (!host) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(host);

    const tweenRef = {
      active: false,
      destPos: new THREE.Vector3(),
      destTarget: new THREE.Vector3(),
    };

    const startTween = (pos: [number, number, number], tgt: [number, number, number]) => {
      tweenRef.destPos.set(...pos);
      tweenRef.destTarget.set(...tgt);
      tweenRef.active = true;
    };

    (ctx as ThreeSceneContext & { startTween?: typeof startTween }).startTween = startTween;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (tweenRef.active) {
        camera.position.lerp(tweenRef.destPos, 0.14);
        controls.target.lerp(tweenRef.destTarget, 0.14);
        if (
          camera.position.distanceTo(tweenRef.destPos) < 0.03 &&
          controls.target.distanceTo(tweenRef.destTarget) < 0.02
        ) {
          camera.position.copy(tweenRef.destPos);
          controls.target.copy(tweenRef.destTarget);
          tweenRef.active = false;
        }
      }
      controls.autoRotate = autoRotateRef.current;
      controls.autoRotateSpeed = 1.4;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      if (cleanupBuild) cleanupBuild();
      disposeObject3D(root);
      controls.dispose();
      renderer.dispose();
      onCanvasExpose?.(null);
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ctxRef.current && onUpdateScene) {
      onUpdateScene(ctxRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const applyCameraPreset = (preset: CameraPreset) => {
    const ctx = ctxRef.current as (ThreeSceneContext & {
      startTween?: (pos: [number, number, number], tgt: [number, number, number]) => void;
    }) | null;
    if (!ctx) return;
    const target = preset.target ?? initialTarget;
    if (ctx.startTween) {
      ctx.startTween(preset.position, target);
    } else {
      ctx.camera.position.set(...preset.position);
      ctx.controls.target.set(...target);
      ctx.controls.update();
    }
  };

  return (
    <section className="viewport-card" aria-label={title}>
      <div className="viewport-header">
        <div className="vp-title-group">
          <span className="vp-badge">{badge}</span>
          <span className="vp-title">{title}</span>
        </div>
        <div className="vp-toolbar">
          {cameraPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="vp-mini-btn"
              onClick={() => applyCameraPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className={`vp-mini-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate((v) => !v)}
          >
            Orbit
          </button>
        </div>
      </div>

      <div className="three-stage">
        {webglError ? (
          <div style={{ padding: 24, color: 'var(--accent-crimson)' }}>
            WebGL initialization warning: {webglError}
          </div>
        ) : (
          <div ref={hostRef} className="three-canvas-host" />
        )}

        <div className="three-hud-bottom">
          <div className="structure-pill">
            <div className="structure-pill-name">
              {selectedInfo?.label ?? hoveredName ?? 'Click or hover any 3D structure'}
            </div>
            <div className="structure-pill-desc">
              {selectedInfo?.description ??
                'Drag to orbit • Scroll to zoom • Right-drag to pan • Zero shader stall'}
            </div>
          </div>
          <div className="fps-chip" title="WebGL shader & geometry ready time">
            {initMs > 0 ? `Ready ${initMs} ms` : 'WebGL Ready'}
          </div>
        </div>
      </div>
    </section>
  );
}

import * as THREE from 'three';
import type { ThemeMode } from '../types/atlas';

export const BONE_NAMES = new Set(['Femur', 'Tibia', 'Fibula']);
export const EXTENSOR_NAMES = new Set([
  'Patella',
  'PatellarCartilage',
  'PatellarTendon',
  'QuadricepsTendon',
]);
export const CARTILAGE_NAMES = new Set([
  'FemoralCartilage',
  'MedialTibialCartilage',
  'LateralTibialCartilage',
  'PatellarCartilage',
]);
export const MENISCUS_NAMES = new Set([
  'MedialMeniscus',
  'LateralMeniscus',
  'MedialMeniscusTruncated',
  'BucketHandleFragment',
]);
export const CRUCIATE_NAMES = new Set(['ACL', 'PCL']);
export const COLLATERAL_NAMES = new Set(['MCL', 'LCL']);

export interface AnatomyTextureBank {
  boneAlbedo: THREE.CanvasTexture;
  boneNormal: THREE.CanvasTexture;
  boneRoughness: THREE.CanvasTexture;
  collagenAlbedo: THREE.CanvasTexture;
  collagenNormal: THREE.CanvasTexture;
  fibrocartilageNormal: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates deterministic 512x512 studio radial vignette backdrop for WebGLRenderer(alpha: false)
 * so GTAOPass + OutputPass never composite onto a flat murky gray clear buffer.
 */
export function createStudioVignetteTexture(theme: ThemeMode): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.44,
      size * 0.04,
      size * 0.5,
      size * 0.5,
      size * 0.68
    );
    if (theme === 'monograph') {
      grad.addColorStop(0, '#ebe4d6');
      grad.addColorStop(0.58, '#ddd4c2');
      grad.addColorStop(1, '#c9beaa');
    } else {
      grad.addColorStop(0, '#141b29');
      grad.addColorStop(0.52, '#0a0e16');
      grad.addColorStop(1, '#04060a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeTileableCanvasTexture(
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = colorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Converts a 2D heightfield array [0..1] into a seamless tangent-space normal map.
 */
function heightToNormalTexture(height: Float32Array, size: number, strength: number): THREE.CanvasTexture {
  return makeTileableCanvasTexture(size, (ctx) => {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xm = (x - 1 + size) % size;
        const xp = (x + 1) % size;
        const dx = (height[y * size + xp] - height[y * size + xm]) * strength;
        const dy = (height[yp * size + x] - height[ym * size + x]) * strength;
        let nx = -dx;
        let ny = -dy;
        const nz = 1.0;
        const inv = 1.0 / Math.hypot(nx, ny, nz);
        nx *= inv;
        ny *= inv;
        const nzz = nz * inv;
        const idx = (y * size + x) * 4;
        data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.round((nzz * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

function hash2d(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoisePeriodic(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const x0 = ((xi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y0 = ((yi % period) + period) % period;
  const y1 = (y0 + 1) % period;

  const n00 = hash2d(x0, y0, seed);
  const n10 = hash2d(x1, y0, seed);
  const n01 = hash2d(x0, y1, seed);
  const n11 = hash2d(x1, y1, seed);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

/**
 * Creates tileable procedural biological micro-textures (cortical bone osteon grain & pores,
 * longitudinal collagen fascicles for cruciate/collateral ligaments & tendons, meniscal
 * circumferential matrix).
 */
export function createAnatomyTextureBank(): AnatomyTextureBank {
  const size = 256;

  // 1. Cortical bone Haversian grain + subtle organic micropore heightfield
  const boneHeight = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 24;
      const v = (y / size) * 8; // stretched vertically along diaphyseal shaft (V)
      const f1 = valueNoisePeriodic(u, v, 24, 1.0);
      const f2 = valueNoisePeriodic(u * 2, v * 2, 48, 2.3) * 0.5;
      const pore = valueNoisePeriodic(u * 4, v * 8, 96, 5.7);
      const pit = pore < 0.22 ? -0.35 * (0.22 - pore) * 4.0 : 0.0;
      boneHeight[y * size + x] = f1 * 0.55 + f2 * 0.35 + pit;
    }
  }
  const boneNormal = heightToNormalTexture(boneHeight, size, 1.6);
  boneNormal.repeat.set(3.8, 3.8);

  const boneAlbedo = makeTileableCanvasTexture(
    size,
    (ctx) => {
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        // Subtle fine cortical ivory variation without blotchy noise
        const t = Math.max(0, Math.min(1, (boneHeight[i] - 0.15) / 0.72));
        const p = i * 4;
        img.data[p] = Math.round(222 + t * (246 - 222));
        img.data[p + 1] = Math.round(213 + t * (240 - 213));
        img.data[p + 2] = Math.round(198 + t * (229 - 198));
        img.data[p + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    THREE.SRGBColorSpace
  );
  boneAlbedo.repeat.set(3.8, 3.8);

  const boneRoughness = makeTileableCanvasTexture(size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      // Matte-satin periosteal finish: smoother crests (~0.60), rougher pores/grooves (~0.84)
      const v = Math.round(182 - (boneHeight[i] - 0.45) * 48);
      const clamped = Math.max(152, Math.min(214, v));
      const p = i * 4;
      img.data[p] = clamped;
      img.data[p + 1] = clamped;
      img.data[p + 2] = clamped;
      img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  boneRoughness.repeat.set(3.8, 3.8);

  // 2. Collagen fascicle heightfield + subtly striated albedo (bundles run along V)
  const colHeight = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Gentle helical crimp wave along longitudinal collagen fibers
      const crimp = Math.sin(v * Math.PI * 10.0) * 0.015;
      const uWarped = u + crimp;
      const band1 = Math.sin(uWarped * Math.PI * 36.0) * 0.5 + 0.5;
      const band2 = valueNoisePeriodic(uWarped * 32, v * 4, 32, 9.1);
      const fine = valueNoisePeriodic(uWarped * 64, v * 8, 64, 13.4);
      colHeight[y * size + x] = band1 * 0.55 + band2 * 0.3 + fine * 0.15;
    }
  }
  const collagenNormal = heightToNormalTexture(colHeight, size, 3.2);

  const collagenAlbedo = makeTileableCanvasTexture(
    size,
    (ctx) => {
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        const t = Math.max(0, Math.min(1, colHeight[i]));
        // Subtle silk-ivory fascicle shading without clipping white under ACES Filmic
        const r = Math.round(204 + t * 41);
        const g = Math.round(196 + t * 40);
        const b = Math.round(182 + t * 38);
        const p = i * 4;
        img.data[p] = r;
        img.data[p + 1] = g;
        img.data[p + 2] = b;
        img.data[p + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    THREE.SRGBColorSpace
  );

  // 3. Meniscal fibrocartilage hoop matrix heightfield
  const fibroHeight = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const hoop = Math.sin(v * Math.PI * 24.0 + Math.sin(u * Math.PI * 6.0) * 0.6) * 0.5 + 0.5;
      const micro = valueNoisePeriodic(u * 24, v * 24, 24, 21.0);
      fibroHeight[y * size + x] = hoop * 0.45 + micro * 0.55;
    }
  }
  const fibrocartilageNormal = heightToNormalTexture(fibroHeight, size, 1.5);

  return {
    boneAlbedo,
    boneNormal,
    boneRoughness,
    collagenAlbedo,
    collagenNormal,
    fibrocartilageNormal,
    dispose: () => {
      boneAlbedo.dispose();
      boneNormal.dispose();
      boneRoughness.dispose();
      collagenAlbedo.dispose();
      collagenNormal.dispose();
      fibrocartilageNormal.dispose();
    },
  };
}

function smoothstep01(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Welds UV-seam duplicate vertices in 3D space, writes seamless area-weighted normals,
 * and computes multi-pass geometric concavity + anatomical fossa/notch occlusion as warm
 * osteological vertex colors so condyles, sulci, and the notch separate clearly in 3D.
 */
export function applyBoneOsteologyShading(
  geometry: THREE.BufferGeometry,
  meshName: string
): void {
  const posAttr = geometry.getAttribute('position');
  if (!posAttr || posAttr.count === 0) return;

  const vertCount = posAttr.count;
  const vToWeld = new Int32Array(vertCount);
  const weldMap = new Map<string, number>();
  const weldPositions: number[] = [];

  for (let i = 0; i < vertCount; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    let w = weldMap.get(key);
    if (w === undefined) {
      w = weldPositions.length / 3;
      weldMap.set(key, w);
      weldPositions.push(x, y, z);
    }
    vToWeld[i] = w;
  }

  const weldCount = weldPositions.length / 3;
  const wNorm = new Float32Array(weldCount * 3);
  const neighbors: Array<Set<number>> = Array.from({ length: weldCount }, () => new Set<number>());

  const index = geometry.getIndex();
  const triCount = index ? Math.floor(index.count / 3) : Math.floor(vertCount / 3);

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    const wa = vToWeld[i0];
    const wb = vToWeld[i1];
    const wc = vToWeld[i2];
    if (wa === wb || wb === wc || wa === wc) continue;

    neighbors[wa].add(wb);
    neighbors[wa].add(wc);
    neighbors[wb].add(wa);
    neighbors[wb].add(wc);
    neighbors[wc].add(wa);
    neighbors[wc].add(wb);

    const ax = weldPositions[wa * 3];
    const ay = weldPositions[wa * 3 + 1];
    const az = weldPositions[wa * 3 + 2];
    const abx = weldPositions[wb * 3] - ax;
    const aby = weldPositions[wb * 3 + 1] - ay;
    const abz = weldPositions[wb * 3 + 2] - az;
    const acx = weldPositions[wc * 3] - ax;
    const acy = weldPositions[wc * 3 + 1] - ay;
    const acz = weldPositions[wc * 3 + 2] - az;

    // Cross product magnitude is 2x triangle area -> area-weighted normal sum
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    wNorm[wa * 3] += nx;
    wNorm[wa * 3 + 1] += ny;
    wNorm[wa * 3 + 2] += nz;
    wNorm[wb * 3] += nx;
    wNorm[wb * 3 + 1] += ny;
    wNorm[wb * 3 + 2] += nz;
    wNorm[wc * 3] += nx;
    wNorm[wc * 3 + 1] += ny;
    wNorm[wc * 3 + 2] += nz;
  }

  for (let w = 0; w < weldCount; w++) {
    const nx = wNorm[w * 3];
    const ny = wNorm[w * 3 + 1];
    const nz = wNorm[w * 3 + 2];
    const len = Math.hypot(nx, ny, nz);
    if (len > 1e-10) {
      const inv = 1 / len;
      wNorm[w * 3] = nx * inv;
      wNorm[w * 3 + 1] = ny * inv;
      wNorm[w * 3 + 2] = nz * inv;
    } else {
      wNorm[w * 3] = 0;
      wNorm[w * 3 + 1] = 1;
      wNorm[w * 3 + 2] = 0;
    }
  }

  // Write seamless welded normals back to every split vertex
  const normalArr = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    const w = vToWeld[i];
    normalArr[i * 3] = wNorm[w * 3];
    normalArr[i * 3 + 1] = wNorm[w * 3 + 1];
    normalArr[i * 3 + 2] = wNorm[w * 3 + 2];
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normalArr, 3));

  let totalEdgeLen = 0;
  let edgeCount = 0;
  for (let w = 0; w < weldCount; w++) {
    const px = weldPositions[w * 3];
    const py = weldPositions[w * 3 + 1];
    const pz = weldPositions[w * 3 + 2];
    for (const n of neighbors[w]) {
      if (w < n) {
        totalEdgeLen += Math.hypot(
          weldPositions[n * 3] - px,
          weldPositions[n * 3 + 1] - py,
          weldPositions[n * 3 + 2] - pz
        );
        edgeCount++;
      }
    }
  }
  const avgEdgeLen = Math.max(edgeCount > 0 ? totalEdgeLen / edgeCount : 0.05, 1e-5);

  const rawConcavity = new Float32Array(weldCount);
  for (let w = 0; w < weldCount; w++) {
    const nbrs = neighbors[w];
    if (nbrs.size === 0) continue;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const n of nbrs) {
      sx += weldPositions[n * 3];
      sy += weldPositions[n * 3 + 1];
      sz += weldPositions[n * 3 + 2];
    }
    const invN = 1 / nbrs.size;
    const dx = sx * invN - weldPositions[w * 3];
    const dy = sy * invN - weldPositions[w * 3 + 1];
    const dz = sz * invN - weldPositions[w * 3 + 2];
    const dot = dx * wNorm[w * 3] + dy * wNorm[w * 3 + 1] + dz * wNorm[w * 3 + 2];
    rawConcavity[w] = Math.max(-1.5, Math.min(1.5, dot / avgEdgeLen));
  }

  let broadConcavity = new Float32Array(rawConcavity);
  let nextPass = new Float32Array(weldCount);
  for (let pass = 0; pass < 6; pass++) {
    for (let w = 0; w < weldCount; w++) {
      const nbrs = neighbors[w];
      if (nbrs.size === 0) {
        nextPass[w] = broadConcavity[w];
        continue;
      }
      let sum = 0;
      for (const n of nbrs) sum += broadConcavity[n];
      nextPass[w] = 0.5 * broadConcavity[w] + 0.5 * (sum / nbrs.size);
    }
    const tmp = broadConcavity;
    broadConcavity = nextPass;
    nextPass = tmp;
  }

  const wColors = new Float32Array(weldCount * 3);
  for (let w = 0; w < weldCount; w++) {
    const curv = 0.35 * rawConcavity[w] + 0.65 * broadConcavity[w];
    const concavityOcc = Math.max(-0.06, Math.min(0.36, curv * 4.4));

    const px = weldPositions[w * 3];
    const py = weldPositions[w * 3 + 1];
    const pz = weldPositions[w * 3 + 2];
    const wny = wNorm[w * 3 + 1];

    let regionOcc = 0;
    if (meshName === 'Femur') {
      if (Math.abs(px) < 0.62 && py > -0.25 && py < 0.8 && pz > -0.65 && pz < 0.55) {
        const fx = Math.pow(Math.max(0, 1 - (px / 0.62) ** 2), 1.5);
        const fy = Math.pow(Math.max(0, 1 - ((py - 0.275) / 0.525) ** 2), 1.5);
        const fz = Math.pow(Math.max(0, 1 - ((pz + 0.05) / 0.6) ** 2), 1.5);
        regionOcc += fx * fy * fz * 0.24;
      }
      if (py > 2.15) {
        regionOcc += smoothstep01(2.15, 2.7, py) * 0.15;
      }
      if (wny > 0.55 && py > 2.4) {
        regionOcc += smoothstep01(0.55, 0.9, wny) * smoothstep01(2.4, 2.65, py) * 0.18;
      }
    } else if (meshName === 'Tibia') {
      if (Math.abs(px) < 0.58 && py > -0.38) {
        const fx = Math.pow(Math.max(0, 1 - (px / 0.58) ** 2), 1.5);
        const fy = smoothstep01(-0.38, -0.02, py);
        regionOcc += fx * fy * 0.15;
      }
      if (py < -1.95) {
        regionOcc += smoothstep01(-1.95, -2.4, py) * 0.16;
      }
      if (wny < -0.55 && py < -2.2) {
        regionOcc += smoothstep01(-0.55, -0.9, wny) * smoothstep01(-2.2, -2.4, py) * 0.14;
      }
    } else if (meshName === 'Fibula') {
      if (py < -2.25) {
        regionOcc += smoothstep01(-2.25, -2.65, py) * 0.14;
      }
    }

    const occ = Math.max(-0.08, Math.min(0.46, concavityOcc + regionOcc));
    let r: number;
    let g: number;
    let b: number;
    if (occ <= 0) {
      const s = -occ / 0.08;
      r = 0.98 + s * (1.0 - 0.98);
      g = 0.95 + s * (0.985 - 0.95);
      b = 0.9 + s * (0.955 - 0.9);
    } else {
      const t = occ / 0.46;
      r = 0.98 - t * (0.98 - 0.54);
      g = 0.95 - t * (0.95 - 0.43);
      b = 0.9 - t * (0.9 - 0.32);
    }

    wColors[w * 3] = r;
    wColors[w * 3 + 1] = g;
    wColors[w * 3 + 2] = b;
  }

  const colors = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    const w = vToWeld[i];
    colors[i * 3] = wColors[w * 3];
    colors[i * 3 + 1] = wColors[w * 3 + 1];
    colors[i * 3 + 2] = wColors[w * 3 + 2];
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export interface AnatomyMaterialConfig {
  baseColorHex: number;
  baseOpacity: number;
  baseEmissiveHex: number;
  baseEmissiveIntensity: number;
}

/**
 * Attaches a safe View-Angle Fresnel Rim shader onto bone materials so toggling X-Ray Bone
 * produces crisp translucent cortical silhouettes without washing out interior ligaments.
 * Uses a uniform `uXrayMode` toggled dynamically without recompiling shaders.
 */
export function attachFresnelXrayShader(
  mat: THREE.MeshPhysicalMaterial,
  uniformsRef: { uXrayMode: { value: number } }
) {
  mat.userData.uXrayMode = uniformsRef.uXrayMode;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uXrayMode = uniformsRef.uXrayMode;
    shader.fragmentShader =
      `uniform float uXrayMode;\n` +
      shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `
        if (uXrayMode > 0.5) {
          vec3 xN = normalize(normal);
          vec3 xV = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(xN, xV)), 2.4);
          diffuseColor.a = clamp(0.02 + 0.26 * fresnel, 0.02, 0.30);
          outgoingLight = mix(outgoingLight * 0.28, vec3(0.50, 0.68, 0.90), fresnel * 0.68);
        }
        #include <opaque_fragment>
        `
      );
  };
  mat.customProgramCacheKey = () => 'bone-fresnel-xray-v2';
}

export function createTissueMaterial(
  name: string,
  clipPlane: THREE.Plane,
  bank: AnatomyTextureBank,
  xrayUniform: { uXrayMode: { value: number } }
): THREE.MeshPhysicalMaterial {
  const common = {
    clippingPlanes: [clipPlane],
    clipShadows: true,
    side: THREE.DoubleSide,
  };

  if (BONE_NAMES.has(name) || name === 'Patella') {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0xc2ab89,
      map: bank.boneAlbedo,
      vertexColors: true,
      roughness: 0.68,
      metalness: 0.0,
      clearcoat: 0.04,
      clearcoatRoughness: 0.66,
      sheen: 0.06,
      sheenColor: new THREE.Color(0xc2ac8c),
      normalMap: bank.boneNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughnessMap: bank.boneRoughness,
      envMapIntensity: 0.2,
    });
    attachFresnelXrayShader(mat, xrayUniform);
    mat.userData.baseColorHex = 0xc2ab89;
    mat.userData.xrayColorHex = 0xc5d3e6;
    mat.userData.boneAlbedoMap = bank.boneAlbedo;
    mat.userData.xrayApplied = false;
    return mat;
  }

  if (CARTILAGE_NAMES.has(name)) {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0xbce0f5,
      roughness: 0.16,
      metalness: 0.0,
      clearcoat: 0.88,
      clearcoatRoughness: 0.1,
      ior: 1.44,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xffffff),
      envMapIntensity: 0.62,
    });
    attachFresnelXrayShader(mat, xrayUniform);
    mat.userData.baseColorHex = 0xbce0f5;
    mat.userData.xrayColorHex = 0xa9cce3;
    return mat;
  }

  if (name === 'BucketHandleFragment') {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0xc2272d,
      roughness: 0.28,
      clearcoat: 0.44,
      clearcoatRoughness: 0.2,
      normalMap: bank.fibrocartilageNormal,
      normalScale: new THREE.Vector2(0.24, 0.24),
    });
    mat.userData.baseColorHex = 0xc2272d;
    return mat;
  }

  if (name === 'MedialMeniscusTruncated') {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0x456e80,
      roughness: 0.32,
      clearcoat: 0.42,
      clearcoatRoughness: 0.22,
      normalMap: bank.fibrocartilageNormal,
      normalScale: new THREE.Vector2(0.24, 0.24),
    });
    mat.userData.baseColorHex = 0x456e80;
    return mat;
  }

  if (MENISCUS_NAMES.has(name)) {
    const hex = name === 'MedialMeniscus' ? 0x3b6e84 : 0x325b6e;
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: hex,
      roughness: 0.3,
      clearcoat: 0.48,
      clearcoatRoughness: 0.18,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xc5dce8),
      normalMap: bank.fibrocartilageNormal,
      normalScale: new THREE.Vector2(0.25, 0.25),
    });
    mat.userData.baseColorHex = hex;
    return mat;
  }

  // Ligaments & Tendons — striated silky collagen fascia
  const collagenTint =
    name === 'ACL'
      ? 0xdcd0ba
      : name === 'PCL'
        ? 0xcfbba0
        : name === 'MCL' || name === 'LCL'
          ? 0xd8d0c2
          : 0xd8d1c4;

  const mat = new THREE.MeshPhysicalMaterial({
    ...common,
    color: collagenTint,
    map: bank.collagenAlbedo,
    normalMap: bank.collagenNormal,
    normalScale: new THREE.Vector2(0.42, 0.42),
    roughness: 0.38,
    metalness: 0.0,
    anisotropy: 0.65,
    anisotropyRotation: Math.PI * 0.5,
    clearcoat: 0.3,
    clearcoatRoughness: 0.28,
    sheen: 0.32,
    sheenColor: new THREE.Color(0xfff5e4),
    envMapIntensity: 0.36,
  });
  mat.userData.baseColorHex = collagenTint;
  return mat;
}

function applyBoneXrayState(mat: THREE.MeshPhysicalMaterial, xray: boolean): boolean {
  const prev = mat.userData.xrayApplied;
  mat.side = xray ? THREE.FrontSide : THREE.DoubleSide;
  mat.transparent = xray;
  mat.opacity = xray ? 0.18 : 1.0;
  mat.depthWrite = !xray;
  mat.clearcoat = xray ? 0 : 0.03;
  mat.vertexColors = !xray;
  mat.map = xray ? null : ((mat.userData.boneAlbedoMap as THREE.Texture | null) ?? null);
  mat.color.setHex(
    xray ? (mat.userData.xrayColorHex as number) : (mat.userData.baseColorHex as number)
  );
  mat.userData.xrayApplied = xray;
  return prev !== xray;
}

function applyExtensorTendonState(mat: THREE.MeshPhysicalMaterial, ghosted: boolean): boolean {
  const prev = mat.userData.ghostApplied;
  mat.transparent = ghosted;
  mat.opacity = ghosted ? 0.14 : 1.0;
  mat.depthWrite = !ghosted;
  mat.side = ghosted ? THREE.FrontSide : THREE.DoubleSide;
  mat.userData.ghostApplied = ghosted;
  return prev !== ghosted;
}

function applyCartilageState(
  mat: THREE.MeshPhysicalMaterial,
  thicknessEnabled: boolean,
  xrayBones: boolean
): boolean {
  const glass = xrayBones && !thicknessEnabled;
  const prevGlass = mat.userData.glassApplied;
  const prevThick = mat.vertexColors;
  if (mat.vertexColors !== thicknessEnabled) {
    mat.vertexColors = thicknessEnabled;
  }
  mat.transparent = glass;
  mat.opacity = glass ? 0.14 : 1.0;
  mat.depthWrite = !glass;
  mat.side = glass ? THREE.FrontSide : THREE.DoubleSide;
  mat.color.setHex(
    thicknessEnabled
      ? 0xffffff
      : glass
        ? ((mat.userData.xrayColorHex as number | undefined) ?? 0xa9cce3)
        : (mat.userData.baseColorHex as number)
  );
  mat.userData.glassApplied = glass;
  return prevGlass !== glass || prevThick !== thicknessEnabled;
}

export interface SpecimenSyncParams {
  meshes: Map<string, THREE.Mesh>;
  materials: Map<string, THREE.MeshPhysicalMaterial>;
  xrayUniform: { uXrayMode: { value: number } };
  visibility: {
    bones: boolean;
    xrayBones: boolean;
    extensor: boolean;
    cartilage: boolean;
    thicknessMap: boolean;
    menisci: boolean;
    cruciates: boolean;
    collaterals: boolean;
    plateauDissection?: boolean;
  };
  enabledStructures?: ReadonlySet<string>;
  chapterId: string;
  activeStructure: string;
  hoveredStructure: string | null;
}

export function syncSpecimenMaterialsAndVisibility(params: SpecimenSyncParams): void {
  const {
    meshes,
    materials,
    xrayUniform,
    visibility,
    enabledStructures,
    chapterId,
    activeStructure,
    hoveredStructure,
  } = params;

  xrayUniform.uXrayMode.value = visibility.xrayBones ? 1.0 : 0.0;

  const isBucket = chapterId === 'bucket-handle';
  const isAclBad = chapterId === 'acl-rupture' || chapterId === 'unhappy-triad';
  const isPclBad = chapterId === 'pcl-dashboard';
  const isMclBad = chapterId === 'unhappy-triad';
  const plateauOnly = Boolean(visibility.plateauDissection);

  for (const [name, mesh] of meshes) {
    const mat = materials.get(name);
    if (!mat) continue;

    const parentId =
      name === 'MedialMeniscusTruncated' || name === 'BucketHandleFragment'
        ? 'MedialMeniscus'
        : name;
    const structEnabled = enabledStructures ? enabledStructures.has(parentId) : true;

    let shaderDirty = false;
    if (BONE_NAMES.has(name) || name === 'Patella') {
      const groupAllowed = name === 'Patella' && !enabledStructures ? visibility.extensor : visibility.bones;
      mesh.visible =
        structEnabled &&
        groupAllowed &&
        !(plateauOnly && (name === 'Femur' || name === 'Patella'));
      shaderDirty = applyBoneXrayState(mat, visibility.xrayBones);
    } else if (CARTILAGE_NAMES.has(name) || name === 'PatellarCartilage') {
      const groupAllowed =
        name === 'PatellarCartilage' && !enabledStructures
          ? visibility.extensor && visibility.cartilage
          : visibility.cartilage;
      mesh.visible =
        structEnabled &&
        groupAllowed &&
        !(plateauOnly && (name === 'FemoralCartilage' || name === 'PatellarCartilage'));
      shaderDirty = applyCartilageState(mat, visibility.thicknessMap, visibility.xrayBones);
    } else if (EXTENSOR_NAMES.has(name)) {
      mesh.visible = structEnabled && (!enabledStructures ? visibility.extensor : true) && !plateauOnly;
      const ghostExtensor =
        visibility.xrayBones &&
        chapterId !== 'patellar-dislocation' &&
        activeStructure !== name;
      shaderDirty = applyExtensorTendonState(mat, ghostExtensor);
    } else if (MENISCUS_NAMES.has(name)) {
      const groupAllowed = !enabledStructures ? visibility.menisci : true;
      if (name === 'MedialMeniscus') {
        mesh.visible = structEnabled && groupAllowed && !isBucket;
      } else if (name === 'MedialMeniscusTruncated' || name === 'BucketHandleFragment') {
        mesh.visible = structEnabled && groupAllowed && isBucket;
      } else {
        mesh.visible = structEnabled && groupAllowed;
      }
    } else if (CRUCIATE_NAMES.has(name)) {
      mesh.visible = structEnabled && (!enabledStructures ? visibility.cruciates : true);
    } else if (COLLATERAL_NAMES.has(name)) {
      mesh.visible = structEnabled && (!enabledStructures ? visibility.collaterals : true);
    }

    const isSelected =
      name === activeStructure ||
      (isBucket && name === 'BucketHandleFragment' && activeStructure === 'MedialMeniscus');
    const isHovered = name === hoveredStructure;
    const isPatho =
      (name === 'BucketHandleFragment' && isBucket) ||
      (name === 'ACL' && isAclBad) ||
      (name === 'PCL' && isPclBad) ||
      (name === 'MCL' && isMclBad);

    const isBone = BONE_NAMES.has(name) || name === 'Patella';
    if (isPatho) {
      mat.emissive.setHex(0x7f1d1d);
      mat.emissiveIntensity = isSelected ? 0.55 : 0.34;
      if (name === 'ACL' && isAclBad && !mat.transparent) {
        mat.transparent = true;
        mat.opacity = 0.68;
        shaderDirty = true;
      }
    } else if (isSelected) {
      mat.emissive.setHex(0x0ea5e9);
      mat.emissiveIntensity = isBone ? 0.06 : 0.34;
      if (name === 'ACL' && mat.transparent) {
        mat.transparent = false;
        mat.opacity = 1.0;
        shaderDirty = true;
      }
    } else if (isHovered) {
      mat.emissive.setHex(0x0284c7);
      mat.emissiveIntensity = isBone ? 0.04 : 0.16;
    } else {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if (name === 'ACL' && mat.transparent) {
        mat.transparent = false;
        mat.opacity = 1.0;
        shaderDirty = true;
      }
    }
    if (shaderDirty) {
      mat.needsUpdate = true;
    }
  }
}

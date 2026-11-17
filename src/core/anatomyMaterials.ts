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
      grad.addColorStop(0, '#fcfaf4');
      grad.addColorStop(0.58, '#f0ebe0');
      grad.addColorStop(1, '#dfd8c9');
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
  const boneNormal = heightToNormalTexture(boneHeight, size, 2.4);

  const boneRoughness = makeTileableCanvasTexture(size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      // Base matte/eggshell periosteal variation 0.48..0.72
      const v = Math.round(135 + (boneHeight[i] - 0.45) * 65);
      const clamped = Math.max(95, Math.min(205, v));
      const p = i * 4;
      img.data[p] = clamped;
      img.data[p + 1] = clamped;
      img.data[p + 2] = clamped;
      img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });

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
        // Subtle silk-cream fascicle shading between #e9dfcf (grooves) and #fffaf1 (bundle crest)
        const r = Math.round(230 + t * 25);
        const g = Math.round(220 + t * 28);
        const b = Math.round(202 + t * 32);
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
    boneNormal,
    boneRoughness,
    collagenAlbedo,
    collagenNormal,
    fibrocartilageNormal,
    dispose: () => {
      boneNormal.dispose();
      boneRoughness.dispose();
      collagenAlbedo.dispose();
      collagenNormal.dispose();
      fibrocartilageNormal.dispose();
    },
  };
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
          float fresnel = pow(1.0 - abs(dot(xN, xV)), 2.25);
          diffuseColor.a = clamp(0.05 + 0.54 * fresnel, 0.05, 0.60);
          outgoingLight = mix(outgoingLight * 0.42, vec3(0.72, 0.82, 0.96), fresnel * 0.76);
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
      color: 0xd0c1a8,
      roughness: 0.7,
      metalness: 0.0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.65,
      sheen: 0.14,
      sheenColor: new THREE.Color(0xcab593),
      normalMap: bank.boneNormal,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: bank.boneRoughness,
      envMapIntensity: 0.42,
    });
    attachFresnelXrayShader(mat, xrayUniform);
    mat.userData.baseColorHex = 0xd0c1a8;
    mat.userData.xrayColorHex = 0xc5d3e6;
    return mat;
  }

  if (CARTILAGE_NAMES.has(name)) {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0xeef3f8,
      roughness: 0.14,
      metalness: 0.0,
      clearcoat: 0.92,
      clearcoatRoughness: 0.08,
      ior: 1.44,
      sheen: 0.24,
      sheenColor: new THREE.Color(0xffffff),
      envMapIntensity: 0.95,
    });
    mat.userData.baseColorHex = 0xeef3f8;
    return mat;
  }

  if (name === 'BucketHandleFragment') {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0xa6262a,
      roughness: 0.28,
      clearcoat: 0.42,
      clearcoatRoughness: 0.2,
      normalMap: bank.fibrocartilageNormal,
      normalScale: new THREE.Vector2(0.24, 0.24),
    });
    mat.userData.baseColorHex = 0xa6262a;
    return mat;
  }

  if (name === 'MedialMeniscusTruncated') {
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: 0xadb9c6,
      roughness: 0.32,
      clearcoat: 0.42,
      clearcoatRoughness: 0.25,
      normalMap: bank.fibrocartilageNormal,
      normalScale: new THREE.Vector2(0.22, 0.22),
    });
    mat.userData.baseColorHex = 0xadb9c6;
    return mat;
  }

  if (MENISCUS_NAMES.has(name)) {
    const hex = name === 'MedialMeniscus' ? 0xb8c5d3 : 0xb0bece;
    const mat = new THREE.MeshPhysicalMaterial({
      ...common,
      color: hex,
      roughness: 0.28,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      sheen: 0.18,
      sheenColor: new THREE.Color(0xe5edf5),
      normalMap: bank.fibrocartilageNormal,
      normalScale: new THREE.Vector2(0.22, 0.22),
    });
    mat.userData.baseColorHex = hex;
    return mat;
  }

  // Ligaments & Tendons — striated silky collagen fascia
  const collagenTint =
    name === 'ACL'
      ? 0xe2d2b5
      : name === 'PCL'
        ? 0xd6c2a3
        : name === 'MCL' || name === 'LCL'
          ? 0xdfd3bf
          : 0xebe1d0;

  const mat = new THREE.MeshPhysicalMaterial({
    ...common,
    color: collagenTint,
    map: bank.collagenAlbedo,
    normalMap: bank.collagenNormal,
    normalScale: new THREE.Vector2(0.26, 0.26),
    roughness: 0.36,
    metalness: 0.0,
    anisotropy: 0.65,
    anisotropyRotation: Math.PI * 0.5,
    clearcoat: 0.34,
    clearcoatRoughness: 0.26,
    sheen: 0.38,
    sheenColor: new THREE.Color(0xfff5e4),
    envMapIntensity: 0.8,
  });
  mat.userData.baseColorHex = collagenTint;
  return mat;
}

function applyBoneXrayState(mat: THREE.MeshPhysicalMaterial, xray: boolean): void {
  mat.side = xray ? THREE.FrontSide : THREE.DoubleSide;
  mat.transparent = xray;
  mat.opacity = 1.0;
  mat.depthWrite = !xray;
  mat.clearcoat = xray ? 0 : 0.08;
  mat.color.setHex(
    xray ? (mat.userData.xrayColorHex as number) : (mat.userData.baseColorHex as number)
  );
}

function applyThicknessColorState(mat: THREE.MeshPhysicalMaterial, enabled: boolean): void {
  if (mat.vertexColors !== enabled) {
    mat.vertexColors = enabled;
    mat.color.setHex(enabled ? 0xffffff : (mat.userData.baseColorHex as number));
  }
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
  };
  chapterId: string;
  activeStructure: string;
  hoveredStructure: string | null;
}

export function syncSpecimenMaterialsAndVisibility(params: SpecimenSyncParams): void {
  const { meshes, materials, xrayUniform, visibility, chapterId, activeStructure, hoveredStructure } =
    params;

  xrayUniform.uXrayMode.value = visibility.xrayBones ? 1.0 : 0.0;

  const isBucket = chapterId === 'bucket-handle';
  const isAclBad = chapterId === 'acl-rupture' || chapterId === 'unhappy-triad';
  const isPclBad = chapterId === 'pcl-dashboard';
  const isMclBad = chapterId === 'unhappy-triad';

  for (const [name, mesh] of meshes) {
    const mat = materials.get(name);
    if (!mat) continue;

    if (BONE_NAMES.has(name)) {
      mesh.visible = visibility.bones;
      applyBoneXrayState(mat, visibility.xrayBones);
    } else if (EXTENSOR_NAMES.has(name)) {
      mesh.visible = visibility.extensor;
      if (name === 'Patella') {
        applyBoneXrayState(mat, visibility.xrayBones);
      } else if (name === 'PatellarCartilage') {
        applyThicknessColorState(mat, visibility.thicknessMap);
      }
    } else if (CARTILAGE_NAMES.has(name)) {
      mesh.visible = visibility.cartilage;
      applyThicknessColorState(mat, visibility.thicknessMap);
    } else if (MENISCUS_NAMES.has(name)) {
      if (name === 'MedialMeniscus') {
        mesh.visible = visibility.menisci && !isBucket;
      } else if (name === 'MedialMeniscusTruncated' || name === 'BucketHandleFragment') {
        mesh.visible = visibility.menisci && isBucket;
      } else {
        mesh.visible = visibility.menisci;
      }
    } else if (CRUCIATE_NAMES.has(name)) {
      mesh.visible = visibility.cruciates;
    } else if (COLLATERAL_NAMES.has(name)) {
      mesh.visible = visibility.collaterals;
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

    if (isPatho) {
      mat.emissive.setHex(0x7f1d1d);
      mat.emissiveIntensity = isSelected ? 0.55 : 0.34;
      if (name === 'ACL' && isAclBad) {
        mat.transparent = true;
        mat.opacity = 0.68;
      }
    } else if (isSelected) {
      mat.emissive.setHex(0x38bdf8);
      mat.emissiveIntensity = 0.28;
    } else if (isHovered) {
      mat.emissive.setHex(0x0284c7);
      mat.emissiveIntensity = 0.16;
    } else {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if (name === 'ACL') {
        mat.transparent = false;
        mat.opacity = 1.0;
      }
    }
    mat.needsUpdate = true;
  }
}

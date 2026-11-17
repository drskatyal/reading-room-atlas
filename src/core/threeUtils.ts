import * as THREE from 'three';

export interface AnatomyUserData {
  structureId: string;
  label: string;
  description: string;
  baseColor: number;
  baseEmissive?: number;
  baseOpacity?: number;
}

/**
 * Shared material factory using lightweight standard PBR materials.
 * Avoids heavy custom GLSL shader compilation stalls on hospital/Citrix PCs.
 */
export function createAnatomyMaterial(options: {
  color: number;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: number;
  emissiveIntensity?: number;
  side?: THREE.Side;
  depthWrite?: boolean;
}): THREE.MeshStandardMaterial {
  const transparent = options.transparent ?? (options.opacity !== undefined && options.opacity < 1);
  return new THREE.MeshStandardMaterial({
    color: options.color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.04,
    opacity: options.opacity ?? 1,
    transparent,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? !transparent,
  });
}

export function tagAnatomyMesh<T extends THREE.Object3D>(
  obj: T,
  meta: Omit<AnatomyUserData, 'baseColor'> & { baseColor?: number }
): T {
  const attach = (target: THREE.Object3D) => {
    let color = meta.baseColor ?? 0xd4a853;
    let emissive = meta.baseEmissive ?? 0x000000;
    let opacity = meta.baseOpacity ?? 1;
    if (target instanceof THREE.Mesh && target.material instanceof THREE.MeshStandardMaterial) {
      color = target.material.color.getHex();
      emissive = target.material.emissive.getHex();
      opacity = target.material.opacity;
    }
    target.userData = {
      ...target.userData,
      structureId: meta.structureId,
      label: meta.label,
      description: meta.description,
      baseColor: color,
      baseEmissive: emissive,
      baseOpacity: opacity,
    } satisfies AnatomyUserData;
  };

  attach(obj);
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      attach(child);
    }
  });
  return obj;
}

export function createSlicePlaneMesh(width: number, height: number, color = 0xd4a853): THREE.Group {
  const group = new THREE.Group();
  const planeGeo = new THREE.PlaneGeometry(width, height);
  const planeMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);

  const edges = new THREE.EdgesGeometry(planeGeo);
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.78,
  });
  const border = new THREE.LineSegments(edges, lineMat);

  group.add(plane, border);
  return group;
}

export function createStudioLights(scene: THREE.Scene): void {
  const hemi = new THREE.HemisphereLight(0xf6f2e9, 0x1b2333, 0.95);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.35);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9bc4f2, 0.65);
  fillLight.position.set(-6, 3, -4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xd4a853, 0.45);
  rimLight.position.set(0, -5, -6);
  scene.add(rimLight);
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
      obj.geometry?.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
}

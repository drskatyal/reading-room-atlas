import type { AppWorkspaceMode, JointId } from '../types/atlas';

export const JOINT_ORDER: JointId[] = [
  'ankle',
  'knee',
  'shoulder',
  'wrist',
  'elbow',
  'hip',
];

const JOINT_SET = new Set<string>(JOINT_ORDER);

function isJointId(val: string): val is JointId {
  return JOINT_SET.has(val);
}

function parseModeSlug(slug: string | undefined): AppWorkspaceMode {
  switch (slug) {
    case '3d':
    case 'fullscreen-3d':
      return 'fullscreen-3d';
    case 'pathology':
    case 'pathologies':
      return 'pathology';
    case 'report-guide':
    case 'how-to-read':
    case 'reporting':
      return 'report-guide';
    case 'quiz':
      return 'quiz';
    case 'anatomy':
    default:
      return 'anatomy';
  }
}

export function modeToSlug(mode: Exclude<AppWorkspaceMode, 'landing'>): string {
  switch (mode) {
    case 'fullscreen-3d':
      return '3d';
    case 'pathology':
      return 'pathology';
    case 'report-guide':
      return 'report-guide';
    case 'quiz':
      return 'quiz';
    case 'anatomy':
    default:
      return 'anatomy';
  }
}

export function parseRoute(
  pathname: string,
  search = ''
): { jointId: JointId; mode: AppWorkspaceMode; moduleParam?: string } {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  const rawMod = params.get('module');
  const moduleParam = rawMod && rawMod.trim().length > 0 ? rawMod.trim() : undefined;

  if (clean === '/') {
    return { jointId: 'ankle', mode: 'landing' };
  }

  const parts = clean.replace(/^\/+/, '').split('/').filter(Boolean);
  if (parts.length === 0) {
    return { jointId: 'ankle', mode: 'landing' };
  }

  const [first, second] = parts;
  if (isJointId(first)) {
    return {
      jointId: first,
      mode: parseModeSlug(second),
      moduleParam,
    };
  }

  // Legacy single-joint Knee URLs (/anatomy, /3d, /pathology, /report-guide, /quiz)
  if (
    first === 'anatomy' ||
    first === '3d' ||
    first === 'fullscreen-3d' ||
    first === 'pathology' ||
    first === 'pathologies' ||
    first === 'report-guide' ||
    first === 'how-to-read' ||
    first === 'reporting' ||
    first === 'quiz'
  ) {
    return {
      jointId: 'knee',
      mode: parseModeSlug(first),
      moduleParam,
    };
  }

  return { jointId: 'ankle', mode: 'landing' };
}

export function buildRoute(
  jointId: JointId,
  mode: AppWorkspaceMode,
  moduleId?: string
): string {
  if (mode === 'landing') return '/';
  const base = `/${jointId}/${modeToSlug(mode)}`;
  if (moduleId && moduleId.trim().length > 0) {
    return `${base}?module=${encodeURIComponent(moduleId.trim())}`;
  }
  return base;
}

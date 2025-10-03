import path from 'path';
import { promises as fs } from 'fs';

export async function isSafePath(basePath: string, targetPath: string): Promise<boolean> {
  const resolvedBasePath = path.resolve(basePath);
  const resolvedTargetPath = path.resolve(targetPath);

  if (!resolvedTargetPath.startsWith(resolvedBasePath)) {
    return false;
  }

  try {
    await fs.access(resolvedTargetPath);
  } catch {
    return false;
  }

  return true;
}

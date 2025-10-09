import path from 'path';
import { promises as fs } from 'fs';

export async function isSafePath(basePath: string, targetPath: string): Promise<boolean> {
  const resolvedBasePath = path.resolve(basePath);
  const resolvedTargetPath = path.resolve(targetPath);

  if (!resolvedTargetPath.startsWith(resolvedBasePath)) {
    console.error(`[DEBUG] SECURITY: Path outside base directory - Base: ${resolvedBasePath}, Target: ${resolvedTargetPath}`);
    return false;
  }

  try {
    await fs.access(resolvedTargetPath);
  } catch (error) {
    console.error(`[DEBUG] SECURITY: Path does not exist or no access - ${resolvedTargetPath}, Error: ${error}`);
    return false;
  }

  return true;
}

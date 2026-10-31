import fs from 'node:fs';
import path from 'node:path';

export function workspaceRoot(root) {
  if (!root || !path.isAbsolute(root)) throw new Error('Pin an absolute workspace root');
  return fs.realpathSync(root);
}

export function inside(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) ||
      /^[a-z]:/i.test(relative) || relative.includes('\\') && path.sep !== '\\' ||
      relative.split(/[\\/]/).some((part) => part === '..' || part === '.git') ||
      /[:*?"<>|\0]/.test(relative)) throw new Error('Use a safe workspace-relative path');
  const result = path.resolve(root, relative);
  const suffix = path.relative(root, result);
  if (!suffix || suffix === '..' || suffix.startsWith(`..${path.sep}`) || path.isAbsolute(suffix)) {
    throw new Error('Path must stay inside workspace root');
  }
  let current = root;
  for (const part of suffix.split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) || (() => {
      try { fs.lstatSync(current); return true; } catch { return false; }
    })()) {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symlink paths are not safe for writes');
    }
  }
  return result;
}

import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function resolveOpusModel(modelIds) {
  if (!Array.isArray(modelIds) || modelIds.some((id) => typeof id !== 'string' || !id.trim())) {
    throw new Error('Model inventory must be an array of non-empty exact host IDs');
  }
  const candidates = modelIds.flatMap((id) => {
    const match = id.match(/^claude[ -]opus[ -](\d+(?:\.\d+)*)(?=$|[ -])/i);
    if (!match) return [];
    const version = match[1].split('.').map(Number);
    if (version.some((part) => !Number.isSafeInteger(part))) {
      throw new Error(`Invalid Opus version in model ID: ${id}`);
    }
    return [{ id, version }];
  });
  candidates.sort((a, b) => {
    for (let i = 0; i < Math.max(a.version.length, b.version.length); i++) {
      const difference = (b.version[i] ?? 0) - (a.version[i] ?? 0);
      if (difference) return difference;
    }
    return a.id.length - b.id.length || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  if (!candidates.length) throw new Error('BLOCKED: Opus unavailable in host model inventory');
  return candidates[0].id;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(resolveOpusModel(JSON.parse(process.argv[2]))));
}

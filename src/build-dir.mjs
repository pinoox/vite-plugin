import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_BUILD_DIR = 'dist';

/** Written for PHP (FrontendConfig) when Vite starts — mirrors pincore `.pinoox/build-out-dir`. */
export const PINOOX_BUILD_OUT_DIR_CACHE = '.pinoox/build-out-dir';

/**
 * @param {string} outDir
 */
export function normalizeBuildOutDir(outDir) {
    const normalized = String(outDir ?? DEFAULT_BUILD_DIR).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

    return normalized || DEFAULT_BUILD_DIR;
}

/**
 * @param {string} outDir
 */
export function hotFileForOutDir(outDir) {
    return `${normalizeBuildOutDir(outDir)}/hot`;
}

/**
 * @param {string} outDir
 */
export function manifestFileForOutDir(outDir) {
    return `${normalizeBuildOutDir(outDir)}/.vite/manifest.json`;
}

/**
 * @param {Record<string, string>} [env]
 * @param {string} [userOutDir]
 */
export function resolveBuildOutDir(env = {}, userOutDir) {
    const fromEnv = env.VITE_BUILD_OUT_DIR || process.env.VITE_BUILD_OUT_DIR;

    if (fromEnv) {
        return normalizeBuildOutDir(fromEnv);
    }

    if (userOutDir) {
        return normalizeBuildOutDir(userOutDir);
    }

    return DEFAULT_BUILD_DIR;
}

/**
 * Hot-file path shared by Node (pinooxHot) and PHP (FrontendConfig::hotRelativePath).
 *
 * @param {Record<string, string>} env
 * @param {{ file?: string }} [options]
 * @param {string} [outDir]
 */
export function resolveHotFile(env = {}, options = {}, outDir) {
    if (options.file) {
        return options.file;
    }

    const fromEnv = env.VITE_HOT_FILE || process.env.VITE_HOT_FILE;

    if (fromEnv) {
        return String(fromEnv).replace(/\\/g, '/');
    }

    return hotFileForOutDir(outDir ?? resolveBuildOutDir(env));
}

/**
 * @param {string} themeRoot
 * @param {string} outDir
 */
export function writeBuildOutDirCache(themeRoot, outDir) {
    const normalized = normalizeBuildOutDir(outDir);
    const cachePath = path.join(themeRoot, PINOOX_BUILD_OUT_DIR_CACHE);

    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, normalized);
}

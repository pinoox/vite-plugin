import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_BUILD_DIR = 'dist';

/** Shared with pincore FrontendDevState::RELATIVE_PATH */
export const PINOOX_DEV_STATE = '.pinoox/dev.json';

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
 * @param {string} themeRoot
 */
export function devStateAbsolutePath(themeRoot) {
    return path.join(themeRoot, PINOOX_DEV_STATE);
}

/**
 * @param {string} themeRoot
 * @returns {{ viteUrl?: string, port?: number, outDir?: string }|null}
 */
export function readDevState(themeRoot) {
    const filePath = devStateAbsolutePath(themeRoot);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * @param {string} themeRoot
 * @param {{ viteUrl?: string, port?: number, outDir?: string }} patch
 */
export function writeDevState(themeRoot, patch = {}) {
    const current = readDevState(themeRoot) ?? {};
    const next = { ...current };

    if (patch.viteUrl !== undefined) {
        const trimmed = String(patch.viteUrl).trim();

        if (trimmed !== '') {
            next.viteUrl = trimmed.replace(/\/$/, '');
        } else {
            delete next.viteUrl;
        }
    }

    if (patch.port !== undefined) {
        const port = Number(patch.port);

        if (Number.isFinite(port) && port > 0 && port <= 65535) {
            next.port = port;
        } else {
            delete next.port;
        }
    }

    if (patch.outDir !== undefined) {
        const outDir = normalizeBuildOutDir(patch.outDir);

        if (outDir !== '') {
            next.outDir = outDir;
        } else {
            delete next.outDir;
        }
    }

    if (Object.keys(next).length === 0) {
        removeDevState(themeRoot);

        return;
    }

    const filePath = devStateAbsolutePath(themeRoot);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`);
}

/**
 * @param {string} themeRoot
 */
export function removeDevState(themeRoot) {
    const filePath = devStateAbsolutePath(themeRoot);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    for (const legacy of [
        path.join(themeRoot, '.pinoox', 'build-out-dir'),
        path.join(themeRoot, 'dist', '.vite-dev-port'),
        path.join(themeRoot, 'dist', 'hot'),
    ]) {
        if (fs.existsSync(legacy)) {
            fs.unlinkSync(legacy);
        }
    }
}

/**
 * @param {string} themeRoot
 * @param {string} outDir
 */
export function writeBuildOutDirCache(themeRoot, outDir) {
    writeDevState(themeRoot, { outDir });
}

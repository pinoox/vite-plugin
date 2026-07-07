import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_REFRESH_PATHS } from './constants.mjs';

/**
 * @param {string} filePath
 * @param {string} pattern
 */
export function matchGlob(filePath, pattern) {
    const regex = globToRegExp(pattern);

    return regex.test(filePath) || regex.test(path.basename(filePath));
}

/**
 * @param {string} glob
 */
function globToRegExp(glob) {
    const escaped = glob
        .replace(/\\/g, '/')
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '§§')
        .replace(/\*/g, '[^/]*')
        .replace(/§§/g, '.*')
        .replace(/\?/g, '.');

    return new RegExp(`(^|/)${escaped}$`);
}

/**
 * @param {string} pattern
 */
function isAbsolutePattern(pattern) {
    const normalized = pattern.replace(/\\/g, '/');

    return path.isAbsolute(normalized) || /^[A-Za-z]:\//.test(normalized);
}

/**
 * Absolute app-backend globs from `VITE_DEV_REFRESH` need directory roots registered on the watcher.
 *
 * @param {string[]} globs
 * @returns {string[]}
 */
export function collectAbsoluteWatchRoots(globs) {
    /** @type {Set<string>} */
    const roots = new Set();

    for (const pattern of globs) {
        if (!isAbsolutePattern(pattern)) {
            continue;
        }

        const normalized = pattern.replace(/\\/g, '/');
        const wildcardIndex = normalized.search(/[*?[\]]/);

        if (wildcardIndex === -1) {
            if (!fs.existsSync(normalized)) {
                continue;
            }

            const stat = fs.statSync(normalized);
            roots.add(stat.isDirectory() ? normalized : path.dirname(normalized).replace(/\\/g, '/'));

            continue;
        }

        let root = normalized.slice(0, wildcardIndex).replace(/\/+$/, '');

        while (root && !fs.existsSync(root)) {
            root = path.dirname(root);
        }

        if (root) {
            roots.add(root.replace(/\\/g, '/'));
        }
    }

    return [...roots];
}

/**
 * @param {Record<string, string>} env
 * @param {{ paths?: string[]|boolean }} [options]
 * @returns {string[]}
 */
export function resolveRefreshPaths(env = {}, options = {}) {
    const paths = options.paths ?? true;
    let base;

    if (paths === false) {
        base = [];
    } else if (Array.isArray(paths)) {
        base = paths;
    } else {
        base = DEFAULT_REFRESH_PATHS;
    }

    const extra = String(env.VITE_DEV_REFRESH || process.env.VITE_DEV_REFRESH || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    return [...base, ...extra];
}

/**
 * Full-page reload when Twig templates or app PHP (Flow, routes, Controller, …) change.
 *
 * @param {string[]|boolean} paths
 * @param {Record<string, string>} [env]
 */
export function pinooxRefresh(paths = true, env = {}) {
    const mergedEnv = { ...process.env, ...env };
    const watchGlobs = resolveRefreshPaths(mergedEnv, {
        paths: paths === false ? false : (Array.isArray(paths) ? paths : true),
    });

    return {
        name: 'pinoox-refresh',
        configureServer(server) {
            if (watchGlobs.length === 0) {
                return;
            }

            const absoluteRoots = collectAbsoluteWatchRoots(watchGlobs);

            for (const root of absoluteRoots) {
                server.watcher.add(root);
            }

            for (const pattern of watchGlobs) {
                if (!isAbsolutePattern(pattern)) {
                    server.watcher.add(pattern);
                }
            }

            const shouldReload = (file) => {
                const normalized = file.replace(/\\/g, '/');

                return watchGlobs.some((pattern) => matchGlob(normalized, pattern.replace(/\\/g, '/')));
            };

            const reload = (file) => {
                if (shouldReload(file)) {
                    server.ws.send({ type: 'full-reload', path: '*' });
                }
            };

            server.watcher.on('change', reload);
            server.watcher.on('add', reload);
            server.watcher.on('unlink', reload);
        },
    };
}

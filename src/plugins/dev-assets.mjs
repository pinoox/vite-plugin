import { resolveDevServerUrlFromInstance } from '../env.mjs';

/** @type {RegExp} */
const DEV_ASSET_ROOT_PATTERN = /\/(node_modules|src|@fs|@id)\//;

/**
 * Rewrite root-absolute Vite asset URLs so they load from the dev server, not PHP.
 *
 * @param {string} code
 * @param {string} devServerUrl
 * @returns {string|null}
 */
export function rewriteDevAssetUrls(code, devServerUrl) {
    if (!devServerUrl || !DEV_ASSET_ROOT_PATTERN.test(code)) {
        return null;
    }

    let result = code;

    // Replace stale absolute dev origins (e.g. VITE_DEV_SERVER from a prior run or port bump).
    result = result.replace(
        /url\(\s*https?:\/\/[^/)]+(?=\/(?:node_modules|src|@fs|@id)\/)/g,
        `url(${devServerUrl}`,
    );

    result = result.replace(
        /(["'`])\/(node_modules|src|@fs|@id)\//g,
        (match, quote, root, offset) => {
            const before = result.slice(Math.max(0, offset - devServerUrl.length), offset);

            if (before.endsWith(devServerUrl)) {
                return match;
            }

            return `${quote}${devServerUrl}/${root}/`;
        },
    );

    result = result.replace(
        /url\(\s*\/(node_modules|src|@fs|@id)\//g,
        (match, root, offset) => {
            const before = result.slice(Math.max(0, offset - devServerUrl.length), offset);

            if (before.endsWith(devServerUrl)) {
                return match;
            }

            return `url(${devServerUrl}/${root}/`;
        },
    );

    return result === code ? null : result;
}

/**
 * Rewrites root-absolute asset URLs (/src, /node_modules, …) to the Vite dev server.
 *
 * @param {Record<string, string>} [env]
 */
export function pinooxDevAssets(env = {}) {
    /** @type {import('vite').ViteDevServer | null} */
    let serverInstance = null;

    return {
        name: 'pinoox-dev-assets',
        apply: 'serve',
        enforce: 'post',
        configureServer(server) {
            serverInstance = server;
        },
        transform(code) {
            if (!serverInstance) {
                return null;
            }

            const devServerUrl = resolveDevServerUrlFromInstance(serverInstance, env);

            return rewriteDevAssetUrls(code, devServerUrl);
        },
    };
}

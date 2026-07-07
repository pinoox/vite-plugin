import { resolveDevServerUrlFromInstance, resolveViteDevOrigin } from '../env.mjs';

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
    let devServerUrl = resolveViteDevOrigin(env);

    return {
        name: 'pinoox-dev-assets',
        apply: 'serve',
        configureServer(server) {
            const updateDevServerUrl = () => {
                devServerUrl = resolveDevServerUrlFromInstance(server, env);
            };

            server.httpServer?.once('listening', updateDevServerUrl);

            if (server.httpServer?.listening) {
                updateDevServerUrl();
            }
        },
        transform(code) {
            return rewriteDevAssetUrls(code, devServerUrl);
        },
    };
}

import {
    parseOrigin,
    resolveNetworkMode,
    resolveViteDevOrigin,
    resolveViteHost,
    resolveVitePublicOrigin,
} from './env.mjs';
import { DEFAULT_PHP_ORIGIN, DEFAULT_VITE_PORT } from './constants.mjs';

/**
 * @param {Record<string, string>} env
 * @param {{ serverUrl?: string, port?: number, proxy?: string[], host?: boolean, strictPort?: boolean, network?: boolean }} [options]
 * @param {string} [serverUrl]
 */
function resolveProxyPrefixes(env, options, serverUrl) {
    if (Array.isArray(options.proxy) && options.proxy.length > 0) {
        return options.proxy;
    }

    const fromEnv = String(env.VITE_DEV_PROXY || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (fromEnv.length > 0) {
        return fromEnv;
    }

    try {
        const mountPath = new URL(serverUrl).pathname.replace(/\/$/, '');

        if (mountPath && mountPath !== '/') {
            return [mountPath];
        }
    } catch {
        // ignore
    }

    return [];
}

/**
 * @param {import('vite').ServerOptions} defaults
 * @param {import('vite').ServerOptions} [overrides]
 */
export function mergePinooxServer(defaults, overrides = {}) {
    if (!overrides || Object.keys(overrides).length === 0) {
        return defaults;
    }

    return {
        ...defaults,
        ...overrides,
        proxy: {
            ...(defaults.proxy ?? {}),
            ...(overrides.proxy ?? {}),
        },
        hmr: overrides.hmr === false
            ? false
            : {
                ...(typeof defaults.hmr === 'object' ? defaults.hmr : {}),
                ...(overrides.hmr === true ? {} : (typeof overrides.hmr === 'object' ? overrides.hmr : {})),
            },
    };
}

/**
 * Vite dev-server block from theme .env (VITE_DEV_PORT, VITE_SERVER_URL, VITE_DEV_PROXY).
 *
 * @param {Record<string, string>} env
 * @param {{ serverUrl?: string, port?: number, proxy?: string[], host?: boolean, strictPort?: boolean, network?: boolean }} [options]
 */
export function pinooxServer(env = {}, options = {}) {
    const serverUrl = env.VITE_SERVER_URL || options.serverUrl || DEFAULT_PHP_ORIGIN;
    const port = Number(env.VITE_DEV_PORT || options.port || DEFAULT_VITE_PORT);
    const phpOrigin = parseOrigin(serverUrl);
    const network = resolveNetworkMode(env, options);
    const viteOrigin = network
        ? resolveVitePublicOrigin(env, port)
        : resolveViteDevOrigin(env, port, options);
    const strictPort = options.strictPort ?? false;
    const prefixes = resolveProxyPrefixes(env, options, serverUrl);
    const proxy = {};

    for (const prefix of prefixes) {
        proxy[prefix] = { target: phpOrigin, changeOrigin: true };
    }

    const server = {
        port,
        host: resolveViteHost(env, options),
        strictPort,
        proxy,
        printUrls: false,
        origin: viteOrigin,
    };

    if (network) {
        server.cors = true;
    }

    return server;
}

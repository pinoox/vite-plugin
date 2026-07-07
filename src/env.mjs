/**
 * @param {Record<string, string>} [env]
 * @returns {Record<string, string>}
 */
export function mergedEnv(env = {}) {
    return { ...process.env, ...env };
}

/**
 * @param {Record<string, string>} env
 * @param {{ quiet?: boolean|string }} [options]
 */
export function resolveViteQuiet(env = {}, options = {}) {
    const raw = env.VITE_DEV_QUIET ?? process.env.VITE_DEV_QUIET ?? options.quiet;

    if (raw === undefined || raw === null || raw === '') {
        return true;
    }

    if (raw === 'false' || raw === '0' || raw === 'no') {
        return false;
    }

    return true;
}

/**
 * @param {Record<string, string>} env
 * @param {{ host?: boolean|string }} [options]
 */
export function resolveViteHost(env = {}, options = {}) {
    const raw = env.VITE_DEV_HOST ?? process.env.VITE_DEV_HOST ?? options.host;

    if (raw === undefined || raw === null || raw === '') {
        return '127.0.0.1';
    }

    if (raw === 'true' || raw === '0.0.0.0' || raw === 'all' || raw === 'network') {
        return true;
    }

    if (raw === 'false' || raw === 'localhost') {
        return '127.0.0.1';
    }

    return raw;
}

/**
 * @param {Record<string, string>} env
 * @param {{ network?: boolean|string }} [options]
 */
export function resolveNetworkMode(env = {}, options = {}) {
    const raw = env.VITE_DEV_NETWORK ?? process.env.VITE_DEV_NETWORK ?? options.network;

    return raw === 'true' || raw === '1' || raw === true;
}

/**
 * @param {Record<string, string>} env
 */
export function resolveVitePublicHostname(env = {}) {
    const merged = mergedEnv(env);
    const appUrl = merged.VITE_SERVER_URL || process.env.VITE_SERVER_URL;

    if (appUrl) {
        try {
            return new URL(appUrl).hostname;
        } catch {
            // fall through
        }
    }

    const host = resolveViteHost(merged);

    return host === true || host === '0.0.0.0' ? '127.0.0.1' : (host || '127.0.0.1');
}

/**
 * @param {Record<string, string>} env
 * @param {number} [port]
 */
export function resolveVitePublicOrigin(env = {}, port = 5173) {
    return `http://${resolveVitePublicHostname(env)}:${port}`;
}

/**
 * @param {Record<string, string>} env
 * @param {number} [port]
 * @param {{ host?: boolean|string, viteOrigin?: string }} [options]
 */
export function resolveViteDevOrigin(env = {}, port = 5173, options = {}) {
    const fromEnv = env.VITE_DEV_SERVER || process.env.VITE_DEV_SERVER || options.viteOrigin;

    if (fromEnv) {
        return String(fromEnv).replace(/\/$/, '');
    }

    const host = options.host ?? true;
    const hostname = host === true || host === '0.0.0.0' ? '127.0.0.1' : (host || '127.0.0.1');

    return `http://${hostname}:${port}`;
}

/**
 * Actual TCP port the dev server is listening on (may differ from config when strictPort is false).
 *
 * @param {import('vite').ViteDevServer} server
 * @returns {number|null}
 */
export function resolveListeningPort(server) {
    const address = server.httpServer?.address();

    if (address && typeof address === 'object' && typeof address.port === 'number' && address.port > 0) {
        return address.port;
    }

    return null;
}

/**
 * @param {import('vite').ViteDevServer} server
 * @param {Record<string, string>} [env]
 */
export function resolveDevServerUrlFromInstance(server, env = {}) {
    const merged = mergedEnv(env);
    const host = server.config.server.host;
    let hostname = host === true || host === '0.0.0.0' ? '127.0.0.1' : (host || '127.0.0.1');

    if ((merged.VITE_DEV_NETWORK || process.env.VITE_DEV_NETWORK) === 'true') {
        const appUrl = merged.VITE_SERVER_URL || process.env.VITE_SERVER_URL;

        if (appUrl) {
            try {
                hostname = new URL(appUrl).hostname;
            } catch {
                // keep default
            }
        }
    }

    const port = resolveListeningPort(server) ?? server.config.server.port ?? 5173;

    return `http://${hostname}:${port}`;
}

/**
 * @param {string} serverUrl
 */
export function parseOrigin(serverUrl) {
    try {
        return new URL(serverUrl).origin;
    } catch {
        return 'http://127.0.0.1:8000';
    }
}

/**
 * @param {string} appUrl
 */
export function resolveLocalAppUrl(appUrl) {
    try {
        const url = new URL(appUrl);
        url.hostname = '127.0.0.1';

        return url.toString();
    } catch {
        return appUrl;
    }
}

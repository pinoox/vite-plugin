export { resolveHotFile } from './build-dir.mjs';

/**
 * @typedef {Object} PinooxPluginConfig
 * @property {string|string[]} [input]
 * @property {string|string[]} [entries]
 * @property {Record<string, string>} [env]
 * @property {string[]|boolean} [refresh]
 * @property {string} [hotFile]
 * @property {import('vite').ServerOptions} [server]
 * @property {import('vite').BuildOptions} [build]
 */

/**
 * @param {string|string[]|PinooxPluginConfig} config
 */
export function resolvePinooxPluginConfig(config) {
    if (typeof config === 'string') {
        return { entries: [config], env: {}, refresh: true };
    }

    if (Array.isArray(config)) {
        return { entries: config, env: {}, refresh: true };
    }

    const entries = config.entries ?? config.input;

    return {
        entries: normalizePinooxEntries(entries),
        env: config.env ?? {},
        refresh: config.refresh ?? true,
        hotFile: config.hotFile,
        server: config.server,
        build: config.build,
    };
}

/**
 * @param {string|string[]|undefined} entries
 * @returns {string[]|undefined}
 */
export function normalizePinooxEntries(entries) {
    if (typeof entries === 'string') {
        return [entries];
    }

    if (Array.isArray(entries) && entries.length > 0) {
        return entries;
    }

    return undefined;
}

/**
 * @param {import('vite').UserConfig} userConfig
 * @param {ReturnType<typeof resolvePinooxPluginConfig>} pluginConfig
 */
export function resolveBuildInput(userConfig, pluginConfig) {
    if (pluginConfig.entries?.length) {
        return pluginConfig.entries;
    }

    return normalizePinooxEntries(
        userConfig.build?.rollupOptions?.input
        ?? userConfig.build?.rolldownOptions?.input,
    );
}

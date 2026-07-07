import { createRequire } from 'node:module';

/** @type {number|null} */
let cachedViteMajor = null;

export function viteMajorVersion() {
    if (cachedViteMajor !== null) {
        return cachedViteMajor;
    }

    try {
        const require = createRequire(import.meta.url);
        const version = require('vite/package.json').version;
        cachedViteMajor = Number.parseInt(String(version).split('.')[0], 10);
    } catch {
        cachedViteMajor = 7;
    }

    return cachedViteMajor;
}

/**
 * @param {string|string[]|Record<string, string>|undefined} input
 * @returns {string[]|Record<string, string>|undefined}
 */
export function normalizeBuildInput(input) {
    if (typeof input === 'string' && input.trim() !== '') {
        return [input];
    }

    if (Array.isArray(input)) {
        const entries = input.filter((entry) => typeof entry === 'string' && entry.trim() !== '');

        return entries.length > 0 ? entries : undefined;
    }

    if (input && typeof input === 'object') {
        return input;
    }

    return undefined;
}

/**
 * @param {import('vite').UserConfig} userConfig
 * @param {import('./config.mjs').PinooxPluginConfig} pluginConfig
 * @param {string[]|undefined} entries
 */
export function resolveExplicitBuildInput(userConfig, pluginConfig, entries) {
    const fromUser = userConfig.build?.rollupOptions?.input
        ?? userConfig.build?.rolldownOptions?.input
        ?? pluginConfig.build?.rollupOptions?.input
        ?? pluginConfig.build?.rolldownOptions?.input;

    return normalizeBuildInput(fromUser ?? entries);
}

/**
 * Vite 8+ uses Rolldown (`build.rolldownOptions`); older Vite uses Rollup input.
 *
 * @param {import('vite').UserConfig} userConfig
 * @param {import('./config.mjs').PinooxPluginConfig} pluginConfig
 * @param {string[]|undefined} entries
 * @returns {{ rolldownOptions?: import('vite').BuildOptions['rolldownOptions'], rollupOptions?: import('vite').BuildOptions['rollupOptions'] }}
 */
export function buildBundlerOptions(userConfig, pluginConfig, entries) {
    const input = resolveExplicitBuildInput(userConfig, pluginConfig, entries);

    if (!input) {
        return {};
    }

    const userRollup = userConfig.build?.rollupOptions ?? {};
    const userRolldown = userConfig.build?.rolldownOptions ?? {};
    const pluginRollup = pluginConfig.build?.rollupOptions ?? {};
    const pluginRolldown = pluginConfig.build?.rolldownOptions ?? {};
    const output = {
        ...(userRolldown.output ?? {}),
        ...(userRollup.output ?? {}),
        ...(pluginRolldown.output ?? {}),
        ...(pluginRollup.output ?? {}),
    };

    if (viteMajorVersion() >= 8) {
        return {
            rolldownOptions: {
                ...userRollup,
                ...userRolldown,
                ...pluginRollup,
                ...pluginRolldown,
                input,
                ...(Object.keys(output).length > 0 ? { output } : {}),
            },
        };
    }

    return {
        rollupOptions: {
            ...userRollup,
            ...pluginRollup,
            input,
            ...(Object.keys(output).length > 0 ? { output } : {}),
        },
    };
}

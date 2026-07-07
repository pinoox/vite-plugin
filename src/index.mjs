import { composePinooxPlugins } from './compose.mjs';
import { createPinooxViteConfig } from './factory.mjs';
import { resolveHotFile, resolvePinooxPluginConfig } from './config.mjs';
import { pinooxHot } from './plugins/hot.mjs';
import { pinooxDevAssets } from './plugins/dev-assets.mjs';
import { collectAbsoluteWatchRoots, pinooxRefresh, resolveRefreshPaths } from './refresh.mjs';
import { pinooxServer } from './server.mjs';

/**
 * Pinoox plugin for Vite — Laravel-style API.
 *
 * @example
 * import { defineConfig } from 'vite';
 * import pinoox from '@pinooxhq/vite-plugin';
 *
 * export default defineConfig({
 *     plugins: [
 *         pinoox(['src/main.js', 'src/assets/styles/app.css']),
 *     ],
 * });
 *
 * @param {string|string[]|import('./config.mjs').PinooxPluginConfig} config
 * @returns {import('vite').PluginOption[]}
 */
export function pinoox(config) {
    return composePinooxPlugins(config);
}

export {
    collectAbsoluteWatchRoots,
    composePinooxPlugins,
    createPinooxViteConfig,
    pinooxDevAssets,
    pinooxHot,
    pinooxRefresh,
    pinooxServer,
    resolveHotFile,
    resolvePinooxPluginConfig,
    resolveRefreshPaths,
};

export default pinoox;

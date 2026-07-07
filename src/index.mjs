import { composePinooxPlugins } from './compose.mjs';
import {
    PINOOX_DEV_STATE,
    manifestFileForOutDir,
    normalizeBuildOutDir,
    readDevState,
    removeDevState,
    resolveBuildOutDir,
    writeBuildOutDirCache,
    writeDevState,
} from './dev-state.mjs';
import { createPinooxViteConfig } from './factory.mjs';
import { resolvePinooxPluginConfig } from './config.mjs';
import { pinooxDevState, pinooxHot } from './plugins/dev-state.mjs';
import { pinooxDevAssets } from './plugins/dev-assets.mjs';
import { collectAbsoluteWatchRoots, pinooxRefresh, resolveRefreshPaths } from './refresh.mjs';
import { pinooxServer } from './server.mjs';

/**
 * Pinoox plugin for Vite.
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
    manifestFileForOutDir,
    normalizeBuildOutDir,
    PINOOX_DEV_STATE,
    pinooxDevAssets,
    pinooxDevState,
    pinooxHot,
    pinooxRefresh,
    pinooxServer,
    readDevState,
    removeDevState,
    resolveBuildOutDir,
    resolvePinooxPluginConfig,
    resolveRefreshPaths,
    writeBuildOutDirCache,
    writeDevState,
};

export default pinoox;

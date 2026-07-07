import { resolvePinooxPluginConfig } from './config.mjs';
import { pinooxDevAssets } from './plugins/dev-assets.mjs';
import { pinooxHot } from './plugins/hot.mjs';
import { resolvePinooxPlugin } from './plugins/pinoox.mjs';
import { pinooxRefresh, resolveRefreshPaths } from './refresh.mjs';

/**
 * @param {string|string[]|import('./config.mjs').PinooxPluginConfig} config
 * @returns {import('vite').PluginOption[]}
 */
export function composePinooxPlugins(config) {
    const pluginConfig = resolvePinooxPluginConfig(config);
    const env = pluginConfig.env ?? {};
    const refresh = pluginConfig.refresh ?? true;
    const refreshPaths = resolveRefreshPaths(env, {
        paths: refresh === false ? false : (Array.isArray(refresh) ? refresh : true),
    });

    return [
        resolvePinooxPlugin(pluginConfig),
        pinooxHot({ env, file: pluginConfig.hotFile }),
        pinooxDevAssets(env),
        ...(refreshPaths.length > 0 ? [pinooxRefresh(refresh, env)] : []),
    ];
}

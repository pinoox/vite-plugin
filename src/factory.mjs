import { DEFAULT_ENTRIES } from './constants.mjs';
import { composePinooxPlugins } from './compose.mjs';

/**
 * Zero-config Vite config factory for theme stubs.
 *
 * @param {{
 *   env?: Record<string, string>,
 *   stack?: import('./constants.mjs').PinooxStack,
 *   entries?: string[],
 *   refresh?: string[]|boolean,
 *   plugins?: import('vite').PluginOption[],
 *   resolve?: import('vite').UserConfig['resolve'],
 *   build?: import('vite').BuildOptions,
 *   server?: import('vite').ServerOptions,
 * }} [options]
 */
export function createPinooxViteConfig(options = {}) {
    const env = options.env ?? {};
    const stack = options.stack ?? 'vite';
    const entries = options.entries?.length
        ? options.entries
        : (DEFAULT_ENTRIES[stack] ?? DEFAULT_ENTRIES.vite);

    return {
        plugins: [
            ...composePinooxPlugins({
                env,
                entries,
                refresh: options.refresh ?? true,
                build: options.build,
                server: options.server,
            }),
            ...(options.plugins ?? []),
        ],
        resolve: options.resolve,
    };
}

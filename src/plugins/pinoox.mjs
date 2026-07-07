import { DEFAULT_BUILD_DIR } from '../constants.mjs';
import { resolveBuildInput } from '../config.mjs';
import { mergePinooxServer, pinooxServer } from '../server.mjs';

/**
 * Main Pinoox plugin — merges build entries, manifest, and dev-server proxy.
 *
 * @param {import('../config.mjs').PinooxPluginConfig & { entries?: string[] }} pluginConfig
 */
export function resolvePinooxPlugin(pluginConfig) {
    const env = pluginConfig.env ?? {};

    return {
        name: 'pinoox',
        config(userConfig) {
            const entries = resolveBuildInput(userConfig, pluginConfig);
            const serverDefaults = pinooxServer(env, pluginConfig.server ?? {});

            return {
                base: userConfig.base ?? './',
                build: {
                    manifest: userConfig.build?.manifest ?? true,
                    outDir: userConfig.build?.outDir ?? DEFAULT_BUILD_DIR,
                    ...(pluginConfig.build ?? {}),
                    ...(userConfig.build ?? {}),
                    rollupOptions: {
                        ...(userConfig.build?.rollupOptions ?? {}),
                        ...(pluginConfig.build?.rollupOptions ?? {}),
                        input: userConfig.build?.rollupOptions?.input
                            ?? pluginConfig.build?.rollupOptions?.input
                            ?? entries,
                    },
                },
                server: mergePinooxServer(serverDefaults, userConfig.server),
            };
        },
    };
}

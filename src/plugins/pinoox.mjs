import { normalizeBuildOutDir, resolveBuildOutDir, writeBuildOutDirCache } from '../build-dir.mjs';
import { resolveBuildInput } from '../config.mjs';
import { mergePinooxServer, pinooxServer } from '../server.mjs';

/**
 * Main Pinoox plugin — merges build entries, manifest, and dev-server proxy.
 *
 * @param {import('../config.mjs').PinooxPluginConfig & { entries?: string[] }} pluginConfig
 */
export function resolvePinooxPlugin(pluginConfig) {
    const env = pluginConfig.env ?? {};
    /** @type {string} */
    let resolvedOutDir = resolveBuildOutDir(env);

    return {
        name: 'pinoox',
        config(userConfig) {
            const entries = resolveBuildInput(userConfig, pluginConfig);
            const serverDefaults = pinooxServer(env, pluginConfig.server ?? {});
            resolvedOutDir = resolveBuildOutDir(
                env,
                userConfig.build?.outDir ?? pluginConfig.build?.outDir,
            );

            return {
                base: userConfig.base ?? './',
                build: {
                    manifest: userConfig.build?.manifest ?? true,
                    ...(pluginConfig.build ?? {}),
                    ...(userConfig.build ?? {}),
                    outDir: userConfig.build?.outDir ?? pluginConfig.build?.outDir ?? resolvedOutDir,
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
        configResolved(resolved) {
            resolvedOutDir = normalizeBuildOutDir(resolved.build.outDir);
        },
        closeBundle() {
            writeBuildOutDirCache(process.cwd(), resolvedOutDir);
        },
    };
}

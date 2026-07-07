import { buildBundlerOptions } from '../build-input.mjs';
import { normalizeBuildOutDir, resolveBuildOutDir, writeDevState } from '../dev-state.mjs';
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
    /** @type {string[]|undefined} */
    let resolvedEntries = pluginConfig.entries;

    return {
        name: 'pinoox',
        config(userConfig) {
            const entries = resolveBuildInput(userConfig, pluginConfig);
            resolvedEntries = entries;
            const serverDefaults = pinooxServer(env, pluginConfig.server ?? {});
            resolvedOutDir = resolveBuildOutDir(
                env,
                userConfig.build?.outDir ?? pluginConfig.build?.outDir,
            );
            const bundlerOptions = buildBundlerOptions(userConfig, pluginConfig, entries);
            const {
                rollupOptions: _userRollupOptions,
                rolldownOptions: _userRolldownOptions,
                ...userBuildRest
            } = userConfig.build ?? {};

            return {
                base: userConfig.base ?? './',
                build: {
                    manifest: userConfig.build?.manifest ?? true,
                    ...(pluginConfig.build ?? {}),
                    ...userBuildRest,
                    outDir: userConfig.build?.outDir ?? pluginConfig.build?.outDir ?? resolvedOutDir,
                    ...bundlerOptions,
                },
                server: mergePinooxServer(serverDefaults, userConfig.server),
            };
        },
        configResolved(resolved) {
            resolvedOutDir = normalizeBuildOutDir(resolved.build.outDir);

            if (resolved.command !== 'build' || !resolvedEntries?.length) {
                return;
            }

            const input = resolvedEntries;
            const rolldown = resolved.build.rolldownOptions ?? {};
            const rollup = resolved.build.rollupOptions ?? {};

            if (resolved.build.rolldownOptions) {
                resolved.build.rolldownOptions = {
                    ...rolldown,
                    input: rolldown.input ?? rollup.input ?? input,
                };
            }

            if (resolved.build.rollupOptions && !resolved.build.rolldownOptions) {
                resolved.build.rollupOptions = {
                    ...rollup,
                    input: rollup.input ?? input,
                };
            }
        },
        closeBundle() {
            writeDevState(process.cwd(), { outDir: resolvedOutDir });
        },
    };
}

import { printPinooxDevBanner } from '../banner.mjs';
import {
    normalizeBuildOutDir,
    removeDevState,
    resolveBuildOutDir,
    writeDevState,
} from '../dev-state.mjs';
import {
    mergedEnv,
    resolveDevServerUrlFromInstance,
    resolveNetworkMode,
    resolveListeningPort,
    resolveVitePublicHostname,
} from '../env.mjs';
import { createPinooxViteLogger } from '../logger.mjs';

/**
 * Writes `.pinoox/dev.json` so PHP enables Vite HMR via vite_tags().
 *
 * @param {{ env?: Record<string, string>, quiet?: boolean|string }} [options]
 */
export function pinooxDevState(options = {}) {
    const pluginEnv = mergedEnv(options.env ?? {});

    const themeRoot = process.cwd();

    const writeState = (server) => {
        const outDir = normalizeBuildOutDir(server.config.build?.outDir ?? resolveBuildOutDir(pluginEnv));
        const devUrl = resolveDevServerUrlFromInstance(server, pluginEnv);
        const port = resolveListeningPort(server) ?? server.config.server.port ?? 5173;

        writeDevState(themeRoot, {
            viteUrl: devUrl,
            port,
            outDir,
        });
    };

    const cleanup = () => {
        removeDevState(themeRoot);
    };

    return {
        name: 'pinoox-dev-state',
        config() {
            return {
                customLogger: createPinooxViteLogger(pluginEnv, options),
            };
        },
        configureServer(server) {
            if (resolveNetworkMode(pluginEnv, options)) {
                server.middlewares.use((req, res, next) => {
                    const origin = req.headers.origin;

                    if (origin) {
                        res.setHeader('Access-Control-Allow-Origin', origin);
                        res.setHeader('Access-Control-Allow-Credentials', 'true');
                        res.setHeader('Vary', 'Origin');
                    } else {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                    }

                    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');

                    if (req.method === 'OPTIONS') {
                        res.statusCode = 204;
                        res.end();

                        return;
                    }

                    next();
                });
            }

            const updateState = () => writeState(server);

            server.httpServer?.once('listening', () => {
                const devUrl = resolveDevServerUrlFromInstance(server, pluginEnv);
                const port = resolveListeningPort(server) ?? server.config.server.port ?? 5173;

                server.config.server.origin = devUrl;

                if (resolveNetworkMode(pluginEnv, options)) {
                    const hostname = resolveVitePublicHostname(pluginEnv);

                    server.config.server.hmr = {
                        ...(typeof server.config.server.hmr === 'object' ? server.config.server.hmr : {}),
                        host: hostname,
                        port,
                        clientPort: port,
                    };
                }

                updateState();
                printPinooxDevBanner(pluginEnv, port);
            });

            if (server.httpServer?.listening) {
                updateState();
            }

            const shutdown = () => {
                cleanup();

                const httpServer = server.httpServer;

                if (httpServer?.listening) {
                    httpServer.close();
                }
            };

            server.httpServer?.once('close', cleanup);
            process.once('SIGINT', shutdown);
            process.once('SIGTERM', shutdown);
            process.once('exit', cleanup);
        },
    };
}

/** @deprecated Use pinooxDevState — kept for legacy import names. */
export const pinooxHot = pinooxDevState;

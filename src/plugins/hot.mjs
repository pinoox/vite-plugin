import fs from 'node:fs';
import path from 'node:path';
import { printPinooxDevBanner } from '../banner.mjs';
import { resolveHotFile } from '../config.mjs';
import {
    mergedEnv,
    resolveDevServerUrlFromInstance,
    resolveNetworkMode,
    resolveListeningPort,
    resolveVitePublicHostname,
} from '../env.mjs';
import { createPinooxViteLogger } from '../logger.mjs';

/**
 * Writes theme/dist/hot (or VITE_HOT_FILE) so PHP ViteHelper injects HMR script tags.
 *
 * @param {{ env?: Record<string, string>, file?: string, quiet?: boolean|string }} [options]
 */
export function pinooxHot(options = {}) {
    const pluginEnv = mergedEnv(options.env ?? {});

    const themeRoot = process.cwd();
    const hotRelative = resolveHotFile(options.env ?? {}, options);
    const hotFilePath = path.isAbsolute(hotRelative)
        ? hotRelative
        : path.join(themeRoot, hotRelative);

    const writeHot = (server) => {
        const devUrl = resolveDevServerUrlFromInstance(server, pluginEnv);
        const port = resolveListeningPort(server) ?? server.config.server.port ?? 5173;

        fs.mkdirSync(path.dirname(hotFilePath), { recursive: true });
        fs.writeFileSync(hotFilePath, devUrl);
        fs.writeFileSync(path.join(path.dirname(hotFilePath), '.vite-dev-port'), String(port));
    };

    const cleanup = () => {
        if (fs.existsSync(hotFilePath)) {
            fs.unlinkSync(hotFilePath);
        }
    };

    return {
        name: 'pinoox-hot-file',
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

            const updateHot = () => writeHot(server);

            server.httpServer?.once('listening', () => {
                if (resolveNetworkMode(pluginEnv, options)) {
                    const hostname = resolveVitePublicHostname(pluginEnv);
                    const port = server.config.server.port ?? 5173;

                    server.config.server.origin = `http://${hostname}:${port}`;
                    server.config.server.hmr = {
                        ...(typeof server.config.server.hmr === 'object' ? server.config.server.hmr : {}),
                        host: hostname,
                        port,
                        clientPort: port,
                    };
                }

                updateHot();
                printPinooxDevBanner(pluginEnv, server.config.server.port ?? 5173);
            });

            if (server.httpServer?.listening) {
                updateHot();
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

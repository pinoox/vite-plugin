import { createLogger } from 'vite';
import { resolveViteQuiet } from './env.mjs';

/**
 * @param {Record<string, string>} env
 * @param {{ quiet?: boolean|string }} [options]
 */
export function createPinooxViteLogger(env = {}, options = {}) {
    const quiet = resolveViteQuiet(env, options);
    const logger = createLogger('warn', { allowClearScreen: false });

    if (!quiet) {
        return logger;
    }

    const shouldSkip = (msg) => {
        const text = String(msg);

        return /^\s*➜\s+(Local|Network):/m.test(text)
            || /^\s*VITE v[\d.]+\s+ready in/m.test(text);
    };

    const info = logger.info.bind(logger);
    logger.info = (msg, opts) => {
        if (shouldSkip(msg)) {
            return;
        }

        info(msg, opts);
    };

    return logger;
}

import { resolveLocalAppUrl, resolveVitePublicHostname } from './env.mjs';

/**
 * @param {Record<string, string>} env
 * @param {number} [port]
 */
export function printPinooxDevBanner(env = {}, port = 5173) {
    if ((env.VITE_DEV_STACK || process.env.VITE_DEV_STACK) === 'true') {
        return;
    }

    const appUrl = env.VITE_SERVER_URL || process.env.VITE_SERVER_URL;

    if (!appUrl) {
        return;
    }

    const network = (env.VITE_DEV_NETWORK || process.env.VITE_DEV_NETWORK) === 'true';
    const serveApp = env.VITE_SERVE_APP || process.env.VITE_SERVE_APP;
    const hmrHost = resolveVitePublicHostname(env);

    console.log('');
    console.log('  \x1b[32m\x1b[1m➜\x1b[0m  \x1b[36m\x1b[1mOpen app\x1b[0m  ' + appUrl);

    if (serveApp) {
        console.log('  \x1b[90mServe App\x1b[0m     ' + serveApp);
    }

    if (network) {
        console.log('  \x1b[90mLocal\x1b[0m         ' + resolveLocalAppUrl(appUrl));
        console.log('  \x1b[90mLAN\x1b[0m           same URL on phone/tablet (same Wi‑Fi)');
    }

    console.log('  \x1b[90mVite HMR\x1b[0m       http://' + hmrHost + ':' + port + ' \x1b[90m(background)\x1b[0m');
    console.log('  \x1b[90mPress Ctrl+C to stop\x1b[0m');
    console.log('');
}

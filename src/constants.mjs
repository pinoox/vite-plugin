/** @typedef {'vue'|'react'|'vite'|string} PinooxStack */

/** @type {Record<string, string[]>} */
export const DEFAULT_ENTRIES = {
    vue: ['src/main.js'],
    react: ['src/main.jsx'],
    vite: ['src/main.js'],
};

/** @type {string[]} */
export const DEFAULT_REFRESH_PATHS = [
    '**/*.twig',
    'partials/**/*.twig',
    'layouts/**/*.twig',
    'views/**/*.twig',
];

export const DEFAULT_HOT_FILE = 'dist/hot';

export const DEFAULT_BUILD_DIR = 'dist';

export const DEFAULT_PHP_ORIGIN = 'http://127.0.0.1:8000';

export const DEFAULT_VITE_PORT = 5173;

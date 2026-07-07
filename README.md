# @pinooxhq/vite-plugin

Vite integration for **Pinoox app themes**: Twig shell on PHP, frontend entry on Vite, HMR and production manifest wired for `vite_tags()` in PHP.

- **npm:** [@pinooxhq/vite-plugin](https://www.npmjs.com/package/@pinooxhq/vite-plugin)
- **GitHub:** [pinoox/vite-plugin](https://github.com/pinoox/vite-plugin)
- **Issues:** [github.com/pinoox/vite-plugin/issues](https://github.com/pinoox/vite-plugin/issues)

## Table of contents

- [How it works](#how-it-works)
- [Install](#install)
- [Theme setup](#theme-setup)
- [Guides by stack](#guides-by-stack)
  - [Vanilla Vite (JavaScript)](#vanilla-vite-javascript)
  - [Vanilla Vite (TypeScript)](#vanilla-vite-typescript)
  - [Vue](#vue)
  - [Vue — advanced theme](#vue--advanced-theme)
  - [React](#react)
  - [Svelte](#svelte)
  - [Inertia](#inertia)
  - [Multiple entries (JS + CSS)](#multiple-entries-js--css)
- [Twig and PHP](#twig-and-php)
- [Development workflow](#development-workflow)
- [Production build](#production-build)
- [Package exports](#package-exports)
- [`pinoox()` API](#pinoox-api)
- [Vue helpers (`/vue`)](#vue-helpers-vue)
- [Environment variables](#environment-variables)
- [Advanced exports](#advanced-exports)
- [Package layout](#package-layout)
- [Releasing (maintainers)](#releasing-maintainers)
- [Requirements](#requirements)

---

## How it works

In dev, Pinoox runs **two servers**:

| Server | Default | Role |
|--------|---------|------|
| PHP | `:8000` | Serves Twig HTML, routes, API |
| Vite | `:5173` | Serves JS/CSS with HMR |

```
Browser → PHP (Twig shell + vite_tags)
              ↓
         dist/hot exists?
         yes → inject Vite client + entry from Vite origin
         no  → inject hashed assets from dist/.vite/manifest.json
```

`pinoox()` connects the theme to PHP:

1. Writes **`dist/hot`** so PHP knows Vite is running.
2. Proxies app routes from Vite to PHP (`VITE_DEV_PROXY`).
3. Full-reloads when **Twig** or **app PHP** changes.
4. Sets **build entries** and **manifest** for production.

Always open the **Open app** URL (PHP origin) during dev — not the raw Vite port.

---

## Install

### From npm (recommended)

In your Pinoox app theme (`apps/{package}/theme/{theme}/`):

```bash
npm install -D @pinooxhq/vite-plugin vite
```

Or add to `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@pinooxhq/vite-plugin": "^1.8.0",
    "vite": "^8.0.0"
  }
}
```

Stack-specific plugins go in the same `devDependencies` block (see [Guides by stack](#guides-by-stack)).

From the Pinoox project root you can also use:

```bash
php pinoox fe com_my_app install --theme=default
```

`fe install` syncs the `@pinooxhq/vite-plugin` version expected by your Pinoox release.

## Theme setup

Every frontend theme needs these pieces:

### 1. `frontend.config.php`

```php
<?php

return [
    'profile' => 'hybrid',           // hybrid | spa (see Pinoox frontend docs)
    'stack' => 'vue',                // vue | react | svelte | inertia | vite
    'entry' => 'src/main.js',
    'manifest' => 'dist/.vite/manifest.json',
    'mount' => '#app',               // DOM selector for SPA/hybrid mount
    'dev' => [
        'port' => 5173,              // unique per theme in platform dev
    ],
];
```

Use `'stack' => 'vite'` for vanilla JS/TS without a UI framework.

### 2. `vite.config.js`

Place at `apps/{package}/theme/{theme}/vite.config.js`. See [Guides by stack](#guides-by-stack).

### 3. Twig shell

`main.twig` — mount point + includes:

```twig
<!doctype html>
<html lang="{{ bootstrap.locale|default(app().lang) }}">
<head>
    {% include 'partials/head.twig' %}
    {% include 'partials/scripts.twig' %}
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

`partials/scripts.twig`:

```twig
{{ pinoox_bootstrap(bootstrap|default({}))|raw }}
{{ vite_tags('src/main.js')|raw }}
```

Add extra entries to `vite_tags()` when you use [multiple inputs](#multiple-entries-js--css):

```twig
{{ vite_tags(['src/main.js', 'src/assets/styles/app.css'])|raw }}
```

### 4. Entry file

Create `src/main.js` (or `.jsx` / `.ts`) and mount your UI on the selector from `frontend.config.php` → `mount`.

---

## Guides by stack

The core plugin **`@pinooxhq/vite-plugin`** is stack-agnostic. Add your framework’s Vite plugin alongside `pinoox()`.

Only Vue-specific helpers live under **`@pinooxhq/vite-plugin/vue`**.

### Vanilla Vite (JavaScript)

**Dependencies:** `vite`, `@pinooxhq/vite-plugin`

**`vite.config.js`:**

```js
import { defineConfig } from 'vite';
import pinoox from '@pinooxhq/vite-plugin';

export default defineConfig({
    plugins: [
        pinoox(['src/main.js']),
    ],
});
```

**`frontend.config.php`:** `'stack' => 'vite'`

**`src/main.js`:**

```js
document.querySelector('#app').innerHTML = `
    <h1>Hello from Pinoox + Vite</h1>
`;
```

**`package.json` scripts:** `"dev": "vite"`, `"build": "vite build"`

---

### Vanilla Vite (TypeScript)

**Dependencies:** add `typescript`

**`vite.config.js`:**

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import pinoox from '@pinooxhq/vite-plugin';

export default defineConfig({
    plugins: [
        pinoox(['src/main.ts']),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
```

**`frontend.config.php`:** `'entry' => 'src/main.ts'`, `'stack' => 'vite'`

**`src/main.ts`:**

```ts
const root = document.querySelector<HTMLElement>('#app');
if (root) {
    root.textContent = 'Hello from TypeScript';
}
```

**Twig:** `{{ vite_tags('src/main.ts')|raw }}`

---

### Vue

**Dependencies:** `vue`, `@vitejs/plugin-vue`, `vite`, `@pinooxhq/vite-plugin`

**`vite.config.js`:**

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import pinoox from '@pinooxhq/vite-plugin';
import { pinooxVueTemplateOptions } from '@pinooxhq/vite-plugin/vue';

export default defineConfig({
    plugins: [
        pinoox(['src/main.js']),
        vue(pinooxVueTemplateOptions()),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
```

**`frontend.config.php`:** `'stack' => 'vue'`, `'mount' => '#app'`

**`src/main.js`:**

```js
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

**Why `pinooxVueTemplateOptions()`?**  
PHP and Vite use different origins in dev. Vue SFC templates with `src="@/assets/logo.png"` must resolve against Vite — this helper sets the correct `transformAssetUrls` for `@vitejs/plugin-vue`. See [Vue helpers](#vue-helpers-vue).

**Optional shorthand** (still requires `@vitejs/plugin-vue` in `package.json`):

```js
import { vue } from '@pinooxhq/vite-plugin/vue';

plugins: [
    pinoox(['src/main.js']),
    vue(),
]
```

Real theme: `apps/com_pinoox_welcome/theme/welcome/`.

---

### Vue — advanced theme

For larger themes: extra CSS entries, Tailwind, auto-import, custom elements, chunk splitting.

**`vite.config.js`** (pattern from `com_pinoox_manager` / spark):

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import pinoox from '@pinooxhq/vite-plugin';
import { pinooxVueTemplateOptions } from '@pinooxhq/vite-plugin/vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        pinoox([
            'src/main.js',
            'src/assets/styles/app-view-error.scss',
        ]),
        vue(pinooxVueTemplateOptions({
            template: {
                compilerOptions: {
                    // Web components used by dockbar — not Vue components
                    isCustomElement: (tag) => tag.startsWith('dock-'),
                },
            },
        })),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        },
    },
});
```

Add other Vite plugins (`babel`, `commonjs`, `unplugin-vue-components`, …) **after** `pinoox()` and `vue()`.

---

### React

**Dependencies:** `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `@pinooxhq/vite-plugin`

Do **not** import `@pinooxhq/vite-plugin/vue` for React themes.

**`vite.config.js`:**

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pinoox from '@pinooxhq/vite-plugin';

export default defineConfig({
    plugins: [
        pinoox(['src/main.jsx']),
        react(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
```

**`frontend.config.php`:**

```php
'stack' => 'react',
'entry' => 'src/main.jsx',
'mount' => '#app',
```

**`src/main.jsx`:**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.querySelector('#app')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
```

**Twig:** `{{ vite_tags('src/main.jsx')|raw }}`

For TypeScript, use `src/main.tsx` and `@vitejs/plugin-react-swc` or `@vitejs/plugin-react` with the same `pinoox(['src/main.tsx'])` pattern.

---

### Svelte

**Dependencies:** `svelte`, `@sveltejs/vite-plugin-svelte`, `vite`, `@pinooxhq/vite-plugin`

Do **not** import `@pinooxhq/vite-plugin/vue` for Svelte themes.

**`vite.config.js`:**

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import pinoox from '@pinooxhq/vite-plugin';

export default defineConfig({
    plugins: [
        pinoox(['src/main.js']),
        svelte(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
```

**`frontend.config.php`:**

```php
'stack' => 'svelte',
'entry' => 'src/main.js',
'mount' => '#app',
```

**`src/main.js`:**

```js
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.querySelector('#app') });
```

**`src/App.svelte`:**

```svelte
<script>
    let name = 'Pinoox';
</script>

<h1>Hello from {name} + Svelte</h1>
```

**Twig:** `{{ vite_tags('src/main.js')|raw }}`

For TypeScript, rename entry to `src/main.ts`, enable `"lang": "ts"` in `svelte.config.js` if needed, and point `frontend.config.php` → `entry` at `src/main.ts`.

---

### Inertia

[Inertia.js](https://inertiajs.com/) keeps server-side routing in PHP while the UI is a Vue, React, or Svelte SPA driven by page props — no client-side router.

`pinoox()` handles the same hot file, proxy, and manifest wiring as other stacks. Wire Inertia’s PHP adapter in your app (Controller responses, middleware, root template) separately; this section covers the **Vite + client** side.

#### Inertia + Vue

**Dependencies:** `vue`, `@vitejs/plugin-vue`, `@inertiajs/vue3`, `vite`, `@pinooxhq/vite-plugin`

**`vite.config.js`:**

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import pinoox from '@pinooxhq/vite-plugin';
import { pinooxVueTemplateOptions } from '@pinooxhq/vite-plugin/vue';

export default defineConfig({
    plugins: [
        pinoox(['src/app.js']),
        vue(pinooxVueTemplateOptions()),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
```

**`frontend.config.php`:**

```php
'profile' => 'spa',              // or hybrid if Twig wraps some pages
'stack' => 'inertia',
'entry' => 'src/app.js',
'mount' => '#app',
```

**`src/app.js`:**

```js
import { createInertiaApp } from '@inertiajs/vue3';
import { createApp, h } from 'vue';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });

        return pages[`./Pages/${name}.vue`];
    },
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .mount(el);
    },
});
```

**`src/Pages/Home.vue`:**

```vue
<script setup>
defineProps({ message: String });
</script>

<template>
    <h1>{{ message }}</h1>
</template>
```

**Twig root** (`main.twig`) — Inertia needs the serialized page on the mount element:

```twig
<!doctype html>
<html>
<head>
    {% include 'partials/head.twig' %}
    {{ vite_tags('src/app.js')|raw }}
</head>
<body>
    <div id="app" data-page="{{ page|json_encode|e('html_attr') }}"></div>
</body>
</html>
```

Pass `page` from the controller as the Inertia JSON payload (via your Inertia PHP adapter).

**Controller (conceptual):**

```php
// Return an Inertia page response — exact API depends on your Inertia PHP package
return inertia('Home', ['message' => 'Hello from Inertia']);
```

#### Inertia + React

Swap the Vue plugins for `@vitejs/plugin-react` and `@inertiajs/react`. Entry stays `src/app.jsx`:

```js
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
```

#### Inertia + Svelte

Use `@inertiajs/svelte` and `@sveltejs/vite-plugin-svelte` alongside `pinoox(['src/app.js'])`:

```js
import { createInertiaApp } from '@inertiajs/svelte';
import { mount } from 'svelte';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.svelte', { eager: true });

        return pages[`./Pages/${name}.svelte`];
    },
    setup({ el, App, props }) {
        mount(App, { target: el, props });
    },
});
```

In dev, open the **PHP origin** (same as other stacks) so Inertia receives full page responses from your routes; Vite still serves JS/CSS with HMR via `dist/hot`.

---

### Multiple entries (JS + CSS)

Some pages need a **standalone stylesheet** built alongside the JS entry (error pages, print styles, admin overlays).

**`vite.config.js`:**

```js
pinoox([
    'src/main.js',
    'src/assets/styles/app-view-error.scss',
])
```

**Twig** — list every entry PHP should load:

```twig
{{ vite_tags(['src/main.js', 'src/assets/styles/app-view-error.scss'])|raw }}
```

In dev, Vite serves both; in production, both appear in `dist/.vite/manifest.json`.

---

## Twig and PHP

| Piece | Role |
|-------|------|
| `pinoox_bootstrap()` | `window.__PINOOX__` — URLs, locale, page props from controller |
| `vite_tags('src/main.js')` | Dev: Vite HMR scripts when `dist/hot` exists; prod: hashed `<script>` / `<link>` from manifest |
| `frontend.config.php` | Stack, entry path, manifest path, dev port |
| `php pinoox fe dev` | Installs/syncs deps, sets env, starts PHP + Vite |

**Single-app dev** — app at PHP root:

```bash
php pinoox fe dev com_pinoox_welcome
# Open app → http://127.0.0.1:8000
```

**Platform dev** — multiple apps, router paths:

```bash
php pinoox fe dev:apps --apps=auto --serve-app=platform
# Open app → http://127.0.0.1:8000/manager, /, …
```

Assign a **unique `dev.port`** per theme in `frontend.config.php` when running platform dev.

---

## Development workflow

```bash
# Recommended — one command (PHP + Vite + env)
php pinoox fe dev com_my_app

# Platform stack
php pinoox fe dev:apps --apps=auto --serve-app=platform

# Manual (two terminals)
php pinoox serve --app=com_my_app
cd apps/com_my_app/theme/default && npm run dev
```

What happens when `fe dev` runs:

1. Syncs `@pinooxhq/vite-plugin` version in theme `package.json`.
2. Sets `VITE_*` env vars (PHP URL, port, proxy, refresh globs).
3. Removes stale `dist/hot` before starting Vite.
4. Starts Vite in the theme folder and PHP with the correct app binding.

Edit **Twig** → full page reload. Edit **Vue/JS/CSS** → HMR. Edit **PHP** (`Controller/`, `routes/`, …) → full reload via `VITE_DEV_REFRESH`.

---

## Production build

```bash
php pinoox fe com_my_app build --theme=default
# or:
cd apps/com_my_app/theme/default && npm run build
```

Output:

- `dist/.vite/manifest.json` — used by `vite_tags()` in production
- Hashed assets under `dist/assets/`
- No `dist/hot` — PHP serves built files only

Deploy the theme `dist/` folder with your app; ensure `frontend.config.php` → `manifest` matches the build output path.

---

## Package exports

| Import | Purpose |
|--------|---------|
| `@pinooxhq/vite-plugin` | `pinoox()` — hot file, dev proxy, Twig/PHP refresh, build entries |
| `@pinooxhq/vite-plugin/vue` | Vue-only: `pinooxVueTemplateOptions()`, optional `vue()` wrapper |

---

## `pinoox()` API

`pinoox()` accepts a string, an array of entry paths, or a config object:

```js
// one entry
pinoox('src/main.js')

// multiple entries
pinoox(['src/main.js', 'src/assets/styles/app.css'])

// full config
pinoox({
    entries: ['src/main.js'],
    refresh: true,              // true | false | string[] (Twig globs)
    hotFile: 'dist/hot',
    env: { VITE_DEV_PORT: '5174' },
    build: {
        rollupOptions: { /* merged into Vite build */ },
    },
    server: { /* merged into Vite dev server */ },
})
```

### What `pinoox()` sets up

| Feature | Description |
|---------|-------------|
| **Build entries** | `build.rollupOptions.input` from your paths |
| **Manifest** | `build.manifest: true` → `dist/.vite/manifest.json` for PHP |
| **Hot file** | Writes `dist/hot` (or `VITE_HOT_FILE`) so PHP injects HMR scripts |
| **Dev proxy** | Forwards app routes to PHP (`VITE_SERVER_URL`, `VITE_DEV_PROXY`) |
| **Twig refresh** | Full reload when `*.twig` under the theme changes |
| **PHP refresh** | Full reload when app PHP changes via `VITE_DEV_REFRESH` from `fe dev` |
| **Dev assets** | Rewrites `/src/`, `/node_modules/`, … to the Vite origin in dev |

`base` defaults to `./` when not set in your Vite config.

---

## Vue helpers (`/vue`)

Import only for Vue themes:

```js
import { pinooxVueTemplateOptions, vue } from '@pinooxhq/vite-plugin/vue';
```

**Explicit (recommended for custom compiler options):**

```js
import vue from '@vitejs/plugin-vue';
import { pinooxVueTemplateOptions } from '@pinooxhq/vite-plugin/vue';

vue(pinooxVueTemplateOptions({
    template: {
        compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('dock-'),
        },
    },
}))
```

**Shorthand:**

```js
import { vue } from '@pinooxhq/vite-plugin/vue';

vue({ template: { compilerOptions: { /* … */ } } })
```

Keep `@vitejs/plugin-vue` in `package.json` for either approach.

---

## Environment variables

`php pinoox fe dev` injects these into the theme npm process (no manual `.env` required):

| Variable | Purpose |
|----------|---------|
| `VITE_SERVER_URL` | PHP app URL shown as **Open app** |
| `VITE_HOT_FILE` | Hot file path (default `dist/hot`) |
| `VITE_DEV_PORT` | Vite port |
| `VITE_DEV_SERVER` | Vite public URL |
| `VITE_DEV_PROXY` | Comma-separated path prefixes proxied to PHP |
| `VITE_DEV_REFRESH` | Comma-separated globs for PHP/backend full reload |
| `VITE_DEV_STACK` | Set when running multi-app platform dev |
| `VITE_SERVE_APP` | `platform` or app package during dev |

Theme `.env` can override values when needed; `fe dev` force-keys win for ports and URLs during stack dev.

---

## Advanced exports

Lower-level pieces for custom or legacy wiring:

```js
import {
    pinooxHot,
    pinooxServer,
    pinooxDevAssets,
    pinooxRefresh,
    composePinooxPlugins,
    createPinooxViteConfig,
} from '@pinooxhq/vite-plugin';
```

**Factory stub** — stack defaults from `DEFAULT_ENTRIES`:

```js
import { defineConfig, loadEnv } from 'vite';
import { createPinooxViteConfig } from '@pinooxhq/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { pinooxVueTemplateOptions } from '@pinooxhq/vite-plugin/vue';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return createPinooxViteConfig({
        env,
        stack: 'vue',                    // vue | react | svelte | inertia | vite
        entries: ['src/main.js'],
        plugins: [
            vue(pinooxVueTemplateOptions()),
        ],
    });
});
```

**Legacy explicit wiring** (prefer `pinoox([...])` for new themes):

```js
import pinooxHot, { pinooxDevAssets, pinooxRefresh, pinooxServer } from '@pinooxhq/vite-plugin';
```

---

## Package layout

```
packages/vite-plugin/
├── .github/workflows/
│   ├── ci.yml               # pack check + import smoke test on push/PR
│   └── publish.yml          # npm publish on tag (Trusted Publisher)
├── index.mjs                # @pinooxhq/vite-plugin
├── vue.mjs                  # @pinooxhq/vite-plugin/vue
├── LICENSE
├── package.json
└── src/
    ├── index.mjs            # pinoox() + public API
    ├── compose.mjs          # bundles hot, dev-assets, refresh, config
    ├── config.mjs           # entries, hot file, config normalization
    ├── constants.mjs        # defaults (entries per stack, refresh globs)
    ├── env.mjs              # VITE_* helpers
    ├── server.mjs           # dev-server proxy + merge
    ├── refresh.mjs          # Twig / backend full-reload
    ├── factory.mjs          # createPinooxViteConfig()
    ├── logger.mjs           # quiet Vite logger
    ├── banner.mjs           # fe dev terminal banner
    ├── vue.mjs              # pinooxVueTemplateOptions, vue()
    └── plugins/
        ├── pinoox.mjs       # build + server config hook
        ├── hot.mjs          # dist/hot file
        └── dev-assets.mjs   # dev URL rewrite
```

Default entries per stack (`constants.mjs`):

| Stack | Default entry |
|-------|----------------|
| `vue` | `src/main.js` |
| `react` | `src/main.jsx` |
| `svelte` | `src/main.js` |
| `inertia` | `src/app.js` |
| `vite` | `src/main.js` |

`svelte` and `inertia` defaults are conventional — set `entries` explicitly in `vite.config.js` when your paths differ.

---

## Releasing (maintainers)

This package is developed in the [pinoox/vite-plugin](https://github.com/pinoox/vite-plugin) repository and published to the [@pinooxhq](https://www.npmjs.com/org/pinooxhq) npm org.

### CI

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | push / PR to `main` | `npm run pack:check`, smoke-test tarball imports |
| `publish.yml` | tag `v*` (e.g. `v1.8.0`) | verifies tag ↔ `package.json` version, publishes to npm |

Publishing uses **npm Trusted Publisher** (GitHub Actions OIDC) — no `NPM_TOKEN` secret.

Trusted Publisher settings on npm:

| Field | Value |
|-------|-------|
| Publisher | GitHub Actions |
| Organization or user | `pinoox` |
| Repository | `vite-plugin` |
| Workflow filename | `publish.yml` |
| Environment name | `npm` |
| Allowed actions | Publish |

Create a matching **GitHub Environment** named `npm` in the repository (Settings → Environments).

### Release steps

1. Bump `"version"` in `package.json` (semver: fix → patch, feat → minor, breaking → major).
2. Commit and push to `main`.
3. Tag and push:

```bash
git tag v1.8.0
git push origin v1.8.0
```

4. GitHub Actions runs `publish.yml` and publishes `@pinooxhq/vite-plugin@1.8.0` with provenance.

Local sanity check before tagging:

```bash
npm run pack:check
```

---

## Requirements

- Node.js **>= 18** (`engines` in `package.json`)
- `"type": "module"` in theme `package.json` recommended
- `vite` ^5 || ^6 || ^7 || ^8
- `@vitejs/plugin-vue` ^5 || ^6 (optional; required for Vue themes)

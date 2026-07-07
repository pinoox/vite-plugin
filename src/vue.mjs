import { createRequire } from 'node:module';
import { join } from 'node:path';

/**
 * Vue SFC options so @/ assets resolve to the Vite dev server (not the PHP origin).
 *
 * @param {Record<string, unknown>} [extra]
 */
export function pinooxVueTemplateOptions(extra = {}) {
    const { template: extraTemplate, ...rest } = extra;

    return {
        ...rest,
        template: {
            transformAssetUrls: {
                base: null,
                includeAbsolute: false,
            },
            ...(extraTemplate ?? {}),
        },
    };
}

/**
 * @vitejs/plugin-vue with Pinoox template defaults — use instead of vue(pinooxVueTemplateOptions()).
 *
 * @param {Record<string, unknown>} [extra]
 * @returns {import('vite').PluginOption}
 */
export function vue(extra = {}) {
    const themeRequire = createRequire(join(process.cwd(), 'package.json'));
    const viteVue = themeRequire('@vitejs/plugin-vue').default;

    return viteVue(pinooxVueTemplateOptions(extra));
}

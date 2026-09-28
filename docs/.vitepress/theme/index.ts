import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';

import './style.css';

import CopyCode from './CopyCode.vue';

/**
 * Тема по умолчанию с цветами amo (`style.css`), компонент вкладок `:::tabs` и `<CopyCode>` —
 * адрес, который копируется по клику.
 * VitePress берёт тему только из экспорта по умолчанию.
 */
export default {
  extends: DefaultTheme,
  enhanceApp: ({ app }) => {
    enhanceAppWithTabs(app);
    app.component('CopyCode', CopyCode);
  },
} satisfies Theme;

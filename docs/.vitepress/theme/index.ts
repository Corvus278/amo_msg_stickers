import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';

import './style.css';

/**
 * Тема по умолчанию с цветами amo (`style.css`) плюс компонент вкладок `:::tabs`.
 * VitePress берёт тему только из экспорта по умолчанию.
 */
export default {
  extends: DefaultTheme,
  enhanceApp: ({ app }) => {
    enhanceAppWithTabs(app);
  },
} satisfies Theme;

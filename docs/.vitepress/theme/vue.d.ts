declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  /**
   * Однофайловый компонент темы: его типы проверяет сборка VitePress, а не tsc.
   */
  const component: DefineComponent;

  export default component;
}

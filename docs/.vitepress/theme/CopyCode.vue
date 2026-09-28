<script setup lang="ts">
import { useData } from 'vitepress';
import { computed, ref } from 'vue';

/**
 * Адрес, который страница сайта открыть не может, — `chrome://`, `edge://` и т. п.:
 * браузер блокирует переход на них по ссылке. Поэтому вместо ссылки — копирование по клику,
 * а открыть адрес читатель вставкой в адресную строку.
 */
const props = defineProps<{
  /**
   * Текст для показа и копирования.
   */
  text: string;
}>();

/**
 * Сколько держится отметка «Скопировано» после клика.
 */
const COPIED_MS = 1500;

/**
 * Подписи на языке страницы. Английский — по началу тега `en`, любой другой язык —
 * русский, как выбирает язык интерфейс amo stickers.
 */
const LABELS = {
  ru: { copy: 'Скопировать', copied: 'Скопировано' },
  en: { copy: 'Copy', copied: 'Copied' },
};

/**
 * Основной тег `en` без учёта регистра и региона: `en`, `en-US`, `en-GB`.
 */
const EN_TAG = /^en(?:-|$)/i;

const { lang } = useData();
const labels = computed(() => {
  return EN_TAG.test(lang.value) ? LABELS.en : LABELS.ru;
});

const isCopied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

const handleClick = async () => {
  try {
    await navigator.clipboard.writeText(props.text);
  } catch {
    /**
     * Без доступа к буферу (старый браузер, запрет прав) текст всё равно виден и
     * выделяется вручную — отметку не показываем, чтобы не обмануть.
     */
    return;
  }

  isCopied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    isCopied.value = false;
  }, COPIED_MS);
};
</script>

<template>
  <button
    type="button"
    class="copy-code"
    :title="`${labels.copy} ${text}`"
    @click="handleClick"
  >
    <code>{{ text }}</code>
    <span class="copy-code__status" aria-live="polite">{{
      isCopied ? labels.copied : ''
    }}</span>
  </button>
</template>

<style scoped>
.copy-code {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: copy;
}

.copy-code:hover code {
  color: var(--vp-c-brand-1);
}

.copy-code__status {
  color: var(--vp-c-text-2);
  font-size: 0.85em;
}
</style>

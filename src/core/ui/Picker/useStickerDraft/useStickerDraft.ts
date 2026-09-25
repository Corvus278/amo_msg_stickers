import { useCallback, useEffect, useState } from 'preact/hooks';

import { captionDecorator, detectKind, toStickerGif } from '../../../convert';
import { CUSTOM_PACK_ID, putSticker, uid } from '../../../db';
import { errorMessage } from '../PickerProvider/errorMessage';
import { usePicker } from '../PickerProvider/usePicker';
import { usePickerView } from '../usePickerView/usePickerView';

import type { StickerDraft, StickerDraftState } from './useStickerDraft.types';

const CAPTION_DEBOUNCE_MS = 500;
const BYTES_IN_KB = 1024;

/**
 * Черновик своего стикера: исходный файл, подпись и собранный из них GIF с превью.
 *
 * Пока идёт пересборка, на экране остаётся прежнее превью, а сохранение недоступно.
 * Результат пересборки, которую обогнала следующая (новый файл, новая подпись) или
 * размонтирование формы, отбрасывается, и URL для него не создаётся. При ошибке
 * конвертации превью убирается: сохранять нечего.
 *
 * Object URL превью отзывается, как только черновик заменён, сброшен ошибкой или форма
 * размонтирована, — блоб прежнего GIF в памяти не остаётся.
 *
 * @returns черновик, выбор файла, смена подписи и сохранение
 */
export const useStickerDraft = (): StickerDraftState => {
  const { refreshPacks, showStatus, showError } = usePicker();
  const { switchTo } = usePickerView();
  const [source, setSource] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [draft, setDraft] = useState<StickerDraft | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCaptionText(caption.trim());
    }, CAPTION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [caption]);

  useEffect(() => {
    if (!source) return;
    let isStale = false;

    const convert = async () => {
      setIsConverting(true);
      showStatus('Конвертирую…');

      try {
        const gif = await toStickerGif(source, detectKind(source, source.name), {
          decorate: captionText ? captionDecorator(captionText) : undefined,
        });

        if (isStale) return;
        const { blob, width, height } = gif;

        setDraft({ gif, url: URL.createObjectURL(blob) });
        showStatus(`${width}×${height}, ${Math.round(blob.size / BYTES_IN_KB)} КБ`);
      } catch (error) {
        if (isStale) return;
        setDraft(null);
        showError(`Не получилось: ${errorMessage(error)}`);
      } finally {
        if (!isStale) setIsConverting(false);
      }
    };

    void convert();

    return () => {
      isStale = true;
    };
  }, [source, captionText, showStatus, showError]);

  useEffect(() => {
    if (!draft) return;
    const { url } = draft;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [draft]);

  const pickFile = useCallback((file: File | undefined) => {
    if (file) setSource(file);
  }, []);

  const changeCaption = useCallback((nextCaption: string) => {
    setCaption(nextCaption);
  }, []);

  const save = useCallback(async () => {
    if (!draft || isConverting) return;
    const { blob, width, height } = draft.gif;

    try {
      await putSticker({
        id: uid(),
        packId: CUSTOM_PACK_ID,
        blob,
        width,
        height,
        createdAt: Date.now(),
      });
      await refreshPacks();
      switchTo({ kind: 'pack', packId: CUSTOM_PACK_ID });
    } catch (error) {
      showError(errorMessage(error));
    }
  }, [draft, isConverting, refreshPacks, switchTo, showError]);

  return {
    fileName: source?.name || null,
    caption,
    previewUrl: draft?.url || null,
    isSavable: !!draft && !isConverting,
    pickFile,
    changeCaption,
    save,
  };
};

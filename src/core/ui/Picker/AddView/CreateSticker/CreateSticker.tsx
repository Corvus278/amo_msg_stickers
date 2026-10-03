import type { FunctionComponent as FC } from 'preact';

import { t } from '../../../../i18n/translate';
import { Button } from '../../Button/Button';
import { TextInput } from '../../TextInput/TextInput';
import { useStickerDraft } from '../../useStickerDraft/useStickerDraft';

import { DropZone } from './DropZone/DropZone';
import { StickerPreview } from './StickerPreview/StickerPreview';

/**
 * Форма своего стикера. Возвращает фрагмент, а не обёртку: заголовок, зона загрузки,
 * подпись, превью и кнопка — строки общей формы вкладки «Добавить стикеры» с её
 * отступами.
 */
export const CreateSticker: FC = () => {
  const { fileName, caption, previewUrl, isSavable, pickFile, changeCaption, save } =
    useStickerDraft();

  const handleZonePick = (file: File | undefined) => {
    pickFile(file);
  };

  const handleCaptionInput = (value: string) => {
    changeCaption(value);
  };

  const handleSaveClick = () => {
    void save();
  };

  return (
    <>
      <h3 className="mt-1.5 text-xsm font-bold">{t('add.custom.title')}</h3>

      <DropZone fileName={fileName} onPick={handleZonePick} />

      <TextInput
        type="text"
        value={caption}
        placeholder={t('add.custom.caption')}
        onInput={handleCaptionInput}
      />

      {previewUrl && <StickerPreview url={previewUrl} />}

      <div className="flex items-center gap-1.5">
        <Button variant="primary" isDisabled={!isSavable} onClick={handleSaveClick}>
          {t('add.custom.save')}
        </Button>
      </div>
    </>
  );
};

/**
 * Поток из кусков заданных размеров — чтобы проверить чтение с лимитом посреди потока.
 *
 * @param sizes — размеры кусков в байтах, по порядку
 * @param onCancel — колбэк на отмену потока читателем
 * @returns поток байтов
 */
export const chunkedStream = (sizes: number[], onCancel?: () => void) => {
  const queue = [...sizes];

  return new ReadableStream<Uint8Array>({
    pull: (controller) => {
      const size = queue.shift();

      if (size === undefined) {
        controller.close();

        return;
      }

      controller.enqueue(new Uint8Array(size));
    },
    cancel: () => {
      onCancel?.();
    },
  });
};

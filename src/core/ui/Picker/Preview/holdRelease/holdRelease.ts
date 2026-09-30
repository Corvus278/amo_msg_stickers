/**
 * Событие отпускания указателя, которое завершает удержание.
 */
const RELEASE_EVENTS = ['pointerup', 'pointercancel'] as const;

/**
 * Отпускание удержания: `pointerup` и `pointercancel` зовут `onRelease`, а следующий за
 * отпусканием `click` гасится — иначе отпущенная над ячейкой кнопка отправила бы стикер, на
 * котором только что держали предпросмотр.
 *
 * Слушатели висят на цели, а не на ячейке: ячейка под виртуализацией может размонтироваться, а
 * курсор — уйти из панели, отпускание всё равно доходит. Гасится ровно один `click` в фазе
 * перехвата; слушатель снимается и по таймеру (`setTimeout(0)`), потому что браузер не шлёт
 * `click`, если отпускание пришлось не на цель нажатия.
 *
 * @param target — цель слушателей, в пикере `window`
 * @param onRelease — колбэк на отпускание
 * @returns снятие слушателей отпускания; уже взведённое гашение `click` доживает до своего
 * таймера
 */
export const watchHoldRelease = (target: EventTarget, onRelease: () => void) => {
  const controller = new AbortController();
  const { signal } = controller;

  const armClickSwallow = () => {
    const clickController = new AbortController();

    /**
     * `stopImmediatePropagation`, а не `stopPropagation`: гасимый `click` не должен дойти и
     * до других слушателей той же цели.
     */
    target.addEventListener(
      'click',
      (event) => {
        event.stopImmediatePropagation();
        event.preventDefault();
        clickController.abort();
      },
      { capture: true, signal: clickController.signal }
    );

    setTimeout(() => {
      clickController.abort();
    }, 0);
  };

  const handleRelease = () => {
    controller.abort();
    armClickSwallow();
    onRelease();
  };

  for (const type of RELEASE_EVENTS) {
    target.addEventListener(type, handleRelease, { signal });
  }

  return () => {
    controller.abort();
  };
};

# Firefox

В Firefox amo stickers ставится как userscript: скрипт, который запускает менеджер скриптов. Расширения amo stickers
для Firefox нет.

**Установите Tampermonkey.** Tampermonkey — менеджер скриптов, amo stickers проверяется в нём. Поставьте его из
каталога дополнений Firefox: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/). Firefox покажет,
какие разрешения нужны менеджеру, в том числе доступ к данным на сайтах, — без него менеджер не запустит скрипт.

<!--@include: ../_parts/userscript.md-->

::: info Violentmonkey — без гарантий
Скрипт может работать и в менеджере [Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/), но этот
способ не проверяется. Если в Violentmonkey что-то не работает, поставьте Tampermonkey по шагам выше.
:::

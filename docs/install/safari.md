# Safari

В Safari на Mac amo stickers можно поставить как userscript через бесплатное приложение Userscripts.

::: warning Без гарантий
Этот способ не проверяется: скрипт может работать, но может и нет. Проверенный способ — браузер на Chromium
([Chrome, Яндекс Браузер, Edge, Opera](./chromium)) или [Firefox](./firefox): там amo stickers ставится расширением
или userscript в Tampermonkey.
:::

::: warning Где хранятся ключи
Userscripts может хранить настройки не у себя, а в хранилище сайта amo. Тогда ключи GIF и токен бота доступны
скриптам страницы amo. Если это важно, поставьте amo stickers проверенным способом — ссылки выше.
:::

**Установите Userscripts.**

1. Поставьте приложение [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) из App Store и откройте его
   один раз.
2. В Safari откройте «Настройки» → «Расширения» и включите Userscripts.
3. Откройте amo, нажмите значок Userscripts на панели Safari и разрешите расширению работать на этом сайте.

<!-- скрин: img/install/safari-userscripts.png — Safari на странице amo: значок Userscripts на панели и разрешение для сайта -->

<!--@include: ../_parts/userscript.md-->

# Firefox

In Firefox, amo stickers is installed as a userscript: a script run by a script manager. There is no amo stickers
extension for Firefox.

**Install Tampermonkey.** Tampermonkey is a script manager, and amo stickers is tested in it. Install it from Firefox
Add-ons: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/). Firefox will show which permissions the
manager needs, including access to site data — without it the manager can’t run the script.

<!--@include: ../../_parts/en/userscript.md-->

::: info Violentmonkey — no guarantees
The script may also work in the [Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/) manager, but
this way isn’t tested. If something doesn’t work in Violentmonkey, install Tampermonkey following the steps above.
:::

import { describe, expect, it } from 'vitest';

import { packLink, TG_STICKERS_LINK_PREFIX } from '../src/core/packLink';

describe('packLink', () => {
  it('у пака Telegram с именем набора — ссылка на добавление', () => {
    expect(packLink({ source: 'telegram', sourceRef: 'Gachi_Pack' })).toBe(
      'https://t.me/addstickers/Gachi_Pack'
    );
  });

  it('префикс — адрес ссылки добавления набора', () => {
    expect(TG_STICKERS_LINK_PREFIX).toBe('https://t.me/addstickers/');
  });

  it('пак Telegram без имени набора ссылки не имеет', () => {
    expect(packLink({ source: 'telegram' })).toBeNull();
    expect(packLink({ source: 'telegram', sourceRef: '' })).toBeNull();
  });

  it('свой пак ссылки не имеет, даже если в записи есть имя', () => {
    expect(packLink({ source: 'custom' })).toBeNull();
    expect(packLink({ source: 'custom', sourceRef: 'Name' })).toBeNull();
  });

  it.each(['na me', 'имя', 'a/b', 'a?b=1', '../x', 'x#y'])(
    'имя %j вне [A-Za-z0-9_] ссылку не даёт',
    (sourceRef) => {
      expect(packLink({ source: 'telegram', sourceRef })).toBeNull();
    }
  );
});

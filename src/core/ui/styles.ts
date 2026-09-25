/**
 * Цвета повторяют палитру amo: в CSS-переменные она на странице не вынесена, поэтому
 * значения скопированы. Геометрия и анимация повторяют попап эмодзи.
 */
export const PICKER_CSS = /* css */ `
:host {
  --bg: #fff;
  --text: #363b44;
  --muted: #94a5b2;
  --accent: #3c72fe;
  --hover: rgba(148, 165, 178, 0.14);
  --border: rgba(148, 165, 178, 0.28);
  --danger: #e5484d;
  --input-bg: rgba(148, 165, 178, 0.12);
  all: initial;
}
:host([data-theme='dark']) {
  --bg: #303030;
  --text: #e7e7e7;
  --muted: #909090;
  --accent: #ecc498;
  --hover: rgba(255, 255, 255, 0.07);
  --border: rgba(255, 255, 255, 0.1);
  --input-bg: rgba(255, 255, 255, 0.06);
}

* { box-sizing: border-box; }

.panel {
  position: fixed;
  bottom: 38px;
  right: 30px;
  z-index: 2;
  width: 352px;
  height: 400px;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  border-radius: 10px;
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--border);
  font: 13px/1.3 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
  animation: open 0.2s linear;
}
.panel[hidden] { display: none; }
@keyframes open {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.head { padding: 10px 10px 6px; display: flex; flex-direction: column; gap: 6px; }
.head-row { display: flex; align-items: center; gap: 8px; min-height: 22px; }
.title { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

input[type='text'], input[type='search'], input[type='password'] {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  outline: none;
  background: var(--input-bg);
  color: var(--text);
  font: inherit;
}
input::placeholder { color: var(--muted); }

.chips { display: flex; gap: 4px; flex-wrap: wrap; }
.chip {
  border: 0; border-radius: 12px; padding: 3px 9px; cursor: pointer;
  background: var(--input-bg); color: var(--muted); font: inherit; font-size: 12px;
}
.chip[aria-pressed='true'] { background: var(--accent); color: var(--bg); }

.body { flex: 1; overflow-y: auto; padding: 0 8px 8px; scrollbar-width: thin; }

.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.masonry { columns: 2; column-gap: 4px; }
.masonry .cell { break-inside: avoid; margin-bottom: 4px; aspect-ratio: auto; }

.cell {
  position: relative;
  aspect-ratio: 1;
  border: 0;
  padding: 4px;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: background 0.175s;
}
.cell:hover { background: var(--hover); }
.cell img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; pointer-events: none; }
.masonry .cell { padding: 0; overflow: hidden; background: var(--input-bg); }
.masonry .cell img { width: 100%; max-height: none; object-fit: cover; }
.cell.busy { opacity: 0.4; pointer-events: none; }

.del {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  border-radius: 50%; border: 0; cursor: pointer; display: none;
  background: var(--bg); color: var(--muted); font-size: 13px; line-height: 18px; padding: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.cell:hover .del { display: block; }
.del:hover { color: var(--danger); }

.tabs {
  display: flex; align-items: center; gap: 2px; padding: 4px 6px;
  border-top: 1px solid var(--border); overflow-x: auto; scrollbar-width: none;
  flex-shrink: 0;
}
.tab {
  flex-shrink: 0; width: 34px; height: 34px; border: 0; border-radius: 8px; padding: 4px;
  background: transparent; cursor: pointer; color: var(--muted);
  display: flex; align-items: center; justify-content: center;
  font: 600 11px/1 'Helvetica Neue', Arial, sans-serif;
}
.tab:hover { background: var(--hover); }
.tab[aria-selected='true'] { color: var(--accent); background: var(--hover); }
.tab img { width: 26px; height: 26px; object-fit: contain; }
.tab svg { width: 18px; height: 18px; fill: currentColor; }
.spacer { flex: 1; }

.empty { color: var(--muted); text-align: center; padding: 40px 16px; line-height: 1.5; }
.empty a, .form a { color: var(--accent); }

.status {
  padding: 6px 10px; font-size: 12px; color: var(--muted);
  border-top: 1px solid var(--border); flex-shrink: 0;
}
.status.error { color: var(--danger); }
.status[hidden] { display: none; }

.form { display: flex; flex-direction: column; gap: 8px; padding: 4px 2px 12px; }
.form h3 { margin: 6px 0 0; font-size: 13px; }
.form p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.4; }
.form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
.row { display: flex; gap: 6px; align-items: center; }
.btn {
  height: 32px; padding: 0 14px; border: 0; border-radius: 8px; cursor: pointer; flex-shrink: 0;
  background: var(--accent); color: var(--bg); font: 600 13px 'Helvetica Neue', Arial, sans-serif;
}
.btn.ghost { background: var(--input-bg); color: var(--text); }
.btn.danger { background: transparent; color: var(--danger); padding: 0 6px; height: 22px; font-weight: 400; font-size: 12px; }
.btn:disabled { opacity: 0.5; cursor: default; }
.drop {
  border: 1.5px dashed var(--border); border-radius: 10px; padding: 16px; text-align: center;
  color: var(--muted); cursor: pointer; position: relative;
}
.drop.over { border-color: var(--accent); color: var(--accent); }
.drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.preview { display: flex; justify-content: center; padding: 6px; border-radius: 10px;
  background: repeating-conic-gradient(var(--input-bg) 0 25%, transparent 0 50%) 0 0 / 16px 16px; }
.preview img { max-width: 160px; max-height: 160px; }
.progress { height: 4px; border-radius: 2px; background: var(--input-bg); overflow: hidden; }
.progress > i { display: block; height: 100%; background: var(--accent); transition: width .2s; }
.attr { color: var(--muted); font-size: 10px; text-align: right; padding: 4px 2px 0; }
`;

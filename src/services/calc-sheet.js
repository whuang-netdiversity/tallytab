// /src/services/calc-sheet.js
// Reusable F7 sheet-modal calculator
// Assumes: global $ = Dom7, global f7 = Framework7 app instance
import { getBill, setBill } from '@/app/bill';

let mounted = false;

const state = {
    targetEl: null,
    decimals: 2,
    mode: 'currency',  // 'currency' | 'percent'
    prefix: '$',
    suffix: '',
    onApply: null
};

/**
 * Formatting
 * @param {*} n 
 * @param {*} d 
 * @returns 
 */
function fmt(n, d = 2) {
    const x = Math.max(0, Number(n) || 0);
    return x.toFixed(d);
}

/**
 * Num string
 * @param {*} s 
 * @returns 
 */
function toNumStr(s) {
    return String(s || '').replace(/[^\d.]/g, '');
}

/**
 * Num from ele
 * @param {*} el 
 * @returns 
 */
function getNumberFromEl(el) {
    if (!el) return 0;
    // strip everything except digits, dot, comma, then normalize comma -> dot
    const txt = (el.textContent || '').replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    const n = Number(txt);
    return isFinite(n) ? n : 0;
}

/**
 * Set display
 * @param {*} n 
 */
function setDisplay(n) {
    $('#tt-calc-val').text(fmt(n, state.decimals));
}

/**
 * Set prefix
 * @param {*} p 
 */
function setPrefix(p) {
    $('#tt-calc-prefix').text(p || '');
}

/**
 * Set suffix
 * @param {*} s 
 */
function setSuffix(s) {
    $('#tt-calc-suffix').text(s || '');
}

/**
 * Apply targets
 * @returns 
 */
function applyToTarget() {
    if (!state.targetEl) return;

    const current = Number($('#tt-calc-val').text()) || 0;
    const out = fmt(current, state.decimals);

    // Keep your existing write-back to the target element (for inline UX)
    state.targetEl.textContent = `${state.prefix}${out}${state.suffix}`;

    // 🔗 Update the canonical bill via helpers
    const bill = getBill();
    if (state.mode === 'currency') {
        // user set the base subtotal (pre‑tip)
        setBill({ ...bill, baseTotal: current }, { source: 'calc-sheet' });
    }
    else if (state.mode === 'percent') {
        // user set the tip percentage
        setBill({ ...bill, tipPct: current }, { source: 'calc-sheet' });
    }

    if (state.onApply) state.onApply(current, state.targetEl);
}

/**
 * Handle key press
 * @param {*} k 
 * @returns 
 */
function handleKey(k) {
    const txt = $('#tt-calc-val').text();
    const cur = Number(txt) || 0;

    if (k === 'C') {
        setDisplay(0);
        return;
    }

    if (k === '⌫') {
        let raw = toNumStr(txt);
        if (raw.endsWith('.')) raw = raw.slice(0, -1);
        raw = raw.replace('.', '');
        raw = raw.slice(0, -1);
        const n = Number(raw || '0') / 100;
        setDisplay(n);
        return;
    }

    if (k === '.') {
        if (!txt.includes('.')) $('#tt-calc-val').text(txt + '.');
        return;
    }

    // Only meaningful in currency mode
    if (k === '+10%') {
        if (state.mode === 'currency') {
            setDisplay(cur + cur * 0.10);
        }
        return;
    }

    if (k === '✓') {
        applyToTarget();
        app.sheet.close('#tt-calc-sheet');
        return;
    }

    if (/^\d$/.test(k)) {
        if (txt.endsWith('.')) {
            $('#tt-calc-val').text(txt + k);
            return;
        }
        const raw = (fmt(txt, state.decimals).replace('.', '') + k).replace(/^0+/, '') || '0';
        const n = Number(raw) / 100;
        setDisplay(n);
    }
}

/**
 * Mount the calculator
 * @returns 
 */
export function mountCalcSheet() {
    if (mounted) return;

    const html = `
  <div class="sheet-modal" id="tt-calc-sheet">
    <div class="toolbar">
      <div class="toolbar-inner">
        <div class="left"></div>
        <div class="right">
          <a class="link sheet-close" id="tt-calc-apply">Done</a>
        </div>
      </div>
    </div>
    <div class="sheet-modal-inner">
      <div class="block no-padding">
        <div class="ttc-display" id="tt-calc-display">
          <span class="ttc-prefix" id="tt-calc-prefix">$</span>
          <span id="tt-calc-val">0.00</span>
          <span class="ttc-suffix" id="tt-calc-suffix"></span>
        </div>
        <div class="grid grid-cols-4 grid-gap ttc-grid">
          <a class="button button-outline ttc-k" data-k="7">7</a>
          <a class="button button-outline ttc-k" data-k="8">8</a>
          <a class="button button-outline ttc-k" data-k="9">9</a>
          <a class="button button-fill color-blue ttc-k" data-k="C">C</a>

          <a class="button button-outline ttc-k" data-k="4">4</a>
          <a class="button button-outline ttc-k" data-k="5">5</a>
          <a class="button button-outline ttc-k" data-k="6">6</a>
          <a class="button button-fill color-blue ttc-k" data-k="⌫">⌫</a>

          <a class="button button-outline ttc-k" data-k="1">1</a>
          <a class="button button-outline ttc-k" data-k="2">2</a>
          <a class="button button-outline ttc-k" data-k="3">3</a>
          <a class="button button-fill color-blue ttc-k" data-k="+10%">+10%</a>

          <a class="button button-outline col-50 ttc-k" data-k="0">0</a>
          <a class="button button-outline ttc-k" data-k=".">.</a>
          <a class="button button-fill color-green ttc-k" data-k="✓">Apply</a>
        </div>
      </div>
    </div>
  </div>`.trim();

    $(document.body).append(html);

    // keypad buttons
    $(document).on('click', '#tt-calc-sheet .ttc-k', function (e) {
        e.preventDefault();
        const k = $(this).attr('data-k');
        handleKey(k);
    });

    // toolbar Done
    $(document).on('click', '#tt-calc-apply', function (e) {
        e.preventDefault();
        applyToTarget();
    });

    mounted = true;
}

/**
 * Modal sheet for displaying calculator
 * @param {*} target 
 * @param {*} opts 
 * @returns 
 */
export function openCalc(target, opts = {}) {
    if (!mounted) mountCalcSheet();

    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    state.targetEl = el;
    state.decimals = Number(opts.decimals ?? 2);
    state.mode = opts.mode ?? 'currency';
    state.prefix = opts.prefix ?? (state.mode === 'currency' ? '$' : '');
    state.suffix = opts.suffix ?? (state.mode === 'percent' ? '%' : '');
    state.onApply = typeof opts.onApply === 'function' ? opts.onApply : null;

    setPrefix(state.prefix);
    setSuffix(state.suffix);

    // Decide what to show initially:
    // - If opts.initial is provided, use it
    // - Else read from target (parses both $ and %)
    const initial =
        typeof opts.initial === 'number'
            ? opts.initial
            : getNumberFromEl(el);

    setDisplay(initial);

    // Ensure sheet can show full keypad on small screens
    const sheetEl = document.querySelector('#tt-calc-sheet');
    if (sheetEl) {
        sheetEl.style.height = 'auto';
        sheetEl.style.maxHeight = '70vh';
        const inner = sheetEl.querySelector('.sheet-modal-inner');
        if (inner) {
            inner.style.maxHeight = 'calc(70vh - var(--f7-toolbar-height, 44px))';
            inner.style.overflowY = 'auto';
        }
    }

    app.sheet.open('#tt-calc-sheet');
}

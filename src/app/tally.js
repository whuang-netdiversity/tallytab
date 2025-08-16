// /src/app/tally.js
import { purgeStorage, getStorage, setStorage } from '@/app/utils';
import { TALLY_EVENT_KEY, PATRONS_KEY, BILL_KEY } from '@/app/constants';

/**
 * Function get the tally
 * @returns
 */
export function getTally() {
    const state = getStorage(BILL_KEY);
    if (state && typeof state === 'object' && !Array.isArray(state)) {
        return {
            baseTotal: Number(state.baseTotal) || 0,
            tallyTotal: Number(state.tallyTotal) || 0,
            tipPct: Number(state.tipPct) || 0
        };
    }
    else {
        return { baseTotal: 0, tallyTotal: 0, tipPct: 0 };
    }
}

/**
 * Function to set the tally
 * @param {*} next 
 * @param {*} meta 
 */
export function setTally(next = {}, meta = {}) {
    // 1) Read patrons
    const patrons = getStorage(PATRONS_KEY) || [];

    // 2) Σ (qty * amt) across all patrons' items
    const itemsTotalRaw = patrons.reduce((sum, p) => {
        const items = Array.isArray(p?.items) ? p.items : [];
        return sum + items.reduce((s, it) => {
            const qty = Number(it?.qty) || 0;
            const unit = Number(String(it?.amt ?? '0').replace(/[^0-9.-]/g, '')) || 0;
            return s + qty * unit;
        }, 0);
    }, 0);
    const itemsTotal = Math.round(itemsTotalRaw * 100) / 100;

    // 3) Read current bill object
    const state = getStorage(BILL_KEY) || {};

    // 4) Build updated bill (top-level keys)
    const updated = {
        ...state,
        baseTotal: next.baseTotal !== undefined ? (Number(next.baseTotal) || 0) : (Number(state.baseTotal) || 0),
        tallyTotal: itemsTotal,
        tipPct: next.tipPct !== undefined ? (Number(next.tipPct) || 0) : (Number(state.tipPct) || 0)
    };

    // 5) Save and emit UI refresh
    setStorage(BILL_KEY, updated);
    app.emit('interfacePage', { key: TALLY_EVENT_KEY });
}

/**
 * Function to reset tally
 * @param {*} state 
 * @returns 
 */
export function unsetTally(state = false) {
    if (state) return;
    purgeStorage(BILL_KEY);
    app.emit('interfacePage', { key: TALLY_EVENT_KEY });
}

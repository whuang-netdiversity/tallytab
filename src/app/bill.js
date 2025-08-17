// /src/app/bill.js
import { purgeStorage, getStorage, setStorage } from '@/app/utils';
import { DRAFT_KEY, BILL_KEY, BILL_EVENT_KEY, TALLY_EVENT_KEY } from '@/app/constants';

/**
 * Get the bill object from storage.
 * Defaults to { baseTotal: 0, tipPct: 0 } if none saved.
 * @returns
 */
export function getBill() {
    return getStorage(BILL_KEY) || { baseTotal: 0, tallyTotal: 0, tipPct: 0 };
}

/**
 * Set (overwrite) the bill object in storage.
 * @param {*} data - { baseTotal: number, tipPct: number }
 */
export function setBill(data = {}) {
    const safeBill = {
        baseTotal: Number(data.baseTotal) || 0,
        tipPct: Number(data.tipPct) || 0,
        tallyTotal: Number(data.tallyTotal) || 0
    };
    setStorage(BILL_KEY, safeBill);

    // Notify the app so listeners (UI) update automatically
    app.emit('interfacePage', { key: BILL_EVENT_KEY });
    app.emit('interfacePage', { key: TALLY_EVENT_KEY });
}

/**
 * Function to reset bill
 * @param {*} state 
 */
export function unsetBill(state = false) {
    if (state) return;

    // Save and emit UI refresh
    purgeStorage(BILL_KEY);
    app.emit('interfacePage', { key: BILL_EVENT_KEY });
}

/**
 * Function to set bill state
 * @param {*} isDraft 
 */
export function setBillState(isDraft = false) {
    setStorage(DRAFT_KEY, isDraft);
}

/**
 * Functino get bill state
 * @returns 
 */
export function getBillState() {
    return getStorage(DRAFT_KEY);
}

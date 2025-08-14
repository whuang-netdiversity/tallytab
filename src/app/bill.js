// /src/app/bill.js
import { getStorage, setStorage } from '@/app/utils';
import { BILL_KEY, BILL_EVENT_KEY, TALLY_EVENT_KEY } from '@/app/constants';

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
 * Removes bill from storage
 */
export function unsetBill() {
    localStorage.removeItem(BILL_KEY);
    app.emit('interfacePage', { key: BILL_EVENT_KEY });
}

// /src/app/person.js
import { start } from '@/pages/start';
import { getStorage, setStorage } from '@/app/utils';
import { RECEIPT_EVENT_KEY, PATRONS_KEY } from '@/app/constants';
import { patron_detail } from '@/pages/patron-detail';

/**
 * Function to 
 * @returns
 */
export function getPatrons() {
    return getStorage(PATRONS_KEY) || [];
}


/**
 * Return list of patrons
 * @param {*} name
 * @param {*} amt
 * @returns
 */
export function addPatron(name, amt = '0.00') {
    const trimmed = String(name || '').trim();
    if (!trimmed) return false;

    const list = getStorage(PATRONS_KEY) || [];
    list.push({ label: trimmed, amt: String(amt), paid: false, items: [] });
    
    // Save and emit UI refresh
    setStorage(PATRONS_KEY, list);
    app.emit('interfacePage', { key: start.prop.repeater });
    
    return true;
}

/**
 * Remove a patron by name from localStorage.
 * @param {string} name - The patron's label/name to remove.
 * @returns {boolean} - True if removed, false if not found.
 */
export function removePatron(name) {
    if (!name || typeof name !== 'string') return false;

    const patrons = getStorage(PATRONS_KEY) || [];
    const filtered = patrons.filter(p => p.label !== name);

    if (filtered.length === patrons.length) return false;

    // Save and emit UI refresh
    setStorage(PATRONS_KEY, filtered);
    app.emit('interfacePage', { key: start.prop.repeater });

    return true;
}

/**
 * Removes patrons from storage
 * @param {*} state 
 * @returns
 */
export function unsetPatrons(state = false) {
    if (state) return app.emit('interfacePage', { key: start.prop.repeater });

    // Save and emit UI refresh
    localStorage.removeItem(PATRONS_KEY);
    app.emit('interfacePage', { key: start.prop.repeater });
}

/**
 * Add a patron to the tab list
 * @param {*} patronIndex 
 * @param {*} param1 
 * @returns 
 */
export function addItemToPatron(patronIndex, { label, qty, amt, type }) {
    const list = getStorage(PATRONS_KEY) || [];
    const patron = list[patronIndex];
    if (!patron || !Array.isArray(patron.items)) return false;

    patron.items.push({
        label: String(label || '').trim(),
        qty: Number(qty) || 0,
        amt: Number(amt) || 0,
        type: String(type || '').trim()
    });

    // Recalc total (qty * amt per item), parsing amt as number
    let subtotal = 0;
    for (let i = 0; i < patron.items.length; i++) {
        const it = patron.items[i];
        const unit = Number(String(it.amt ?? '0').replace(/[^0-9.-]/g, '')) || 0;
        const q = Number(it.qty) || 0;
        subtotal += q * unit;
    }

    patron.amt = (Math.round(subtotal * 100) / 100);

    // Save and emit UI refresh
    setStorage(PATRONS_KEY, list);
    app.emit('interfacePage', { key: patron_detail.item.repeater, params: patronIndex });
    app.emit('interfacePage', { key: start.prop.repeater });    
    app.emit('interfacePage', { key: RECEIPT_EVENT_KEY, params: patronIndex });

    return true;
}

/**
 * Remove a patron from the tab list
 * @param {*} patronIndex 
 * @param {*} itemIndex 
 * @returns 
 */
export function removeItemFromPatron(patronIndex, itemIndex) {
    const list = getStorage(PATRONS_KEY) || [];
    const patron = list[patronIndex];
    if (!patron || !Array.isArray(patron.items)) return false;
    if (itemIndex < 0 || itemIndex >= patron.items.length) return false;

    patron.items.splice(itemIndex, 1);

    let subtotal = 0;
    for (let i = 0; i < patron.items.length; i++) {
        const it = patron.items[i];
        const unit = Number(String(it.amt ?? '0').replace(/[^0-9.-]/g, '')) || 0;
        const q = Number(it.qty) || 0;
        subtotal += q * unit;
    }

    patron.amt = (Math.round(subtotal * 100) / 100);

    // Save and emit UI refresh
    setStorage(PATRONS_KEY, list);
    app.emit('interfacePage', { key: patron_detail.item.repeater, params: patronIndex });
    app.emit('interfacePage', { key: start.prop.repeater });
    app.emit('interfacePage', { key: RECEIPT_EVENT_KEY, params: patronIndex });

    return true;
}

/**
 * Update patron tab status
 * @param {*} patronIndex 
 * @param {*} isPaid 
 * @returns 
 */
export function updatePatronPaidStatus(patronIndex, isPaid = false) {
    const list = getStorage(PATRONS_KEY) || [];
    const patron = list[patronIndex];
    if (!patron || !Array.isArray(patron.items)) return false;

    patron.paid = isPaid;

    // Save and emit UI refresh
    setStorage(PATRONS_KEY, list);
    app.emit('interfacePage', { key: start.prop.repeater });

    return true;
}

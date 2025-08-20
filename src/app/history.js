// /src/app/history.js
import { bills_detail } from '@/pages/bills_detail';
import { getLocalTimestamp } from '@/app/helpers';
import { getBill } from '@/app/bill';
import { getPatrons } from '@/app/person';
import { getStorage, setStorage } from '@/app/utils';
import { HISTORY_KEY } from '@/app/constants';

/**
 * Function to archive bill
 * @returns 
 */
export function archiveBill() {
    const today = getLocalTimestamp();
    const bill = getBill();
    const patrons = getPatrons();
    
    // Merge bill data
    const snapshot = {
        date: today,
        baseTotal: bill.baseTotal,
        tipPct: bill.tipPct,
        tallyTotal: bill.tallyTotal,
        patrons: patrons
    };

    const list = getStorage(HISTORY_KEY) || [];
    list.push(snapshot);

    // Save and emit UI refresh
    setStorage(HISTORY_KEY, list);

    return true;   
}

/**
 * Function to remove bill
 * @param {*} index 
 * @returns 
 */
export function removeBillFromHistory(index) {
    const list = getStorage(HISTORY_KEY) || [];
    const bill = list[index];

    list.splice(index, 1);
    
    // Save and emit UI refresh
    setStorage(HISTORY_KEY, list);
    app.emit('interfacePage', { key: bills_detail.prop.repeater });

    return true;
}

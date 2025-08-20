// /src/app/history.js
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

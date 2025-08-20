// /src/core/interface-map.js
import { start } from '@/pages/start';
import { patron_detail } from '@/pages/patron-detail';
import { bills_detail } from '@/pages/bills_detail';
import { updateRepeater } from '@/app/ui';
import { updatePatrons } from '@/app/ui';
import { updateBill } from '@/app/ui';
import { updateTally } from '@/app/ui';
import { updateAdd } from '@/app/ui';
import { updateItem } from '@/app/ui';
import { updateReceipt } from '@/app/ui';
import { updateHistory } from '@/app/ui';
import { BILL_EVENT_KEY,RECEIPT_EVENT_KEY, TALLY_EVENT_KEY } from '@/app/constants';

export const interfaceMap = {
    [RECEIPT_EVENT_KEY]: (params) => updateReceipt(patron_detail.receipt, params),
    [BILL_EVENT_KEY]: () => updateBill(start.bill),
    [TALLY_EVENT_KEY]: () => updateTally(start.tally),
    [start.prop.repeater]: () => updateRepeater(start.prop, updatePatrons(), true),
    [patron_detail.item.repeater]: (params) => updateRepeater(patron_detail.item, updateItem(params), true),
    [patron_detail.add.repeater]: () => updateRepeater(patron_detail.add, updateAdd(), true),
    [bills_detail.prop.repeater]: () => updateRepeater(bills_detail.prop, updateHistory(), true)
    // Add more as needed
};

import { routeMap } from '@/core/route-map';
import { start } from '@/pages/start';
import { interfaceMap } from '@/core/interface-map';
import { patron_detail } from '@/pages/patron-detail';
import { RECEIPT_EVENT_KEY } from '@/app/constants';
import { BILL_EVENT_KEY, TALLY_EVENT_KEY } from '@/app/constants';
import { getBillState } from '@/app/bill';
import { unsetPatrons } from '@/app/person';

app.on('routePage', ({ key, params }) => {
    if (typeof routeMap[key] === 'function') {
        routeMap[key](params);
    }
});

app.on('interfacePage', ({ key, params }) => {
    if (typeof interfaceMap[key] === 'function') {
        interfaceMap[key](params);
    }
});

app.on('jsonRepeaterInitialized', ({ id: repeaterId }) => {
    app.emit('interfacePage', { key: BILL_EVENT_KEY });
    app.emit('interfacePage', { key: TALLY_EVENT_KEY });

    if (repeaterId == patron_detail.item.repeater) {
        app.emit('interfacePage', { key: patron_detail.item.repeater, params: window.personIndex });
        app.emit('interfacePage', { key: RECEIPT_EVENT_KEY, params: window.personIndex });
    }
    else if (repeaterId == start.prop.repeater) {
        unsetPatrons(getBillState());
    }
    else {
        app.emit('interfacePage', { key: repeaterId });
    }
});

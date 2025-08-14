import { routeMap } from '@/core/route-map';
import { interfaceMap } from '@/core/interface-map';
import { patron_detail } from '@/pages/patron-detail';

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
    if (repeaterId == patron_detail.item.repeater) {
        app.emit('interfacePage', { key: patron_detail.item.repeater, params: window.personIndex });
    }
    else {
        app.emit('interfacePage', { key: repeaterId });
    }
});

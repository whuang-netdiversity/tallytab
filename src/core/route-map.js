import { patron_detail } from '@/pages/patron-detail';
import { patronDetailsRoute } from '@/pages/patron-detail';
import { bills_detail } from '@/pages/bills_detail';
import { billsDetailsRoute } from '@/pages/bills_detail';

export const routeMap = {
    [patron_detail.key]: (params) => patronDetailsRoute(params),
    [bills_detail.key]: () => billsDetailsRoute()
    // Add more as needed
};

import { patron_detail } from '@/pages/patron-detail';
import { patronDetailsRoute } from '@/pages/patron-detail';

export const routeMap = {
    [patron_detail.key]: (params) => patronDetailsRoute(params),
    // Add more as needed
};

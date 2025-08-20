import { logger } from '@/app/log';
import { prevPath, nextPath } from '@/app/utils';

export const bills_detail = {
    key: 'detail-3872',
    path: '/bills_detail/',
    title: '#title-o-1357',
    back_button: '#o-1355',
    prop: {
        message: '#div-1369',
        repeater: 'repeater-1368',
        repeater_container: '#div-1363'
    },
    bread_crumb: 1
};

$(document).on('page:init', '.page[data-name="bills_detail"]', ({ detail: page }) => {
    const { route: { query } } = page;

    $(bills_detail.title).text('Bill History');


    $(bills_detail.back_button).removeClass('back');
    logger.info('bills detail page reloaded:', JSON.stringify(query));
});

/**
 * Handler for back link
 */
$(document).on('click', bills_detail.back_button, (e) => {
    e.preventDefault();

    prevPath(bills_detail.bread_crumb);
    logger.success('back to start');
});

/**
 * Function displaying add rewards
 */
export function billsDetailsRoute() { nextPath(bills_detail.path); }

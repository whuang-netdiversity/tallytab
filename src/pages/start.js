// /src/pages/start.js
import {
    currencyToNumber,
    applyTip,
    setBadgeActive,
    setBadgeInactive,
    disableOtherBadges,
    percentToNumber,
    setCustomBadgeActive,
    clearAnyTipAndResetBadges
} from '@/app/tip';

import { bills_detail } from '@/pages/bills_detail';
import { patron_detail } from '@/pages/patron-detail';

import { getBillState, setBillState, unsetBill } from '@/app/bill';
import { addPatron, unsetPatrons } from '@/app/person';
import { getStorage } from '@/app/utils';
import { logger } from '@/app/log';
import { removePatron } from '@/app/person';
import { mountCalcSheet, openCalc } from '@/services/calc-sheet';
import { PATRONS_KEY } from '@/app/constants';
import { unsetTally } from '@/app/tally';
import { archiveBill } from '@/app/history';

export const start = {
    key: 'index-2834',
    nav_title: '#div-1005',
    bill: {
        section: '#card-1202',
        total: '#div-1231',
        info: '#h3-1216',
        msg: '💸 set tip rate below'
    },
    tally: {
        section: '#card-1206',
        total: '#div-1218',
        info: '#h3-1219',
        msg: '💵 set person to update'
    },
    tip: {
        10: '#a-1145',
        15: '#a-1146',
        18: '#a-1147',
        other: '#a-1148'
    },
    prop: {
        message: '#div-1222',
        repeater: 'repeater-1169',
        repeater_container: '#div-1151'
    },
    checkbox: {
        draft_container: '#div-1346',
        draft_component: '<div class="display-flex align-items-center margin-top">\
            <label class="checkbox display-flex align-items-center">\
                <input type="checkbox" id="save-as-draft">\
                <i class="icon-checkbox"></i>\
                <span class="margin-left-half">Save this bill as draft</span>\
            </label>\
        </div>'
    },
    finish: {
        container: '#div-1336',
        archive: '#button-1340',
        view: '#button-1341'
    }
};

let tipActive = null;
let billBase = 0;

$(document).on('page:init', '.page[data-name="index"]', ({ detail: page }) => {
    const { route: { query } } = page;

    initApp();

    logger.info('start page reloaded:', JSON.stringify(query));
});

/**
 * Function initializing app
 */
export function initApp() {
    const billState = getBillState();
    $(start.checkbox.draft_container).html(start.checkbox.draft_component);
    $('#save-as-draft').prop('checked', billState === true);        

    unsetBill(billState);
    unsetTally(billState);

    $(start.nav_title).text(`Tally Tab v${window.appVersion}`);
    $(start.tally.total).text('$0.00');

    $(start.bill.info).text(start.bill.msg);
    $(start.tally.info).text(start.tally.msg);

    billBase = currencyToNumber($(start.bill.total).text());
    mountCalcSheet(app);
}

$(document).on('click', start.bill.section, (e) => {
    e.preventDefault();

    openCalc(start.bill.total, {
        prefix: '$',
        decimals: 2,
        /**
         * Apply in-line tip cleanup
         */
        onApply() {
            billBase = currencyToNumber($(start.bill.total).text());

            if (tipActive != null) {
                tipActive = null;
                clearAnyTipAndResetBadges(start.bill, billBase, start.tip, start.bill.msg);
            }
        }
    });
});

// Fixed % badges
Object.entries(start.tip).forEach(([pct, selector]) => {
    $(document).on('click', selector, (e) => {
        e.preventDefault();

        if (pct === 'other') {
            return; // custom handled below
        }

        if (tipActive == pct) {
            tipActive = null;
            clearAnyTipAndResetBadges(start.bill, billBase, start.tip, start.bill.msg);
            setBadgeInactive(selector, pct);
            return;
        }

        if (tipActive !== null && tipActive != pct) {
            return;
        }

        if (tipActive === null) {
            billBase = currencyToNumber($(start.bill.total).text());
        }

        tipActive = pct;
        applyTip(start.bill, Number(pct));
        setBadgeActive(selector, pct);
        disableOtherBadges(start.tip, selector);
    });
});

// Custom % badge
$(document).on('click', start.tip.other, (e) => {
    e.preventDefault();

    if (tipActive === 'other') {
        tipActive = null;
        clearAnyTipAndResetBadges(start.bill, billBase, start.tip, start.bill.msg);
        return;
    }

    if (tipActive !== null && tipActive !== 'other') {
        return;
    }

    openCalc(start.tip.other, {
        mode: 'percent',
        prefix: '',
        suffix: '%',
        decimals: 2,
        initial: 0,
        /**
         * Apply in-line tip cleanup
         * @param {*} val 
         */
        onApply(val) {
            const pct = percentToNumber(val);

            if (pct === 0) {
                tipActive = null;
                clearAnyTipAndResetBadges(start.bill, billBase, start.tip, start.bill.msg);
                return;
            }

            if (tipActive === null) {
                billBase = currencyToNumber($(start.bill.total).text());
            }

            tipActive = 'other';
            applyTip(start.bill, pct);
            setCustomBadgeActive(start.tip.other, pct);
            disableOtherBadges(start.tip, start.tip.other);
        }
    });
});

app.on(`lineChange[#${start.prop.repeater}]`, (event, repeater, rowindex, item) => {
    const { dataindex: index } = item;

    const patrons = getStorage(PATRONS_KEY) || [];
    const lastIndex = patrons.length; // "+ Add Person" sentinel

    // Sentinel tapped — trigger add flow
    if (index === lastIndex) {
        const dialog = app.dialog.prompt('👤 Enter tab name', '➕ Add Tab', (name) => {
            if (!addPatron(name)) return;
        });
        dialog.$el.find('input').attr('placeholder', 'e.g., Mike, Table 5, Kitchen');
        dialog.open();
        return;
    }

    // Real patron tapped — show action sheet
    const patron = patrons[index];
    if (!patron) return;

    app.actions.create({
        buttons: [
            {
                text: `🍽️ View Tab ⮕\n<small>${patron.label}</small>`,
                onClick: () => {
                    app.emit('routePage', { key: patron_detail.key, params: patron });
                }
            },
            {
                text: `🗑️ Remove Tab ⮕\n<small>${patron.label}</small>`,
                color: 'red',
                onClick: () => {
                    app.dialog.confirm(
                        `Are you sure you want to remove <b>${patron.label}</b>?`,
                        '⚠️ Confirm Remove',
                        () => {
                            removePatron(patron.label);
                        }
                    );
                }
            },
            {
                text: '❌ Cancel',
                close: true
            }
        ]
    }).open();
});

$(document).on('click', start.tally.section, (e) => {
    e.preventDefault();

    app.dialog.confirm('This will reset all tabs and amounts. Continue?', 'Confirm Reset', () => {
        // Wipe patrons from storage
        localStorage.removeItem(PATRONS_KEY);

        // Reset bill/tally totals
        unsetBill();
        unsetTally();
        unsetPatrons();
    });
});

$(document).on('change', '#save-as-draft', (e) => {
    const isChecked = e.target.checked; 

    setBillState(isChecked);
});


$(document).on('click', start.finish.archive, (e) => {
    e.preventDefault();

    archiveBill();
    setBillState(false);
    initApp();

    app.dialog.alert('This bill has been archived.');
});

$(document).on('click', start.finish.view, (e) => {
    e.preventDefault();

    app.emit('routePage', { key: bills_detail.key });
});

// /src/pages/patron_detail.js
import { logger } from '@/app/log';
import { getStorage } from '@/app/utils';
import { prevPath, nextPath } from '@/app/utils';
import { addItemToPatron, removeItemFromPatron } from '@/app/person';
import { setTally } from '@/app/tally';
import { start } from '@/pages/start';
import { PATRONS_KEY } from '@/app/constants';

export const patron_detail = {
    key: 'detail-3982',
    path: '/patron_detail/',
    title: '#title-o-1250',
    back_button: '#o-1248',
    add: {
        message: '#div-1267',
        repeater: 'repeater-1262',
        repeater_container: '#div-1256'
    },
    item: {
        message: '#div-1267',
        repeater: 'repeater-1266',
        repeater_container: '#div-1265'
    },
    bread_crumb: 1

};

let guest = null;
window.personIndex = -1;

$(document).on('page:init', '.page[data-name="patron_detail"]', ({ detail: page }) => {
    const { route: { query } } = page;
    const patron = JSON.parse(query.data);

    const patrons = getStorage(PATRONS_KEY) || [];
    personIndex = patrons.findIndex(p => p?.label === patron?.label);    
    guest = patrons[personIndex];

    $(patron_detail.title).text(`${guest.label}'s tab`);

    $(patron_detail.back_button).removeClass('back');
    logger.info('patron detail page reloaded:', JSON.stringify(query));
});

app.on(`lineChange[#${patron_detail.add.repeater}]`, () => {
    if (guest === null) return;

    const patrons = getStorage(PATRONS_KEY) || [];
    const patronIndex = patrons.findIndex(p => p?.label === guest?.label);

    if (patronIndex < 0) {
        console.warn('[TallyTab] patron not found in storage');
        return;
    }    

    // Simple multi-input dialog for { label, qty, amt, type }
    const html = `
        <div class="list no-hairlines no-hairlines-between">
            <ul>
                <li class="item-content item-input">
                    <div class="item-inner">
                        <div class="item-title item-label">Label</div>
                        <div class="item-input-wrap">
                            <input type="text" name="label" placeholder="e.g., Beer" autofocus>
                        </div>
                    </div>
                </li>
                <li class="item-content item-input">
                    <div class="item-inner">
                        <div class="item-title item-label">Qty</div>
                        <div class="item-input-wrap">
                            <input type="number" name="qty" value="1" min="0" inputmode="numeric">
                        </div>
                    </div>
                </li>
                <li class="item-content item-input">
                    <div class="item-inner">
                        <div class="item-title item-label">Amount</div>
                        <div class="item-input-wrap">
                            <input type="number" name="amt" step="0.01" placeholder="0.00" inputmode="decimal">
                        </div>
                    </div>
                </li>
                <li class="item-content item-input">
                    <div class="item-inner">
                        <div class="item-title item-label">Type</div>
                        <div class="item-input-wrap">
                        <select name="type">
                            <option value="drinks" selected>Drinks</option>
                            <option value="food">Food</option>
                        </select>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    `;

    const dlg = app.dialog.create({
        title: 'Add Item',
        content: html,
        buttons: [
            { text: 'Cancel' },
            {
                text: 'Add',
                bold: true,
                /**
                 * Handler for click
                 * @param {*} d 
                 * @returns 
                 */
                onClick(d) {
                    const $el = $(d.$el);
                    const label = String($el.find('input[name="label"]').val() || '').trim();
                    const qty = $el.find('input[name="qty"]').val();
                    let amt = String($el.find('input[name="amt"]').val() || '').trim();
                    const type = String($el.find('[name="type"]').val() || '').trim().toLowerCase();

                    if (!label) {
                        if (app?.toast?.show) {
                            app.toast.show({ text: 'Label is required', closeTimeout: 1500 });
                        }
                        return;
                    }

                    // Normalize amount
                    if (/^\d+$/.test(amt)) {
                        // If no decimal, insert one before the last two digits
                        if (amt.length > 2) {
                            amt = `${amt.slice(0, -2)}.${amt.slice(-2)}`;
                        }
                        else {
                            amt = `${amt}.00`;
                        }
                    }
                    else {
                        // Ensure two decimal places
                        const parsed = parseFloat(amt);
                        amt = isNaN(parsed) ? '0.00' : parsed.toFixed(2);
                    }

                    // Store item and auto-update patron.amt via your helper
                    addItemToPatron(patronIndex, { label, qty, amt, type });
                    setTally();

                    // Kick your existing UI refresh (already abstracted elsewhere)
                    app.emit('interfacePage', { key: patron_detail.item.repeater, params: patronIndex });
                    app.emit('interfacePage', { key: start.prop.repeater });
                }
            }
        ],
        on: {
            /**
             * Handler for open
             * @param {*} d 
             */
            opened(d) {
                $(d.$el).find('input[name="label"]').focus();
            }
        }
    });

    dlg.open();
});

app.on(`lineChange[#${patron_detail.item.repeater}]`, (event, repeater, rowindex, item) => {
    const { dataindex: index } = item;
    if (guest === null) return;

    const patrons = getStorage(PATRONS_KEY) || [];
    const patronIndex = patrons.findIndex(p => p?.label === guest?.label);

    if (patronIndex < 0) {
        console.warn('[TallyTab] patron not found in storage');
        return;
    } 

    app.actions.create({
        buttons: [
            {
                text: `🗑️ Remove Item ⮕\n<small>${item.label}</small>`,
                color: 'red',
                onClick: () => {
                    app.dialog.confirm(
                        `Are you sure you want to remove <b>${item.label}</b>?`,
                        '⚠️ Confirm Remove',
                        () => {
                            removeItemFromPatron(patronIndex, index);
                            setTally();
                            app.emit('interfacePage', { key: patron_detail.item.repeater });
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

/**
 * Handler for back link
 */
$(document).on('click', patron_detail.back_button, (e) => {
    e.preventDefault();

    prevPath(patron_detail.bread_crumb);
    logger.success('back to start');
});

/**
 * Function displaying add rewards
 * @param {object} item 
 */
export function patronDetailsRoute(item) { nextPath(patron_detail.path, { data: item }); }

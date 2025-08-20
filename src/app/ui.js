import { logger } from '@/app/log';
import { getStorage } from '@/app/utils';
import { getBill } from '@/app/bill';
import { getTally } from '@/app/tally';
import { HISTORY_KEY, PATRONS_KEY } from '@/app/constants';

/**
 * Function to update contents in a repeater
 * @param {*} page 
 * @param {*} contents 
 * @param {*} feature_allowed
 * @param {*} postRender
 */
export function updateRepeater(page, contents = [], feature_allowed = false, postRender = null) {
    thoriumapi.repeaters.clear(page.repeater);
    contents.forEach(content => thoriumapi.repeaters.appendItem(page.repeater, content));

    if (feature_allowed && contents.length > 0) {
        $(page.message).hide();
        $(page.repeater_container).show();
    }
    else if (feature_allowed && contents.length === 0) {
        $(page.message).show();
        $(page.repeater_container).hide();
    }
    else {
        $(page.message).text(page.unlock);
        $(page.message).show();
        $(page.repeater_container).hide();
    }

    // Run optional post-render hook
    if (typeof postRender === 'function') {
        postRender({ page, contents });
    }

    logger.warn(`${page.repeater} updated items: `, contents.length);
};

/**
 * Function to update item content
 * @param {*} index 
 * @returns 
 */
export function updateItem(index) {
    const patrons = getStorage(PATRONS_KEY) || [];
    const patron = patrons && Number.isInteger(index) ? patrons[index] : null;

    if (!patron || !Array.isArray(patron.items)) {
        return [];
    }

    return patron.items.map(it => {
        const type = String(it.type || '').toLowerCase();
        const icon = type === 'drinks' || type === 'drink' ? '🍺'
            : type === 'food'   || type === 'foods'  ? '🍟'
                : '🧾';

        const qty = Number(it.qty) || 0;
        const unit = Number(String(it.amt ?? '0').replace(/[^0-9.-]/g, '')) || 0;

        return {
            label: `${icon} ${String(it.label || '').trim()}`,
            info: `${qty} × $${unit.toFixed(2)}`
        };
    });
}

/**
 * Function to update add item
 * @returns 
 */
export function updateAdd() {
    return [
        { label: '+ Add Item' }
    ];
}

/**
 * Function to update patrons content
 * @returns 
 */
export function updatePatrons() {
    const patrons = getStorage(PATRONS_KEY) || [];
    const base = patrons.map(p => ({
        ...p,
        info: p.paid
            ? `💳 ${p.amt ? `$${parseFloat(p.amt).toFixed(2)}` : '$0.00'}`
            : `⏳ ${p.amt ? `$${parseFloat(p.amt).toFixed(2)}` : '$0.00'}`
    }));

    return [
        ...base,
        { label: '+ Add Tab', info: '' }
    ];
}

/**
 * Function to update historical content
 * @returns 
 */
export function updateHistory() {
    const history = getStorage(HISTORY_KEY) || [];

    return history
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // recent first
        .map(h => ({
            ...h,
            total: `$${parseFloat(h.baseTotal).toFixed(2)} + ${h.tipPct}%`,
            tally: `$${parseFloat(h.tallyTotal).toFixed(2)}`
        }));
}

/**
 * Function to update the bill content
 * @param {*} prop 
 */
export function updateBill(prop) {
    // prop is start.bill coming from interfaceMap
    // expected: prop.total (selector for total), prop.info (selector for tip label)
    const { baseTotal = 0, tipPct = 0 } = getBill();

    const tipAmount     = baseTotal * (tipPct / 100);
    const totalWithTip  = baseTotal + tipAmount;

    // Paint totals
    if (tipAmount > 0) {
        $(prop.info).text(`💸 +${Number(tipPct)}% tip: $${tipAmount.toFixed(2)}`);
    } 
    else {
        $(prop.info).text(prop.msg);
    }

    $(prop.total).text(`$${totalWithTip.toFixed(2)}`);
}

/**
 * Function to update the tally total
 * @param {*} prop 
 */
export function updateTally(prop) {
    // Pull current tally { baseTotal, tallyTotal, tipPct }
    const { baseTotal = 0, tallyTotal = 0, tipPct = 0 } = getTally();

    const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
    const tip = (n, pct) => Number(n) * (Number(pct) / 100);

    const totalWithTip = round2(baseTotal + tip(baseTotal, tipPct));
    const remaining = round2(totalWithTip - tallyTotal); // > 0 means more to collect

    // Paint totals
    if (tallyTotal > 0) {
        $(prop.info).removeClass('text-warning text-danger text-success');
        let operand = null;
        let icon = null;
        let label = null;

        if (remaining > 0) {
            $(prop.info).addClass('text-danger');
            operand = '-';
            icon = '👇';
            label = 'under';
        }
        else if (remaining < 0) {
            $(prop.info).addClass('text-success');
            operand = '+';
            icon = '☝️';
            label = 'over';
        }
        else {
            operand = '=';
            icon = '👌';
            label = 'even';
        }
        
        $(prop.info).text(`${icon} ${operand}$${Math.abs(remaining).toFixed(2)} ${label} bill`);
    }
    else {
        $(prop.info).text(prop.msg);
    }

    $(prop.total).text(`$${tallyTotal.toFixed(2)}`);
}

/**
 * Function to update receipt badge
 * @param {*} prop 
 * @param {*} index 
 * @returns 
 */
export function updateReceipt(prop, index) {
    const patrons = getStorage(PATRONS_KEY) || [];
    const patron = patrons && Number.isInteger(index) ? patrons[index] : null;
    const { tipPct = 0 } = getBill();

    if (!patron || !Array.isArray(patron.items) || patron.items.length === 0) {
        return [];
    }

    const amtBeforeTip = patron.amt / ( 1 + tipPct / 100);
    const tip = patron.amt - amtBeforeTip;

    $(prop.title).html(`<h2 class="text-align-center">🍺 Tally Tab<br><small>${patron.label}'s Receipt</small></h2>`);
    $(prop.subtotal).text(`$${amtBeforeTip.toFixed(2)}`);
    $(prop.tip_msg).html(`Tip (${tipPct}%)<br><small>*Based on shared tip rate</small>`);
    $(prop.tip).text(`$${tip.toFixed(2)}`);
    $(prop.total).text(`$${patron.amt.toFixed(2)}`);
}
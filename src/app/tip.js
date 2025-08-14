// /src/app/tip.js
import { getBill, setBill } from '@/app/bill';

export const currencyToNumber = (val) => {
    return parseFloat(String(val || '').replace(/[^0-9.-]+/g, '')) || 0;
};

/**
 * Clear any active tip and reset all tip badges (including Custom -> "Custom")
 * @param {*} prop 
 * @param {*} base 
 * @param {*} tipMap 
 * @param {*} msg 
 */
export function clearAnyTipAndResetBadges(prop, base, tipMap, msg) {
    clearTip(prop, base, msg);
    enableAllBadges(tipMap);
    if (tipMap && tipMap.other) {
        setCustomBadgeInactive(tipMap.other);
    }
}

/**
 * Apply calculated tip from selected rate
 * @param {*} prop 
 * @param {*} pct 
 */
export function applyTip(prop, pct) {
    // Update canonical bill (single source of truth)
    const bill = getBill();
    setBill({ ...bill, tipPct: Number(pct) || 0 }, { source: 'tip' });

    // Optional inline info text for immediate feedback on the tip screen
    const total = bill.baseTotal * (1 + pct / 100);
    $(prop.info).text(`💸 +${pct}% tip: $${(total - bill.baseTotal).toFixed(2)}`);
}


/**
 * Clear tips
 * @param {*} prop 
 * @param {*} base
 * @param {*} msg
 */
function clearTip(prop, base, msg) {
    // Reset canonical bill tip to 0
    const bill = getBill();
    setBill({ ...bill, tipPct: 0 }, { source: 'tip:clear' });

    // Keep your contextual message
    $(prop.info).text(msg);

    // NOTE: No direct write to prop.total; global handlers will update totals.
}

/**
 * Visual helpers for a single badge.
 * Keep these generic so they can be reused anywhere.
 * @param {*} selector 
 * @param {*} pct 
 */
export function setBadgeActive(selector, pct) {
    $(selector)
        .addClass('is-active')
        .attr('aria-pressed', 'true')
        .text(`-${pct}%`);
}

/**
 * Set badge inactive
 * @param {*} selector 
 * @param {*} pct 
 */
export function setBadgeInactive(selector, pct) {
    $(selector)
        .removeClass('is-active')
        .attr('aria-pressed', 'false')
        .text(`+${pct}%`);
}

/**
 * Disabling badges
 * @param {*} prop
 * @param {*} currentSelector 
 */
export function disableOtherBadges(prop, currentSelector) {
    Object.entries(prop).forEach(([p, sel]) => {
        if (sel !== currentSelector) {
            $(sel).addClass('is-disabled').attr('aria-pressed', 'false');
        }
    });
}

/**
 * Enabling badges
 * @param {*} prop
 */
function enableAllBadges(prop) {
    Object.entries(prop).forEach(([p, sel]) => {
        $(sel).removeClass('is-disabled');
        if (p !== 'other') {
            setBadgeInactive(sel, p);
        }
    });
}

/**
 * Percent parser (safe)
 * @param {*} val 
 * @returns 
 */
export function percentToNumber(val) {
    return parseFloat(String(val || '').replace(/[^0-9.-]+/g, '')) || 0;
}

/**
 * Custom badge label helpers
 * @param {*} selector 
 * @param {*} pct 
 */
export function setCustomBadgeActive(selector, pct) {
    // when active, show retract label as "-X%"
    $(selector)
        .addClass('is-active')
        .attr('aria-pressed', 'true')
        .text(`-${pct}%`);
}

/**
 * Disabling badges
 * @param {*} selector 
 */
function setCustomBadgeInactive(selector) {
    // when inactive & unset, show generic "Custom"
    $(selector)
        .removeClass('is-active')
        .attr('aria-pressed', 'false')
        .text('Custom');
}

// --- keep your existing imports & helpers ---

/**
 * Make the tip badges reflect the current tip percentage.
 * @param {Object} tipMap
 * @param {number} tipPct
 */
export function reflectTipBadges(tipMap, tipPct) {
    const pct = Math.round(Number(tipPct) || 0);

    // Reset all badges to enabled/inactive first
    enableAllBadges(tipMap);

    if (!pct) {
        // No tip -> make sure Custom shows "Custom" and nothing is active
        if (tipMap?.other) {
            setCustomBadgeInactive(tipMap.other);
        }
        return;
    }

    const key = String(pct);
    if (tipMap && tipMap[key]) {
        // A preset badge matches this pct
        setBadgeActive(tipMap[key], pct);
        disableOtherBadges(tipMap, tipMap[key]);
        if (tipMap?.other) setCustomBadgeInactive(tipMap.other);
    }
    else if (tipMap?.other) {
        // Custom tip (not one of the presets)
        setCustomBadgeActive(tipMap.other, pct);
        disableOtherBadges(tipMap, tipMap.other);
    }
}
// /src/services/premium.js
import { logger } from '@/app/log';
import { isRevenueCatReady } from '@/services/revenuecat';
import { purchasePremium, restorePurchases } from '@/services/revenuecat';

export const premium = {
    icon_container: '#right-o-1009',
    locked_id: '#premium-lock',
    unlocked_id: '#premium-unlock',
    locked: '<i id="premium-lock" class="fa f7-icons text-muted">lock_fill</i>',
    unlocked: '<i id="premium-unlock" class="fa f7-icons text-muted premium-sparkle">sparkles</i>'
};

const PRODUCT_ID = 'full_version_unlock';
const STORAGE_KEY = 'is_premium';

const PREMIUM_FEATURES = {
    'remove_ads': true
};

/**
 * Function to check premium flag
 * @returns 
 */
export function isPremium() {
    return localStorage.getItem(STORAGE_KEY) === '1';
}

/**
 * Function to purchase premium in app
 * @returns 
 */
export async function getPremium() {
    if (!isRevenueCatReady()) {
        console.warn('[Premium] Skipping purchase – RevenueCat not ready.');
        return;
    }

    const unlocked = await purchasePremium(PRODUCT_ID);

    if (unlocked) {
        setPremium(true);
        logger.success('[premium] Purchase succeeded, premium enabled');
        return true;
    }

    throw new Error('Purchase failed or was cancelled.');
}

/**
 * Function to restore purchases
 * @returns 
 */
export async function updatePremium() {
    const unlocked = await restorePurchases(PRODUCT_ID);

    if (unlocked) {
        setPremium(true);
        logger.success('[premium] Purchase restored, premium enabled');
        return true;
    }

    throw new Error('No purchases found for this account.');
}

/**
 * Function to set premium flag
 * @param {*} enabled 
 */
export function setPremium(enabled = true) {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    logger.info('[premium] Premium mode set:', enabled);
}

/**
 * Function to gate premium features
 * @param {*} key 
 * @param {*} param1 
 * @returns 
 */
export function gateFeature(key, { showDialog = false, fallback = null } = {}) {
    const gated = !!PREMIUM_FEATURES[key];
    const allowed = !gated || isPremium();

    logger.info('[premium] gateFeature check:', {key, gated, allowed});

    if (!allowed && showDialog) {
        app.dialog.alert('🔒 This is a premium feature. Upgrade to unlock.');
    }

    return allowed ? true : fallback;
}

/**
 * Function to simulate premium
 */
export function simulatePremium() {
    setPremium(true);
    logger.success('[premium] Simulated premium unlock');
}

/**
 * Function to update premium status icon
 */
export async function updatePremiumIcon() {
    const unlocked = isPremium();

    if (unlocked) {
        $(premium.unlocked_id).remove();
        $(premium.icon_container).html(premium.unlocked);
    }
    else {
        $(premium.locked_id).remove();
        $(premium.icon_container).html(premium.locked);
    }
}

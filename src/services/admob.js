// /src/app/admob.js
import { logger } from '@/app/log';
import { AdMob } from '@capacitor-community/admob';
import { isCapacitor } from '@/services/capacitor';
import { gateFeature } from '@/services/premium';

/**
 * Function to inject admob interstitial ads
 * @param {*} config
 * @returns
 */
export async function showInterstitialAd(config) {
    if (!isCapacitor()) return false;

    const feature_allowed = gateFeature('remove_ads');

    if (feature_allowed) {
        logger.info('[AdMob] Ads removed for premium user');
        return;
    }
    
    const isPrd = config.admob.ads === 'prd';

    document.addEventListener('deviceready', async () => {
        logger.info('[App] Device ready');

        try {
            await AdMob.initialize();
            logger.info('[AdMob] Initialized');

            AdMob.addListener('interstitialAdLoaded', () => {
                logger.info('[AdMob] Interstitial loaded');
            });

            AdMob.addListener('interstitialAdFailedToLoad', err => {
                logger.warn('[AdMob] Failed to load:', err);
            });

            AdMob.addListener('interstitialAdFailedToShow', err => {
                logger.warn('[AdMob] Failed to show:', err);
            });

            // Set up the ad unit Id
            await AdMob.prepareInterstitial({
                adId: config.admob.adId,
                isTesting: !isPrd,
                npa: true
            });

            await AdMob.showInterstitial();
            logger.info('[AdMob] Interstitial shown');
        }
        catch (err) {
            logger.error('[AdMob] Interstitial error:', err);
        }
    });
}

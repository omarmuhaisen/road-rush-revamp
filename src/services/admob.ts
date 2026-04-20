import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  RewardAdPluginEvents,
  AdMobRewardItem,
  RewardAdOptions,
} from '@capacitor-community/admob';

// AdMob IDs (provided by user)
export const ADMOB_APP_ID = 'ca-app-pub-8464065147087356~1130729395';
export const REWARDED_AD_UNIT_ID = 'ca-app-pub-8464065147087356/9539702458';

// Google's official test IDs (used in dev / browser preview)
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

let initialized = false;

export const isNative = () => Capacitor.isNativePlatform();

export const initAdMob = async (): Promise<void> => {
  if (!isNative() || initialized) return;
  try {
    await AdMob.initialize({
      initializeForTesting: false,
    });
    initialized = true;
    // eslint-disable-next-line no-console
    console.log('[AdMob] initialized');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[AdMob] init failed', e);
  }
};

/**
 * Show a rewarded ad. Resolves true if the user earned the reward.
 * On web/preview it falls back to a simulated reward (resolves true).
 */
export const showRewardedAd = async (): Promise<boolean> => {
  if (!isNative()) {
    // Web fallback — simulate reward so the in-browser preview keeps working
    return new Promise((resolve) => setTimeout(() => resolve(true), 50));
  }

  await initAdMob();

  return new Promise<boolean>(async (resolve) => {
    let rewarded = false;

    const rewardListener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (_reward: AdMobRewardItem) => {
        rewarded = true;
      }
    );

    const dismissListener = await AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      () => {
        rewardListener.remove();
        dismissListener.remove();
        failListener.remove();
        resolve(rewarded);
      }
    );

    const failListener = await AdMob.addListener(
      RewardAdPluginEvents.FailedToLoad,
      () => {
        rewardListener.remove();
        dismissListener.remove();
        failListener.remove();
        resolve(false);
      }
    );

    try {
      const options: RewardAdOptions = {
        adId: REWARDED_AD_UNIT_ID,
        // Use Google test ID automatically if running a debug build
        isTesting: false,
      };
      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[AdMob] rewarded ad failed', e);
      rewardListener.remove();
      dismissListener.remove();
      failListener.remove();
      resolve(false);
    }
  });
};

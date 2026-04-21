/**
 * AdMob integration via AppCreator24 WebView bridge.
 *
 * AppCreator24 injects an `Android` JavaScript interface into the WebView.
 * We call `Android.showRewardedAd()` to request a rewarded ad, and
 * the native side calls back `window.onRewardedAdCompleted()` or
 * `window.onRewardedAdFailed()` when done.
 *
 * On plain web (no Android bridge) we simulate the reward so the
 * browser preview keeps working.
 */

export const ADMOB_APP_ID = 'ca-app-pub-8464065147087356~1130729395';
export const REWARDED_AD_UNIT_ID = 'ca-app-pub-8464065147087356/9539702458';

declare global {
  interface Window {
    /** Injected by AppCreator24 native wrapper */
    Android?: {
      showRewardedAd?: () => void;
      showInterstitialAd?: () => void;
    };
    /** Callbacks set by our code, invoked by the native side */
    onRewardedAdCompleted?: () => void;
    onRewardedAdFailed?: () => void;
  }
}

/** Returns true when running inside an AppCreator24 WebView with the bridge available */
export const isNative = (): boolean =>
  typeof window.Android?.showRewardedAd === 'function';

/** No-op kept for compatibility */
export const initAdMob = async (): Promise<void> => {};

/**
 * Show a rewarded ad.
 * - Inside AppCreator24 WebView → triggers real AdMob rewarded ad.
 * - On web → simulates a reward after 50 ms.
 */
export const showRewardedAd = (): Promise<boolean> => {
  // Web fallback
  if (!isNative()) {
    return new Promise((resolve) => setTimeout(() => resolve(true), 50));
  }

  return new Promise<boolean>((resolve) => {
    // Set up callbacks the native side will invoke
    window.onRewardedAdCompleted = () => {
      cleanup();
      resolve(true);
    };

    window.onRewardedAdFailed = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      delete window.onRewardedAdCompleted;
      delete window.onRewardedAdFailed;
    };

    // Safety timeout — if native never calls back within 60 s, resolve false
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 60_000);

    const originalCleanup = cleanup;
    const cleanupWithTimer = () => {
      clearTimeout(timer);
      originalCleanup();
    };

    window.onRewardedAdCompleted = () => {
      cleanupWithTimer();
      resolve(true);
    };
    window.onRewardedAdFailed = () => {
      cleanupWithTimer();
      resolve(false);
    };

    try {
      window.Android!.showRewardedAd!();
    } catch (e) {
      console.warn('[AdMob] bridge call failed', e);
      cleanupWithTimer();
      resolve(false);
    }
  });
};

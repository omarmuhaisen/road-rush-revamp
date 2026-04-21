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

/** Returns true when running inside an AppCreator24 WebView */
export const isNative = (): boolean =>
  typeof window.Android?.showRewardedAd === 'function' ||
  /Android|webview/i.test(navigator.userAgent);

/** No-op kept for compatibility */
export const initAdMob = async (): Promise<void> => {};

/**
 * Show a rewarded ad.
 * - Inside AppCreator24 WebView → navigates to appcreator24://ad_rewarded
 *   and waits for the native callback.
 * - On web → simulates a reward after 50 ms.
 */
export const showRewardedAd = (): Promise<boolean> => {
  // Web fallback
  if (!isNative()) {
    return new Promise((resolve) => setTimeout(() => resolve(true), 50));
  }

  return new Promise<boolean>((resolve) => {
    const cleanup = () => {
      delete window.onRewardedAdCompleted;
      delete window.onRewardedAdFailed;
      clearTimeout(timer);
    };

    window.onRewardedAdCompleted = () => { cleanup(); resolve(true); };
    window.onRewardedAdFailed = () => { cleanup(); resolve(false); };

    // Safety timeout
    const timer = setTimeout(() => { cleanup(); resolve(false); }, 60_000);

    try {
      // AppCreator24 URL-scheme trigger for rewarded ads
      window.location.href = 'appcreator24://ad_rewarded';
    } catch (e) {
      console.warn('[AdMob] bridge call failed', e);
      cleanup();
      resolve(false);
    }
  });
};

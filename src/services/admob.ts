/**
 * AdMob integration via AppCreator24 WebView bridge.
 *
 * Triggers rewarded ads using: appcreator24://ad_rewarded
 * The native container intercepts this URL scheme and shows an AdMob rewarded video.
 *
 * On plain web (no native container) we simulate the reward after 30 seconds
 * so the shop/reward flow can be tested in-browser.
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
 * - Always triggers `appcreator24://ad_rewarded` URL scheme first.
 * - Sets up native callbacks for when the ad completes/fails.
 * - On web (non-native) simulates a successful reward after 30 seconds.
 */
export const showRewardedAd = (): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const cleanup = () => {
      delete window.onRewardedAdCompleted;
      delete window.onRewardedAdFailed;
      clearTimeout(timer);
    };

    window.onRewardedAdCompleted = () => { cleanup(); resolve(true); };
    window.onRewardedAdFailed = () => { cleanup(); resolve(false); };

    // Safety timeout — 90s max wait
    const timer = setTimeout(() => { cleanup(); resolve(false); }, 90_000);

    // Always fire the URL scheme so AppCreator24 can intercept it
    try {
      window.location.href = 'appcreator24://ad_rewarded';
    } catch (e) {
      console.warn('[AdMob] URL scheme trigger failed', e);
    }

    // Web fallback: if no native callback fires, simulate reward after 30s
    if (!isNative()) {
      setTimeout(() => {
        // Only resolve if not already resolved by native callbacks
        cleanup();
        resolve(true);
      }, 30_000);
    }
  });
};

import { app } from "./firebaseApp";

type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

let analyticsPromise: Promise<import("firebase/analytics").Analytics | null> | null =
  null;

export async function initializeFirebaseAnalytics() {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      if (typeof window === "undefined") {
        return null;
      }

      const analyticsModule = await import("firebase/analytics");
      const supported = await analyticsModule.isSupported().catch(() => false);

      if (!supported) {
        return null;
      }

      return analyticsModule.getAnalytics(app);
    })();
  }

  return analyticsPromise;
}

export async function trackAnalyticsEvent(
  eventName: string,
  eventParams?: AnalyticsEventParams,
) {
  const analytics = await initializeFirebaseAnalytics();

  if (!analytics) {
    return false;
  }

  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, eventName, eventParams);

  return true;
}

const getPagePath = () =>
  typeof window === "undefined" ? undefined : window.location.pathname;

export async function trackBookOpened(details: {
  bookId: string;
  title: string;
  author: string;
  genre: string;
  pages: number;
  rating: number;
}) {
  return trackAnalyticsEvent("open_book", {
    book_id: details.bookId,
    book_title: details.title,
    author: details.author,
    genre: details.genre,
    page_count: details.pages,
    rating: details.rating,
    page_path: getPagePath(),
  });
}

export async function trackPlanetariumVisited(details?: {
  isMobile?: boolean;
  isLowEnd?: boolean;
  prefersReducedMotion?: boolean;
}) {
  return trackAnalyticsEvent("visit_planetarium", {
    is_mobile: details?.isMobile,
    is_low_end: details?.isLowEnd,
    prefers_reduced_motion: details?.prefersReducedMotion,
    page_path: getPagePath(),
  });
}

export async function trackLetterSent(details: {
  hasName: boolean;
  messageLength: number;
}) {
  return trackAnalyticsEvent("send_letter", {
    has_name: details.hasName,
    message_length: details.messageLength,
    page_path: getPagePath(),
  });
}

export async function trackMusicToggled(isPlaying: boolean) {
  return trackAnalyticsEvent("toggle_music", {
    is_playing: isPlaying,
    page_path: getPagePath(),
  });
}

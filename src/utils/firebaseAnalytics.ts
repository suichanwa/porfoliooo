import { app } from "./firebaseApp";

type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type PageSection =
  | "home"
  | "about"
  | "books"
  | "book_reader"
  | "letters"
  | "write_letter"
  | "planetarium"
  | "game"
  | "other";

type NavigationSurface = "desktop_main" | "desktop_more" | "mobile";

let lastTrackedPageViewKey: string | null = null;

let analyticsPromise: Promise<import("firebase/analytics").Analytics | null> | null =
  null;

const cleanEventParams = (eventParams?: AnalyticsEventParams) => {
  if (!eventParams) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(eventParams).filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, string | number | boolean>;
};

const getPagePath = () =>
  typeof window === "undefined" ? undefined : window.location.pathname;

const getPageSection = (pagePath?: string): PageSection => {
  if (!pagePath) {
    return "other";
  }

  if (pagePath === "/") return "home";
  if (pagePath.startsWith("/about")) return "about";
  if (pagePath.startsWith("/books")) return "books";
  if (pagePath.startsWith("/read/")) return "book_reader";
  if (pagePath.startsWith("/letters")) return "letters";
  if (pagePath.startsWith("/write-letter")) return "write_letter";
  if (pagePath.startsWith("/planetarium")) return "planetarium";
  if (pagePath.startsWith("/game")) return "game";

  return "other";
};

const getReferrerPath = () => {
  if (typeof document === "undefined" || !document.referrer) {
    return undefined;
  }

  try {
    const referrerUrl = new URL(document.referrer);
    return referrerUrl.pathname || "/";
  } catch {
    return document.referrer;
  }
};

const getPageContext = () => {
  const pagePath = getPagePath();

  return {
    page_path: pagePath,
    page_section: getPageSection(pagePath),
    page_title: typeof document === "undefined" ? undefined : document.title,
    page_referrer: getReferrerPath(),
  };
};

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
  logEvent(analytics, eventName, cleanEventParams(eventParams));

  return true;
}

export async function trackSitePageViewed() {
  const context = getPageContext();
  const pageViewKey = `${context.page_path ?? ""}|${context.page_title ?? ""}`;

  if (pageViewKey === lastTrackedPageViewKey) {
    return false;
  }

  lastTrackedPageViewKey = pageViewKey;
  return trackAnalyticsEvent("site_page_view", context);
}

export async function trackNavigationClicked(details: {
  destinationPath: string;
  label: string;
  surface: NavigationSurface;
}) {
  return trackAnalyticsEvent("nav_click", {
    ...getPageContext(),
    destination_path: details.destinationPath,
    nav_label: details.label,
    nav_surface: details.surface,
  });
}

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

export async function trackBookPageTurned(details: {
  bookId: string;
  page: number;
  totalPages: number;
  source: "prev" | "next" | "input";
}) {
  return trackAnalyticsEvent("book_page_turn", {
    ...getPageContext(),
    book_id: details.bookId,
    page_number: details.page,
    total_pages: details.totalPages,
    page_progress: Math.round((details.page / details.totalPages) * 100),
    turn_source: details.source,
  });
}

export async function trackBookThoughtsOpened(details: {
  bookId: string;
  title: string;
  genre: string;
  source: "reader" | "card";
}) {
  return trackAnalyticsEvent("book_thoughts_open", {
    ...getPageContext(),
    book_id: details.bookId,
    book_title: details.title,
    genre: details.genre,
    source: details.source,
  });
}

export async function trackBookPdfOpened(details: {
  bookId: string;
  title: string;
}) {
  return trackAnalyticsEvent("book_pdf_open", {
    ...getPageContext(),
    book_id: details.bookId,
    book_title: details.title,
  });
}

export async function trackBookZoomChanged(details: {
  bookId: string;
  title: string;
  scale: number;
}) {
  return trackAnalyticsEvent("book_zoom_change", {
    ...getPageContext(),
    book_id: details.bookId,
    book_title: details.title,
    zoom_percent: Math.round(details.scale * 100),
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

export async function trackPlanetariumViewModeChanged(details: {
  mode: "overview" | "explore" | "custom";
}) {
  return trackAnalyticsEvent("planetarium_view_mode", {
    ...getPageContext(),
    view_mode: details.mode,
  });
}

export async function trackPlanetariumToggleChanged(details: {
  control:
    | "show_orbits"
    | "show_labels"
    | "show_grid"
    | "show_perf";
  enabled: boolean;
}) {
  return trackAnalyticsEvent("planetarium_toggle", {
    ...getPageContext(),
    control_name: details.control,
    control_enabled: details.enabled,
  });
}

export async function trackPlanetariumDistanceScaleChanged(details: {
  mode: "power" | "log" | "hybrid";
}) {
  return trackAnalyticsEvent("planetarium_distance_scale", {
    ...getPageContext(),
    distance_scale_mode: details.mode,
  });
}

export async function trackPlanetariumBodySelected(details: {
  bodyId: string;
  source: "canvas" | "picker";
}) {
  return trackAnalyticsEvent("planetarium_body_select", {
    ...getPageContext(),
    body_id: details.bodyId,
    select_source: details.source,
  });
}

export async function trackPlanetariumPickerToggled(details: {
  open: boolean;
}) {
  return trackAnalyticsEvent("planetarium_picker_toggle", {
    ...getPageContext(),
    picker_open: details.open,
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

export async function trackLetterDraftStarted(details: {
  hasName: boolean;
  messageLength: number;
}) {
  return trackAnalyticsEvent("letter_draft_start", {
    ...getPageContext(),
    has_name: details.hasName,
    message_length: details.messageLength,
  });
}

export async function trackLetterValidationFailed(details: {
  reason: "empty_message";
}) {
  return trackAnalyticsEvent("letter_validation_fail", {
    ...getPageContext(),
    reason: details.reason,
  });
}

export async function trackMusicToggled(isPlaying: boolean) {
  return trackAnalyticsEvent("toggle_music", {
    ...getPageContext(),
    is_playing: isPlaying,
  });
}

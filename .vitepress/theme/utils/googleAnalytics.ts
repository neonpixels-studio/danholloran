export const GA_MEASUREMENT_ID = "G-HRDP48J1X5";
export const GA_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";
export const GA_SCRIPT_ELEMENT_ID = "ga-script";
const GA_COOKIE_PREFIX = "_ga";
const EPOCH = "Thu, 01 Jan 1970 00:00:00 GMT";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (..._args: unknown[]) => void;
  [disableFlag: `ga-disable-${string}`]: boolean | undefined;
};

function analyticsWindow(): AnalyticsWindow {
  return window as unknown as AnalyticsWindow;
}

/** Re-grants consent on a page where GA was loaded, then withdrawn. */
function enableGoogleAnalytics(): void {
  const target = analyticsWindow();
  target[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  target.gtag?.("consent", "update", { analytics_storage: "granted" });
}

/** The only place the GA script is added to the page. */
export function loadGoogleAnalytics(): void {
  if (document.getElementById(GA_SCRIPT_ELEMENT_ID)) {
    enableGoogleAnalytics();
    return;
  }
  const target = analyticsWindow();
  target[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  target.dataLayer = target.dataLayer || [];
  target.gtag = function gtag(..._args: unknown[]) {
    // GA reads the real `arguments` object, not a rest array.
    target.dataLayer!.push(arguments);
  };
  target.gtag("js", new Date());
  target.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ELEMENT_ID;
  script.async = true;
  script.src = `${GA_SCRIPT_URL}?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// gtag writes its cookies on the registrable domain (".example.com"), and a
// cookie only clears when expired with the same domain it was set with.
function cookieDomains(): string[] {
  const parts = location.hostname.split(".");
  return parts
    .slice(0, -1)
    .map((_part, index) => `.${parts.slice(index).join(".")}`);
}

function expireCookie(name: string, domain?: string): void {
  const domainAttribute = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; expires=${EPOCH}; path=/${domainAttribute}`;
}

export function expireGaCookies(): void {
  const names = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter((name) => name.startsWith(GA_COOKIE_PREFIX));
  names.forEach((name) => {
    expireCookie(name);
    cookieDomains().forEach((domain) => expireCookie(name, domain));
  });
}

/**
 * Stops an already-loaded GA from sending anything further. VitePress
 * navigates without reloads, so the loaded script would otherwise keep
 * reporting page views after a user withdraws consent.
 */
export function disableGoogleAnalytics(): void {
  const target = analyticsWindow();
  target[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  target.gtag?.("consent", "update", { analytics_storage: "denied" });
  expireGaCookies();
}

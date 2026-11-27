export const DESKTOP_QUERY = "(min-width: 760px)";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type Listener = (type: "change", listener: () => void) => void;

export type MediaQuery = Readonly<{
  matches: boolean;
  addEventListener: Listener;
  removeEventListener: Listener;
}>;

export type MatchMedia = (query: string) => MediaQuery;

export type LoadRider = () => Promise<void>;

export const riderAllowed = (matchMedia: MatchMedia): boolean =>
  matchMedia(DESKTOP_QUERY).matches &&
  !matchMedia(REDUCED_MOTION_QUERY).matches;

export const boot = (matchMedia: MatchMedia, load: LoadRider): void => {
  const queries = [DESKTOP_QUERY, REDUCED_MOTION_QUERY].map(matchMedia);

  const start = (): void => {
    if (!riderAllowed(matchMedia)) {
      return;
    }

    queries.forEach((query) => query.removeEventListener("change", start));
    void load();
  };

  queries.forEach((query) => query.addEventListener("change", start));
  start();
};

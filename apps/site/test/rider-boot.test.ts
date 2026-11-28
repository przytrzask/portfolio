import { describe, expect, test } from "vitest";

import {
  boot,
  DESKTOP_QUERY,
  type MatchMedia,
  type MediaQuery,
  REDUCED_MOTION_QUERY,
} from "../src/rider/boot.ts";

type Screen = Readonly<{ width: number; reducedMotion: boolean }>;

const fakeMedia = (initial: Screen) => {
  const listeners = new Set<() => void>();
  const state = { screen: initial };

  const query = (text: string): MediaQuery => ({
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    get matches() {
      return text === DESKTOP_QUERY
        ? state.screen.width >= 760
        : text === REDUCED_MOTION_QUERY && state.screen.reducedMotion;
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  });

  const change = (screen: Screen): void => {
    state.screen = screen;
    [...listeners].forEach((listener) => listener());
  };

  return { change, listeners, matchMedia: query satisfies MatchMedia };
};

const loader = () => {
  const calls = { count: 0 };

  return {
    calls,
    load: () => {
      calls.count += 1;

      return Promise.resolve();
    },
  };
};

describe("boot", () => {
  test("loads nothing on a 390 px phone", () => {
    const media = fakeMedia({ reducedMotion: false, width: 390 });
    const rider = loader();

    boot(media.matchMedia, rider.load);

    expect(rider.calls.count).toBe(0);
  });

  test("loads nothing on desktop when reduced motion is on", () => {
    const media = fakeMedia({ reducedMotion: true, width: 1280 });
    const rider = loader();

    boot(media.matchMedia, rider.load);

    expect(rider.calls.count).toBe(0);
  });

  test("loads the rider once on desktop with motion allowed", () => {
    const media = fakeMedia({ reducedMotion: false, width: 1280 });
    const rider = loader();

    boot(media.matchMedia, rider.load);
    media.change({ reducedMotion: false, width: 1400 });

    expect(rider.calls.count).toBe(1);
    expect(media.listeners.size).toBe(0);
  });

  test("loads the rider when a phone-sized window widens to desktop", () => {
    const media = fakeMedia({ reducedMotion: false, width: 390 });
    const rider = loader();

    boot(media.matchMedia, rider.load);
    media.change({ reducedMotion: false, width: 1280 });
    media.change({ reducedMotion: false, width: 1300 });

    expect(rider.calls.count).toBe(1);
  });
});

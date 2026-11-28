import * as fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  CARVE_AMPLITUDE,
  CARVE_PERIOD,
  type Course,
  keyframes,
  LANE,
  MAX_TANGENT,
  pathD,
  riderRange,
  samplePath,
  type Side,
  xAt,
  type Zone,
} from "../src/rider/path.ts";

const MIN_GAP = 40;

const zoneSpec = fc.record({
  gap: fc.integer({ max: 600, min: MIN_GAP }),
  height: fc.integer({ max: 1400, min: 120 }),
  side: fc.constantFrom<Side>("left", "right"),
});

const course = fc
  .record({
    first: fc.integer({ max: 200, min: 0 }),
    specs: fc.array(zoneSpec, { maxLength: 8, minLength: 1 }),
    width: fc.integer({ max: 2560, min: 760 }),
  })
  .map(({ first, specs, width }): Course => {
    const zones = specs.reduce<Array<Zone>>((built, spec) => {
      const top = (built.at(-1)?.bottom ?? first - spec.gap) + spec.gap;

      built.push({ bottom: top + spec.height, side: spec.side, top });

      return built;
    }, []);

    return { width, zones };
  });

const span = (subject: Course) => ({
  from: (subject.zones[0]?.top ?? 0) - 400,
  to: (subject.zones.at(-1)?.bottom ?? 0) + 400,
});

const maxSlope = (subject: Course): number => {
  const amplitude = subject.width * CARVE_AMPLITUDE;
  const carve = amplitude / CARVE_PERIOD;

  const crossing =
    (1.5 * (subject.width * (LANE.left - LANE.right) + amplitude)) / MIN_GAP +
    2 * carve;

  return Math.max(carve, crossing);
};

describe("xAt", () => {
  test("stays inside the page width", () => {
    fc.assert(
      fc.property(
        course,
        fc.double({ max: 1, min: 0, noNaN: true }),
        (subject, t) => {
          const { from, to } = span(subject);
          const x = xAt(subject, from + (to - from) * t);

          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(subject.width);
        }
      )
    );
  });

  test("never jumps more than the steepest crossing allows per pixel", () => {
    fc.assert(
      fc.property(course, (subject) => {
        const { from, to } = span(subject);
        const limit = maxSlope(subject) + 1e-6;

        Array.from(
          { length: Math.ceil(to - from) },
          (_, step) => from + step
        ).forEach((y) => {
          expect(
            Math.abs(xAt(subject, y + 1) - xAt(subject, y))
          ).toBeLessThanOrEqual(limit);
        });
      }),
      { numRuns: 60 }
    );
  });

  test("is continuous across every zone boundary", () => {
    const epsilon = 1e-6;

    fc.assert(
      fc.property(course, (subject) => {
        subject.zones
          .flatMap((zone) => [zone.top, zone.bottom])
          .forEach((boundary) => {
            expect(
              Math.abs(
                xAt(subject, boundary + epsilon) -
                  xAt(subject, boundary - epsilon)
              )
            ).toBeLessThan(1e-2);
          });
      })
    );
  });

  test("turns into and out of each crossing without a kink", () => {
    const h = 1e-3;

    const slope = (subject: Course, y: number, side: number): number =>
      (xAt(subject, y + side * h) - xAt(subject, y)) / (side * h);

    fc.assert(
      fc.property(course, (subject) => {
        subject.zones.slice(1).forEach((zone, index) => {
          const before = subject.zones[index];

          if (
            before === undefined ||
            zone.top - before.bottom > MAX_TANGENT * CARVE_PERIOD * 0.9
          ) {
            return;
          }

          [before.bottom, zone.top].forEach((boundary) => {
            expect(
              Math.abs(
                slope(subject, boundary, 1) - slope(subject, boundary, -1)
              )
            ).toBeLessThan(0.02);
          });
        });
      })
    );
  });

  test("rides beside each panel, on the side away from it", () => {
    const subject: Course = {
      width: 1000,
      zones: [
        { bottom: 900, side: "left", top: 0 },
        { bottom: 2100, side: "right", top: 1200 },
      ],
    };

    expect(xAt(subject, 0)).toBeCloseTo(800);
    expect(xAt(subject, 1200)).toBeCloseTo(200);
  });
});

describe("pathD", () => {
  test("starts at the rider's start point", () => {
    fc.assert(
      fc.property(
        course,
        fc.integer({ max: 1200, min: 500 }),
        fc.integer({ max: 400, min: 0 }),
        (subject, viewport, pageTop) => {
          const documentHeight = (subject.zones.at(-1)?.bottom ?? 0) + viewport;
          const range = riderRange(documentHeight, viewport, pageTop);
          const d = pathD(samplePath(subject, range));

          expect(
            d.startsWith(
              `M${xAt(subject, range.start).toFixed(1)} ${range.start.toFixed(1)} `
            )
          ).toBe(true);
        }
      )
    );
  });
});

describe("keyframes", () => {
  test("run from 0 to 1 in order, so the rider keeps its screen height", () => {
    fc.assert(
      fc.property(
        course,
        fc.integer({ max: 1200, min: 500 }),
        (subject, viewport) => {
          const range = riderRange(
            (subject.zones.at(-1)?.bottom ?? 0) + viewport,
            viewport,
            0
          );

          const frames = keyframes(
            samplePath(subject, range),
            samplePath(subject, range, 7)
          );

          [frames.distances, frames.times].forEach((values) => {
            expect(values[0]).toBe(0);
            expect(values.at(-1)).toBe(1);
            values.slice(1).forEach((value, index) => {
              expect(value).toBeGreaterThanOrEqual(values[index] ?? 0);
            });
          });
        }
      )
    );
  });

  test("map scroll progress to the rider's y, not to its distance along the path", () => {
    const subject: Course = {
      width: 1280,
      zones: [
        { bottom: 800, side: "left", top: 0 },
        { bottom: 1800, side: "right", top: 1000 },
      ],
    };

    const frames = keyframes(samplePath(subject, riderRange(2600, 900, 0)));

    const drift = Math.max(
      ...frames.times.map((time, index) =>
        Math.abs(time - (frames.distances[index] ?? 0))
      )
    );

    expect(drift).toBeGreaterThan(0.01);
  });
});

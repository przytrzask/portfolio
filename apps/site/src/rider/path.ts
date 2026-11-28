export type Side = "left" | "right";

export type Zone = Readonly<{ top: number; bottom: number; side: Side }>;

export type Course = Readonly<{ zones: ReadonlyArray<Zone>; width: number }>;

export type Range = Readonly<{ start: number; end: number }>;

export type Point = Readonly<{ x: number; y: number }>;

export type Keyframes = Readonly<{
  distances: ReadonlyArray<number>;
  times: ReadonlyArray<number>;
}>;

export const RIDER_SCREEN_Y = 0.36;

export const CARVE_PERIOD = 190;

export const CARVE_AMPLITUDE = 0.07;

export const LANE: Readonly<Record<Side, number>> = { left: 0.8, right: 0.2 };

export const TRACK_OFFSET = 7;

const SAMPLE_STEP = 8;

const NORMAL_SPAN = 4;

const MAX_KEYFRAMES = 160;

export const MAX_TANGENT = 2;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const laneX = (course: Course, side: Side): number => course.width * LANE[side];

const amplitude = (course: Course): number => course.width * CARVE_AMPLITUDE;

const carveX = (course: Course, zone: Zone, y: number): number =>
  laneX(course, zone.side) +
  amplitude(course) * Math.sin((y - zone.top) / CARVE_PERIOD);

const carveSlope = (course: Course, zone: Zone, y: number): number =>
  (amplitude(course) / CARVE_PERIOD) * Math.cos((y - zone.top) / CARVE_PERIOD);

const tangent = (course: Course, slope: number, gap: number): number => {
  const limit = amplitude(course) * MAX_TANGENT;

  return Math.min(limit, Math.max(-limit, slope * gap));
};

const crossX = (course: Course, from: Zone, to: Zone, y: number): number => {
  const gap = to.top - from.bottom;
  const t = clamp01((y - from.bottom) / gap);
  const t2 = t * t;
  const t3 = t2 * t;
  const start = carveX(course, from, from.bottom);
  const end = laneX(course, to.side);

  const startTangent = tangent(
    course,
    carveSlope(course, from, from.bottom),
    gap
  );

  const endTangent = tangent(course, carveSlope(course, to, to.top), gap);

  return (
    (2 * t3 - 3 * t2 + 1) * start +
    (t3 - 2 * t2 + t) * startTangent +
    (3 * t2 - 2 * t3) * end +
    (t3 - t2) * endTangent
  );
};

export const xAt = (course: Course, y: number): number => {
  const { zones } = course;
  const index = zones.findIndex((zone) => y <= zone.bottom);
  const last = zones.length - 1;

  if (last < 0) {
    return course.width / 2;
  }

  const at = index === -1 ? last : index;
  const zone = zones[at];
  const previous = zones[at - 1];

  if (zone === undefined) {
    return course.width / 2;
  }

  return previous !== undefined && y < zone.top
    ? crossX(course, previous, zone, y)
    : carveX(course, zone, y);
};

export const riderRange = (
  documentHeight: number,
  viewportHeight: number,
  pageTop: number
): Range => {
  const start = viewportHeight * RIDER_SCREEN_Y - pageTop;
  const end = documentHeight - viewportHeight * (1 - RIDER_SCREEN_Y) - pageTop;

  return { end: Math.max(start, end), start };
};

const sampleYs = (range: Range): ReadonlyArray<number> => {
  const steps = Math.max(1, Math.ceil((range.end - range.start) / SAMPLE_STEP));

  return Array.from(
    { length: steps + 1 },
    (_, step) => range.start + ((range.end - range.start) * step) / steps
  );
};

export const samplePath = (
  course: Course,
  range: Range,
  offset = 0
): ReadonlyArray<Point> =>
  sampleYs(range).map((y) => {
    const x = xAt(course, y);
    const dx = xAt(course, y + NORMAL_SPAN) - xAt(course, y - NORMAL_SPAN);
    const dy = NORMAL_SPAN * 2;
    const length = Math.hypot(dx, dy);

    return {
      x: x + (offset * dy) / length,
      y: y - (offset * dx) / length,
    };
  });

const format = (value: number): string => value.toFixed(1);

export const pathD = (points: ReadonlyArray<Point>): string =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${format(point.x)} ${format(point.y)}`
    )
    .join(" ");

const arcLengths = (points: ReadonlyArray<Point>): ReadonlyArray<number> =>
  points.reduce<Array<number>>((lengths, point, index) => {
    const before = points[index - 1];
    const total = lengths.at(-1) ?? 0;

    lengths.push(
      before === undefined
        ? 0
        : total + Math.hypot(point.x - before.x, point.y - before.y)
    );

    return lengths;
  }, []);

const keyframeIndexes = (count: number): ReadonlyArray<number> => {
  const frames = Math.min(count, MAX_KEYFRAMES);

  return frames < 2
    ? [0, 0]
    : Array.from({ length: frames }, (_, frame) =>
        Math.round(((count - 1) * frame) / (frames - 1))
      );
};

export const keyframes = (
  center: ReadonlyArray<Point>,
  along: ReadonlyArray<Point> = center
): Keyframes => {
  const lengths = arcLengths(along);
  const total = lengths.at(-1) ?? 0;
  const first = center[0]?.y ?? 0;
  const span = (center.at(-1)?.y ?? first) - first;
  const indexes = keyframeIndexes(Math.min(center.length, along.length));

  return {
    distances: indexes.map((index, frame) =>
      total === 0
        ? frame / (indexes.length - 1)
        : clamp01((lengths[index] ?? 0) / total)
    ),
    times: indexes.map((index, frame) =>
      span === 0
        ? frame / (indexes.length - 1)
        : clamp01(((center[index]?.y ?? first) - first) / span)
    ),
  };
};

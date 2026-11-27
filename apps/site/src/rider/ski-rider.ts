import { inView, scroll } from "motion";
import { animate } from "motion/mini";

import { DESKTOP_QUERY } from "./boot.ts";
import { SKI_RIDER_TAG } from "./element.ts";
import {
  type Course,
  keyframes,
  pathD,
  riderRange,
  samplePath,
  type Side,
  TRACK_OFFSET,
  type Zone,
} from "./path.ts";

export const RIDER = {
  helmet: "#caa060",
  jacket: "#262a31",
  pack: "#e5582a",
  pants: "#c98a42",
  poles: "#ee5a1c",
  skiEdge: "#24262b",
  skis: "#f1f1ec",
} as const;

const SVG_NS = "http://www.w3.org/2000/svg";

const TRACK_COLOR = "#b8c8e2";

const RUNNING_STATE = "running";

const PROOF_VALUE_SELECTOR = "[data-proof-value]";

const STYLE = `
.tracks { position: absolute; left: 0; top: 0; overflow: visible; }
.track { fill: none; stroke: ${TRACK_COLOR}; stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
.rider { position: absolute; left: 0; top: 0; width: 64px; height: 72px; offset-anchor: center; offset-rotate: auto -90deg; offset-distance: 0%; will-change: offset-distance; }
.rider svg { display: block; width: 100%; height: 100%; overflow: visible; }
`;

const RIDER_SVG = `
<svg viewBox="-32 -36 64 72" aria-hidden="true" focusable="false">
  <ellipse cx="4" cy="5" rx="16" ry="27" fill="#0f1b2d22" />
  <g>
    <rect x="-9.5" y="-30" width="5" height="60" rx="2.5" fill="${RIDER.skis}" stroke="${RIDER.skiEdge}" stroke-width="1.2" />
    <rect x="4.5" y="-30" width="5" height="60" rx="2.5" fill="${RIDER.skis}" stroke="${RIDER.skiEdge}" stroke-width="1.2" />
    <path d="M-14 -4 L-22 18 M14 -4 L22 18" stroke="${RIDER.poles}" stroke-width="2" stroke-linecap="round" />
    <ellipse cx="0" cy="2" rx="9" ry="7" fill="${RIDER.pants}" />
    <ellipse cx="0" cy="-4" rx="13" ry="9" fill="${RIDER.jacket}" />
    <rect x="-7" y="-12" width="14" height="7" rx="2" fill="${RIDER.pack}" />
    <circle cx="0" cy="4" r="6" fill="${RIDER.helmet}" />
  </g>
</svg>
`;

const isSide = (value: string | undefined): value is Side =>
  value === "left" || value === "right";

const measureZones = (
  page: HTMLElement,
  pageTop: number
): ReadonlyArray<Zone> =>
  Array.from(page.querySelectorAll<HTMLElement>("[data-side]"))
    .flatMap((element) => {
      const { side } = element.dataset;
      const box = element.getBoundingClientRect();
      const top = box.top + window.scrollY - pageTop;

      return isSide(side) ? [{ bottom: top + box.height, side, top }] : [];
    })
    .toSorted((a, b) => a.top - b.top);

const svgElement = (name: string): SVGElement =>
  document.createElementNS(SVG_NS, name);

type Run = Readonly<{ stop: () => void }>;

const NO_RUN: Run = { stop: () => undefined };

class SkiRider extends HTMLElement {
  readonly #internals = this.attachInternals();

  readonly #tracks = svgElement("svg");

  readonly #trackPaths = [svgElement("path"), svgElement("path")];

  readonly #rider = document.createElement("div");

  #run: Run = NO_RUN;

  #frame = 0;

  #observer: ResizeObserver | undefined;

  readonly #schedule = (): void => {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#layout());
  };

  connectedCallback(): void {
    if (this.shadowRoot === null) {
      this.#render(this.attachShadow({ mode: "open" }));
    }

    const page = this.parentElement;

    if (page !== null) {
      this.#observer = new ResizeObserver(this.#schedule);
      this.#observer.observe(page);
    }

    window.addEventListener("resize", this.#schedule);
    void document.fonts.ready.then(this.#schedule);
    this.#schedule();
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.#frame);
    window.removeEventListener("resize", this.#schedule);
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#stop();
  }

  #render(root: ShadowRoot): void {
    const style = document.createElement("style");

    style.textContent = STYLE;
    this.#tracks.classList.add("tracks");
    this.#tracks.setAttribute("aria-hidden", "true");
    this.#trackPaths.forEach((track) => {
      track.classList.add("track");
      track.setAttribute("pathLength", "1");
      this.#tracks.append(track);
    });
    this.#rider.classList.add("rider");
    this.#rider.innerHTML = RIDER_SVG;
    root.append(style, this.#tracks, this.#rider);
  }

  #stop(): void {
    this.#run.stop();
    this.#run = NO_RUN;
    this.#internals.states.delete(RUNNING_STATE);
  }

  #layout(): void {
    const page = this.parentElement;

    this.#stop();

    if (page === null || !window.matchMedia(DESKTOP_QUERY).matches) {
      return;
    }

    const root = document.documentElement;
    const pageTop = page.getBoundingClientRect().top + window.scrollY;
    const width = page.clientWidth;
    const height = page.offsetHeight;
    const course: Course = { width, zones: measureZones(page, pageTop) };
    const range = riderRange(root.scrollHeight, root.clientHeight, pageTop);
    const center = samplePath(course, range);

    const sides = [-TRACK_OFFSET, TRACK_OFFSET].map((offset) =>
      samplePath(course, range, offset)
    );

    this.#tracks.setAttribute("width", String(width));
    this.#tracks.setAttribute("height", String(height));
    this.#tracks.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.#rider.style.offsetPath = `path("${pathD(center)}")`;

    const riderFrames = keyframes(center);

    const animations = [
      animate(
        this.#rider,
        {
          offsetDistance: riderFrames.distances.map(
            (distance) => `${(distance * 100).toFixed(3)}%`
          ),
        },
        { duration: 1, ease: "linear", times: [...riderFrames.times] }
      ),
      ...this.#trackPaths.flatMap((track, index) => {
        const points = sides[index];

        if (points === undefined) {
          return [];
        }

        const frames = keyframes(center, points);

        track.setAttribute("d", pathD(points));

        return [
          animate(
            track,
            {
              strokeDashoffset: frames.distances.map((distance) =>
                (1 - distance).toFixed(4)
              ),
            },
            { duration: 1, ease: "linear", times: [...frames.times] }
          ),
        ];
      }),
    ];

    const stops = animations.map((animation) => scroll(animation));

    this.#run = {
      stop: () => {
        stops.forEach((stop) => stop());
        animations.forEach((animation) => animation.cancel());
      },
    };
    this.#internals.states.add(RUNNING_STATE);
  }
}

const popProofValues = (): void => {
  const seen = new WeakSet<Element>();
  const values = Array.from(document.querySelectorAll(PROOF_VALUE_SELECTOR));

  inView(PROOF_VALUE_SELECTOR, (element) => {
    if (seen.has(element)) {
      return;
    }

    seen.add(element);
    void animate(
      element,
      {
        transform: ["none", "translateY(-4px) scale(1.12)", "none"],
      },
      {
        delay: Math.max(0, values.indexOf(element)) * 0.08,
        duration: 0.5,
        ease: "easeOut",
      }
    );
  });
};

export const register = (): void => {
  if (customElements.get(SKI_RIDER_TAG) === undefined) {
    customElements.define(SKI_RIDER_TAG, SkiRider);
  }

  popProofValues();
};

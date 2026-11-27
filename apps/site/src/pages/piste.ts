import type { Html, HtmlBuilder } from "foldkit/html";

import type { Depth } from "../content/portfolio.ts";
import { copy } from "../copy.ts";
import * as styles from "../styles.ts";

export type Side = styles.Side;

export const sideAt = (index: number): Side =>
  index % 2 === 0 ? "left" : "right";

export const zoneView = <Message>(
  h: HtmlBuilder<Message>,
  side: Side,
  children: ReadonlyArray<Html>,
  size: styles.ZoneSize = "tall"
): Html =>
  h.div(
    [h.Class(styles.zone(side, size)), h.DataAttribute("side", side)],
    children
  );

type Sign = keyof typeof styles.markerSign;

const SIGNS: Readonly<Record<Depth, ReadonlyArray<Sign>>> = {
  1: ["circle"],
  2: ["square"],
  3: ["diamond"],
  4: ["diamond", "diamond"],
};

export const markerSigns = <Message>(
  h: HtmlBuilder<Message>,
  depth: Depth
): Html =>
  h.span(
    [h.Class(styles.marker), h.AriaHidden(true)],
    SIGNS[depth].map((sign) => h.span([h.Class(styles.markerSign[sign])]))
  );

export type MarkerName = "hidden" | "visible";

export const trailMarker = <Message>(
  h: HtmlBuilder<Message>,
  depth: Depth,
  name: MarkerName
): Html =>
  h.span(
    [
      h.Class(styles.markerWithName),
      h.DataAttribute("depth", String(depth)),
      h.Title(copy.depthNames[depth]),
    ],
    [
      markerSigns(h, depth),
      h.span(name === "hidden" ? [h.Class(styles.srOnly)] : [], [
        copy.depthNames[depth],
      ]),
    ]
  );

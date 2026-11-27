import { Array, Option } from "effect";

import type { RenderedDiagram } from "../diagrams/diagram.ts";

const modules = import.meta.glob<ReadonlyArray<RenderedDiagram>>(
  "../../../../case-studies/*.md",
  { eager: true, import: "default", query: "?diagrams" }
);

export const renderedDiagrams: ReadonlyArray<RenderedDiagram> =
  Object.values(modules).flat();

export const findDiagram = (
  source: string,
  available: ReadonlyArray<RenderedDiagram> = renderedDiagrams
): Option.Option<RenderedDiagram> =>
  Array.findFirst(available, (diagram) => diagram.source === source);

export type RenderedDiagram = Readonly<{
  source: string;
  title: string;
  svg: string;
}>;

export const MERMAID_LANGUAGE = "mermaid";

export const DEFAULT_DIAGRAM_TITLE = "Architecture diagram";

declare module "*.md?diagrams" {
  const diagrams: ReadonlyArray<import("./diagram.ts").RenderedDiagram>;
  export default diagrams;
}

import * as Markdown from "@foldkit/markdown";
import { Match, Option } from "effect";
import { inertHtml as ih } from "foldkit/html";

import { md } from "./styles.ts";

const startAttribute = (maybeStart: Option.Option<number>) =>
  Option.match(maybeStart, {
    onNone: () => [],
    onSome: (start) => [ih.Start(start)],
  });

export const markdownViews: Markdown.Views = {
  ...Markdown.defaultViews,
  Blockquote: (_blockquote, blocks) =>
    ih.blockquote([ih.Class(md.blockquote)], blocks),
  CodeBlock: ({ value }) => ih.pre([ih.Class(md.pre)], [ih.code([], [value])]),
  Heading: ({ level }, content) =>
    Match.value(level).pipe(
      Match.when(2, () => ih.h2([ih.Class(md.h2)], content)),
      Match.when(3, () => ih.h3([ih.Class(md.h3)], content)),
      Match.orElse(() => ih.h4([ih.Class(md.h4)], content))
    ),
  InlineCode: ({ value }) => ih.code([ih.Class(md.code)], [value]),
  Link: ({ url }, content) => ih.a([ih.Href(url), ih.Class(md.link)], content),
  List: ({ isOrdered, maybeStartNumber }, items) =>
    isOrdered
      ? ih.ol([ih.Class(md.ol), ...startAttribute(maybeStartNumber)], items)
      : ih.ul([ih.Class(md.ul)], items),
  ListItem: (_item, blocks) => ih.li([ih.Class(md.li)], blocks),
  Paragraph: (_paragraph, content) => ih.p([ih.Class(md.p)], content),
  Strong: (_strong, content) => ih.strong([ih.Class(md.strong)], content),
};

export const viewMarkdown = (blocks: ReadonlyArray<Markdown.Block>) =>
  Markdown.viewBlocks({ blocks: [...blocks] }, { views: markdownViews });

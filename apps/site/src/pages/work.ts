import type * as Markdown from "@foldkit/markdown";
import { Predicate } from "effect";
import type { Html, HtmlBuilder } from "foldkit/html";

import type { Work } from "../content/case-studies.ts";
import { copy } from "../copy.ts";
import { iconView } from "../icons.ts";
import { viewMarkdown } from "../markdown-views.ts";
import { homeHref } from "../route.ts";
import * as styles from "../styles.ts";
import { sideAt, trailMarker, zoneView } from "./piste.ts";

export const bodySections = (
  blocks: ReadonlyArray<Markdown.Block>
): ReadonlyArray<ReadonlyArray<Markdown.Block>> => {
  const sections: Markdown.Block[][] = [];

  for (const block of blocks) {
    const current = sections.at(-1);

    if (
      current === undefined ||
      (Predicate.isTagged(block, "Heading") && block.level === 2)
    ) {
      sections.push([block]);
    } else {
      current.push(block);
    }
  }

  return sections;
};

const header = <Message>(h: HtmlBuilder<Message>, work: Work): Html =>
  zoneView(
    h,
    "left",
    [
      h.header(
        [h.Class(styles.panelWide)],
        [
          h.div(
            [h.Class(styles.headerTop)],
            [
              h.p([h.Class(styles.label)], [copy.caseStudyLabel]),
              h.a(
                [h.Href(homeHref()), h.Class(styles.backLink)],
                [copy.backHome]
              ),
            ]
          ),
          h.h1([h.Class(styles.h1Work)], [work.caseStudy.title]),
          h.div([h.Class(styles.meta)], viewMarkdown([work.caseStudy.meta])),
          h.p(
            [h.Class(styles.workProof)],
            [
              trailMarker(h, work.artifact.depth, "visible"),
              h.span(
                [],
                [
                  h.strong(
                    [h.Class(styles.proofValue)],
                    [work.artifact.proof.value]
                  ),
                  " ",
                  work.artifact.proof.label,
                ]
              ),
            ]
          ),
        ]
      ),
    ],
    "fit"
  );

const section = <Message>(
  h: HtmlBuilder<Message>,
  blocks: ReadonlyArray<Markdown.Block>,
  index: number
): Html =>
  zoneView(
    h,
    sideAt(index + 1),
    [h.section([h.Class(styles.panelWide)], viewMarkdown(blocks))],
    "fit"
  );

const footer = <Message>(h: HtmlBuilder<Message>, side: styles.Side): Html =>
  zoneView(
    h,
    side,
    [
      h.a(
        [h.Href(homeHref()), h.Class(styles.moreLink)],
        [copy.allCaseStudies, iconView(h, "arrowRight", styles.iconSmall)]
      ),
    ],
    "fit"
  );

export const workView = <Message>(
  h: HtmlBuilder<Message>,
  work: Work
): Html => {
  const sections = bodySections(work.caseStudy.body.blocks);

  return h.article(
    [h.Class(styles.pageWork)],
    [
      header(h, work),
      ...sections.map((blocks, index) => section(h, blocks, index)),
      footer(h, sideAt(sections.length + 1)),
    ]
  );
};

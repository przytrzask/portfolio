import * as Markdown from "@foldkit/markdown";
import type { Html, HtmlBuilder } from "foldkit/html";

import type { Work } from "../content/case-studies.ts";
import { copy } from "../copy.ts";
import { homeHref } from "../route.ts";
import { trailMarker } from "./home.ts";

export const workView = <Message>(h: HtmlBuilder<Message>, work: Work): Html =>
  h.article(
    [],
    [
      h.header(
        [],
        [
          h.p([], [h.a([h.Href(homeHref())], [copy.home])]),
          h.p([], [copy.caseStudyLabel]),
          h.h1([], [work.caseStudy.title]),
          ...Markdown.viewBlocks({ blocks: [work.caseStudy.meta] }),
          h.p(
            [],
            [
              trailMarker(h, work),
              " · ",
              h.strong([], [work.artifact.proof.value]),
              " ",
              work.artifact.proof.label,
            ]
          ),
        ]
      ),
      ...Markdown.viewBlocks(work.caseStudy.body),
    ]
  );

import { Option } from "effect";
import type { Html, HtmlBuilder } from "foldkit/html";

import type { ShippedItem } from "../content/brag.ts";
import type { Work } from "../content/case-studies.ts";
import { copy } from "../copy.ts";
import { homeHref, workHref } from "../route.ts";

export type ShippedContent = Readonly<{
  shipped: ReadonlyArray<ShippedItem>;
  works: ReadonlyArray<Work>;
}>;

const artifactLink = <Message>(
  h: HtmlBuilder<Message>,
  item: ShippedItem,
  works: ReadonlyArray<Work>
): ReadonlyArray<Html> => {
  const work = works.find(
    (candidate) => candidate.artifact.name === item.artifact
  );

  return work === undefined
    ? []
    : [
        h.dt([], [copy.shippedArtifact]),
        h.dd(
          [],
          [h.a([h.Href(workHref(work.caseStudy.slug))], [work.caseStudy.title])]
        ),
      ];
};

const proof = <Message>(h: HtmlBuilder<Message>, item: ShippedItem) =>
  Option.match(item.maybeProofUrl, {
    onNone: () => item.proof,
    onSome: (url) => h.a([h.Href(url)], [item.proof]),
  });

const itemView = <Message>(
  h: HtmlBuilder<Message>,
  item: ShippedItem,
  works: ReadonlyArray<Work>
): Html =>
  h.li(
    [],
    [
      h.article(
        [h.Id(item.anchor)],
        [
          h.p(
            [],
            [
              h.time(
                [h.Attribute("datetime", item.periodStart)],
                [item.periodStart]
              ),
              " to ",
              h.time(
                [h.Attribute("datetime", item.periodEnd)],
                [item.periodEnd]
              ),
              ` · ${item.area}`,
            ]
          ),
          h.h2([], [item.what]),
          h.dl(
            [],
            [
              h.dt([], [copy.shippedImpact]),
              h.dd([], [item.impact]),
              h.dt([], [copy.shippedSkills]),
              h.dd([], [item.skills.join(", ")]),
              ...artifactLink(h, item, works),
              h.dt([], [copy.shippedProof]),
              h.dd([], [proof(h, item)]),
            ]
          ),
        ]
      ),
    ]
  );

export const shippedView = <Message>(
  h: HtmlBuilder<Message>,
  content: ShippedContent
): Html =>
  h.section(
    [],
    [
      h.p([], [h.a([h.Href(homeHref())], [copy.home])]),
      h.p([], [copy.shippedLabel]),
      h.h1([], [copy.shippedHeading]),
      h.p([], [copy.shippedIntro]),
      content.shipped.length === 0
        ? h.p([], [copy.shippedEmpty])
        : h.ol(
            [],
            content.shipped.map((item) => itemView(h, item, content.works))
          ),
    ]
  );

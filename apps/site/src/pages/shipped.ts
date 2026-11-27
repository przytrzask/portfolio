import { Option } from "effect";
import type { Html, HtmlBuilder } from "foldkit/html";

import { type ShippedItem, shippedWhen } from "../content/brag.ts";
import type { Work } from "../content/case-studies.ts";
import { copy } from "../copy.ts";
import { homeHref, workHref } from "../route.ts";
import * as styles from "../styles.ts";
import { zoneView } from "./piste.ts";

export type ShippedContent = Readonly<{
  shipped: ReadonlyArray<ShippedItem>;
  works: ReadonlyArray<Work>;
}>;

const field = <Message>(
  h: HtmlBuilder<Message>,
  name: string,
  value: ReadonlyArray<Html | string>
): ReadonlyArray<Html> => [
  h.dt([h.Class(styles.shippedFieldName)], [name]),
  h.dd([h.Class(styles.shippedFieldValue)], value),
];

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
    : field(h, copy.shippedArtifact, [
        h.a([h.Href(workHref(work.caseStudy.slug))], [work.caseStudy.title]),
      ]);
};

const proof = <Message>(h: HtmlBuilder<Message>, item: ShippedItem) =>
  Option.match(item.maybeProofUrl, {
    onNone: () => item.proof,
    onSome: (url) => h.a([h.Href(url)], [item.proof]),
  });

const whenView = <Message>(h: HtmlBuilder<Message>, item: ShippedItem) => {
  const when = shippedWhen(item);

  return Option.match(when.maybeDateTime, {
    onNone: () => h.span([], [when.text]),
    onSome: (dateTime) =>
      h.time([h.Attribute("datetime", dateTime)], [when.text]),
  });
};

const itemView = <Message>(
  h: HtmlBuilder<Message>,
  item: ShippedItem,
  works: ReadonlyArray<Work>
): Html =>
  h.li(
    [h.Class(styles.shippedArticle)],
    [
      h.article(
        [h.Id(item.anchor)],
        [
          h.p(
            [h.Class(styles.shippedWhen)],
            [
              whenView(h, item),
              h.span([h.AriaHidden(true)], ["·"]),
              h.span([h.Class(styles.logArea)], [item.area]),
            ]
          ),
          h.h2([h.Class(styles.shippedTitle)], [item.what]),
          h.dl(
            [h.Class(styles.shippedFields)],
            [
              ...field(h, copy.shippedImpact, [item.impact]),
              ...field(h, copy.shippedSkills, [item.skills.join(", ")]),
              ...artifactLink(h, item, works),
              ...field(h, copy.shippedProof, [proof(h, item)]),
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
  h.div(
    [h.Class(styles.pageWork)],
    [
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
                  h.p([h.Class(styles.label)], [copy.shippedLabel]),
                  h.a(
                    [h.Href(homeHref()), h.Class(styles.backLink)],
                    [copy.home]
                  ),
                ]
              ),
              h.h1([h.Class(styles.h1Work)], [copy.shippedHeading]),
              h.p([h.Class(styles.body)], [copy.shippedIntro]),
            ]
          ),
        ],
        "fit"
      ),
      zoneView(
        h,
        "right",
        [
          h.section(
            [h.Class(styles.panelWide)],
            [
              content.shipped.length === 0
                ? h.p([h.Class(styles.body)], [copy.shippedEmpty])
                : h.ol(
                    [h.Class(styles.log)],
                    content.shipped.map((item) =>
                      itemView(h, item, content.works)
                    )
                  ),
            ]
          ),
        ],
        "fit"
      ),
    ]
  );

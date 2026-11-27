import { Option } from "effect";
import type { Html, HtmlBuilder } from "foldkit/html";

import { type ShippedItem, shippedWhen } from "../content/brag.ts";
import type { Work } from "../content/case-studies.ts";
import { Depth, known, type Portfolio } from "../content/portfolio.ts";
import { copy, HEADLINE, HEADLINE_HIGHLIGHT } from "../copy.ts";
import { type IconName, iconView } from "../icons.ts";
import { shippedHref, workHref } from "../route.ts";
import * as styles from "../styles.ts";
import {
  markerSigns,
  sideAt,
  trailMarker,
  type Side,
  zoneView,
} from "./piste.ts";

export type HomeContent = Readonly<{
  portfolio: Portfolio;
  proofCards: ReadonlyArray<Work>;
  works: ReadonlyArray<Work>;
  shipped: ReadonlyArray<ShippedItem>;
}>;

type ContactLink = Readonly<{ label: string; href: string; icon: IconName }>;

const LATEST_SHIPPED = 3;

export const contactLinks = (
  portfolio: Portfolio
): ReadonlyArray<ContactLink> => [
  ...Option.toArray(
    Option.map(known(portfolio.profile.email), (email) => ({
      href: `mailto:${email}`,
      icon: "mail" as const,
      label: copy.email,
    }))
  ),
  ...Option.toArray(
    Option.map(known(portfolio.links.github), (href) => ({
      href,
      icon: "github" as const,
      label: copy.github,
    }))
  ),
  ...Option.toArray(
    Option.map(known(portfolio.links.linkedin), (href) => ({
      href,
      icon: "linkedin" as const,
      label: copy.linkedin,
    }))
  ),
  { href: copy.resumeHref, icon: "download", label: copy.resume },
];

const headline = <Message>(
  h: HtmlBuilder<Message>
): ReadonlyArray<Html | string> => {
  const at = HEADLINE.indexOf(HEADLINE_HIGHLIGHT);

  return at === -1
    ? [HEADLINE]
    : [
        HEADLINE.slice(0, at),
        h.em([h.Class(styles.highlight)], [HEADLINE_HIGHLIGHT]),
        HEADLINE.slice(at + HEADLINE_HIGHLIGHT.length),
      ];
};

const proofCard = <Message>(h: HtmlBuilder<Message>, work: Work): Html =>
  h.li(
    [],
    [
      h.a(
        [h.Href(workHref(work.caseStudy.slug)), h.Class(styles.card)],
        [
          h.span(
            [h.Class(styles.cardProject), h.DataAttribute("project", "")],
            [copy.projectLabel(work.artifact.name)]
          ),
          " ",
          h.strong([h.Class(styles.cardValue)], [work.artifact.proof.value]),
          " ",
          h.span([h.Class(styles.cardLabel)], [work.artifact.proof.label]),
          " ",
          h.span(
            [h.Class(styles.cardCta)],
            [
              h.span([h.AriaHidden(true)], [copy.proofCtaShort]),
              h.span(
                [h.Class(styles.srOnly)],
                [`${copy.proofCta}: ${work.caseStudy.title}`]
              ),
              iconView(h, "arrowRight", styles.iconSmall),
            ]
          ),
        ]
      ),
    ]
  );

const heroZone = <Message>(
  h: HtmlBuilder<Message>,
  content: HomeContent
): Html =>
  zoneView(h, "left", [
    h.section(
      [h.AriaLabelledBy("hero-heading"), h.Class(styles.panel)],
      [
        h.p(
          [h.Class(styles.label)],
          [
            copy.heroLabel(
              Option.getOrUndefined(known(content.portfolio.profile.name))
            ),
          ]
        ),
        h.h1([h.Id("hero-heading"), h.Class(styles.h1)], headline(h)),
        h.nav(
          [h.AriaLabel(copy.contactLinks)],
          [
            h.ul(
              [h.Class(styles.links)],
              contactLinks(content.portfolio).map((link) =>
                h.li(
                  [],
                  [
                    h.a(
                      [h.Href(link.href), h.Class(styles.textLink)],
                      [iconView(h, link.icon, styles.icon), link.label]
                    ),
                  ]
                )
              )
            ),
          ]
        ),
        h.ul(
          [h.AriaLabel(copy.proofCards), h.Class(styles.cards)],
          content.proofCards.map((work) => proofCard(h, work))
        ),
      ]
    ),
  ]);

const legend = <Message>(h: HtmlBuilder<Message>): Html =>
  h.ul(
    [h.AriaLabel(copy.trailLegend), h.Class(styles.legend)],
    Depth.literals.map((depth) =>
      h.li(
        [h.Class(styles.legendItem)],
        [markerSigns(h, depth), copy.depthNames[depth]]
      )
    )
  );

const teaser = <Message>(
  h: HtmlBuilder<Message>,
  work: Work,
  index: number,
  side: Side
): Html =>
  h.li(
    [],
    [
      zoneView(h, side, [
        h.article(
          [h.Class(styles.panel)],
          [
            h.p(
              [h.Class(styles.label)],
              [
                trailMarker(h, work.artifact.depth, "hidden"),
                copy.caseNumber(index, work.artifact.name),
              ]
            ),
            h.h3(
              [h.Class(styles.h3Teaser)],
              [
                h.a(
                  [
                    h.Href(workHref(work.caseStudy.slug)),
                    h.Class(styles.teaserTitleLink),
                  ],
                  [work.caseStudy.title]
                ),
              ]
            ),
            h.p([h.Class(styles.body)], [work.artifact.one_liner]),
            h.p(
              [h.Class(styles.proofLine)],
              [
                h.strong(
                  [h.Class(styles.proofValue)],
                  [work.artifact.proof.value]
                ),
                work.artifact.proof.label,
              ]
            ),
          ]
        ),
      ]),
    ]
  );

const shippedTeaser = <Message>(
  h: HtmlBuilder<Message>,
  item: ShippedItem
): Html => {
  const when = shippedWhen(item);

  return h.li(
    [h.Class(styles.logRow)],
    [
      Option.match(when.maybeDateTime, {
        onNone: () => h.span([h.Class(styles.logTime)], [when.text]),
        onSome: (dateTime) =>
          h.time(
            [h.Attribute("datetime", dateTime), h.Class(styles.logTime)],
            [when.text]
          ),
      }),
      h.span(
        [],
        [h.span([h.Class(styles.logArea)], [item.area]), " ", item.what]
      ),
    ]
  );
};

export const homeView = <Message>(
  h: HtmlBuilder<Message>,
  content: HomeContent
): Html => {
  const shippedSide = sideAt(content.works.length);

  return h.div(
    [h.Class(styles.page)],
    [
      heroZone(h, content),
      h.section(
        [h.AriaLabelledBy("work-heading"), h.Class(styles.zoneStack)],
        [
          zoneView(h, "right", [
            h.div(
              [h.Class(styles.panel)],
              [
                h.p([h.Class(styles.label)], [copy.workLabel]),
                h.h2(
                  [h.Id("work-heading"), h.Class(styles.h2)],
                  [copy.workHeading]
                ),
                h.p([h.Class(styles.body)], [copy.workIntro]),
                legend(h),
              ]
            ),
          ]),
          h.ul(
            [h.Class(styles.zoneStack)],
            content.works.map((work, index) =>
              teaser(h, work, index, sideAt(index))
            )
          ),
        ]
      ),
      zoneView(h, shippedSide, [
        h.section(
          [h.AriaLabelledBy("shipped-heading"), h.Class(styles.panel)],
          [
            h.p([h.Class(styles.label)], [copy.shippedLabel]),
            h.h2(
              [h.Id("shipped-heading"), h.Class(styles.h2)],
              [copy.shippedHeading]
            ),
            h.ul(
              [h.Class(styles.log)],
              content.shipped
                .slice(0, LATEST_SHIPPED)
                .map((item) => shippedTeaser(h, item))
            ),
            h.a(
              [h.Href(shippedHref()), h.Class(styles.moreLink)],
              [copy.shippedAll, iconView(h, "arrowRight", styles.iconSmall)]
            ),
          ]
        ),
      ]),
    ]
  );
};

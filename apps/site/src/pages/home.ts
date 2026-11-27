import { Option } from "effect";
import type { Html, HtmlBuilder } from "foldkit/html";

import type { ShippedItem } from "../content/brag.ts";
import type { Work } from "../content/case-studies.ts";
import { known, type Portfolio } from "../content/portfolio.ts";
import { copy, HEADLINE } from "../copy.ts";
import { shippedHref, workHref } from "../route.ts";

export type HomeContent = Readonly<{
  portfolio: Portfolio;
  proofCards: ReadonlyArray<Work>;
  works: ReadonlyArray<Work>;
  shipped: ReadonlyArray<ShippedItem>;
}>;

type ContactLink = Readonly<{ label: string; href: string }>;

const LATEST_SHIPPED = 3;

export const contactLinks = (
  portfolio: Portfolio
): ReadonlyArray<ContactLink> => [
  ...Option.toArray(
    Option.map(known(portfolio.profile.email), (email) => ({
      href: `mailto:${email}`,
      label: copy.email,
    }))
  ),
  ...Option.toArray(
    Option.map(known(portfolio.links.github), (href) => ({
      href,
      label: copy.github,
    }))
  ),
  ...Option.toArray(
    Option.map(known(portfolio.links.linkedin), (href) => ({
      href,
      label: copy.linkedin,
    }))
  ),
  { href: copy.resumeHref, label: copy.resume },
];

export const trailMarker = <Message>(
  h: HtmlBuilder<Message>,
  work: Work
): Html =>
  h.span(
    [h.DataAttribute("depth", String(work.artifact.depth))],
    [copy.depthNames[work.artifact.depth]]
  );

const proofCard = <Message>(h: HtmlBuilder<Message>, work: Work): Html =>
  h.li(
    [],
    [
      h.a(
        [h.Href(workHref(work.caseStudy.slug))],
        [
          h.strong([], [work.artifact.proof.value]),
          " ",
          h.span([], [work.artifact.proof.label]),
          " ",
          h.span([], [`${copy.proofCta}: ${work.caseStudy.title}`]),
        ]
      ),
    ]
  );

const teaser = <Message>(h: HtmlBuilder<Message>, work: Work): Html =>
  h.li(
    [],
    [
      h.article(
        [],
        [
          trailMarker(h, work),
          h.p([], [h.code([], [work.artifact.name])]),
          h.h3(
            [],
            [
              h.a(
                [h.Href(workHref(work.caseStudy.slug))],
                [work.caseStudy.title]
              ),
            ]
          ),
          h.p([], [work.artifact.one_liner]),
        ]
      ),
    ]
  );

const shippedTeaser = <Message>(
  h: HtmlBuilder<Message>,
  item: ShippedItem
): Html =>
  h.li(
    [],
    [
      h.time([h.Attribute("datetime", item.periodEnd)], [item.periodEnd]),
      " ",
      h.span([], [`${item.area}: ${item.what}`]),
    ]
  );

export const homeView = <Message>(
  h: HtmlBuilder<Message>,
  content: HomeContent
): Html =>
  h.div(
    [],
    [
      h.section(
        [h.AriaLabelledBy("hero-heading")],
        [
          h.p(
            [],
            [
              Option.getOrElse(
                known(content.portfolio.profile.name),
                () => copy.heroLabel
              ),
            ]
          ),
          h.h1([h.Id("hero-heading")], [HEADLINE]),
          h.nav(
            [h.AriaLabel(copy.contactLinks)],
            [
              h.ul(
                [],
                contactLinks(content.portfolio).map((link) =>
                  h.li([], [h.a([h.Href(link.href)], [link.label])])
                )
              ),
            ]
          ),
          h.ul(
            [h.AriaLabel(copy.proofCards)],
            content.proofCards.map((work) => proofCard(h, work))
          ),
        ]
      ),
      h.section(
        [h.AriaLabelledBy("work-heading")],
        [
          h.p([], [copy.workLabel]),
          h.h2([h.Id("work-heading")], [copy.workHeading]),
          h.p([], [copy.workIntro]),
          h.ul(
            [],
            content.works.map((work) => teaser(h, work))
          ),
        ]
      ),
      h.section(
        [h.AriaLabelledBy("shipped-heading")],
        [
          h.p([], [copy.shippedLabel]),
          h.h2([h.Id("shipped-heading")], [copy.shippedHeading]),
          h.ul(
            [],
            content.shipped
              .slice(0, LATEST_SHIPPED)
              .map((item) => shippedTeaser(h, item))
          ),
          h.p([], [h.a([h.Href(shippedHref())], [copy.shippedAll])]),
        ]
      ),
    ]
  );

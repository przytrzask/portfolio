import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import type { Runtime, Update } from "foldkit";
import type { Document, Html, HtmlBuilder } from "foldkit/html";
import { defineMessageUnion } from "foldkit/message";
import { load, pushUrl, UrlRequest } from "foldkit/navigation";
import { modifyFields } from "foldkit/struct";
import { toString as urlToString, Url } from "foldkit/url";

import { shipped } from "./content/brag.ts";
import { findWork, works } from "./content/case-studies.ts";
import { portfolio } from "./content/portfolio.ts";
import { proofCards } from "./content/proof-cards.ts";
import { copy } from "./copy.ts";
import { homeView } from "./pages/home.ts";
import { shippedView } from "./pages/shipped.ts";
import { workView } from "./pages/work.ts";
import { AppRoute, urlToAppRoute } from "./route.ts";

export { AppRoute } from "./route.ts";

export const Model = Schema.Struct({
  route: AppRoute,
});

export type Model = typeof Model.Type;

export const Message = defineMessageUnion({
  ChangedUrl: { url: Url },
  ClickedLink: { request: UrlRequest },
  CompletedLoadExternal: {},
  CompletedNavigateInternal: {},
});

export type Message = typeof Message.Type;

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => ({
  model: { route: urlToAppRoute(url) },
});

const NavigateInternal = Command.define("NavigateInternal", {
  args: { url: Schema.String },
  execute: ({ url }) =>
    pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal())),
  messages: [Message.CompletedNavigateInternal],
});

const LoadExternal = Command.define("LoadExternal", {
  args: { href: Schema.String },
  execute: ({ href }) =>
    load(href).pipe(Effect.as(Message.CompletedLoadExternal())),
  messages: [Message.CompletedLoadExternal],
});

type UpdateReturn = Update.Return<Model, Message>;

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ChangedUrl: ({ url }) => ({
      model: modifyFields(model, { route: () => urlToAppRoute(url) }),
    }),
    ClickedLink: ({ request }) =>
      UrlRequest.match<UpdateReturn>(request, {
        External: ({ href }) => ({
          commands: [LoadExternal({ href })],
          model,
        }),
        Internal: ({ url }) => ({
          commands: [NavigateInternal({ url: urlToString(url) })],
          model,
        }),
      }),
    CompletedLoadExternal: () => ({ model }),
    CompletedNavigateInternal: () => ({ model }),
  });

const notFoundView = (h: HtmlBuilder<Message>, path: string): Html =>
  h.section(
    [],
    [h.h1([], [copy.notFoundTitle]), h.p([], [copy.notFoundBody(path)])]
  );

const pageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  AppRoute.match(model.route, {
    Home: () => homeView(h, { portfolio, proofCards, shipped, works }),
    NotFound: ({ path }) => notFoundView(h, path),
    Shipped: () => shippedView(h, { shipped, works }),
    Work: ({ slug }) => {
      const work = findWork(slug);

      return work === undefined
        ? notFoundView(h, `/work/${slug}`)
        : workView(h, work);
    },
  });

const pageTitle = (route: AppRoute): string =>
  AppRoute.match(route, {
    Home: () => copy.documentTitle,
    NotFound: () => `${copy.notFoundTitle} · ${copy.documentTitle}`,
    Shipped: () => copy.shippedTitle,
    Work: ({ slug }) => {
      const work = findWork(slug);

      return work === undefined
        ? `${copy.notFoundTitle} · ${copy.documentTitle}`
        : copy.workTitle(work.caseStudy.title);
    },
  });

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  body: h.main([h.Class("mx-auto max-w-3xl p-8")], [pageView(model, h)]),
  title: pageTitle(model.route),
});

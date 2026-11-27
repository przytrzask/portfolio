import { Effect, pipe, Schema } from "effect";
import { Command, Route } from "foldkit";
import type { Runtime, Update } from "foldkit";
import type { Document, Html, HtmlBuilder } from "foldkit/html";
import { defineMessageUnion } from "foldkit/message";
import { load, pushUrl, UrlRequest } from "foldkit/navigation";
import { defineRouteUnion } from "foldkit/route";
import { modifyFields } from "foldkit/struct";
import { toString as urlToString, Url } from "foldkit/url";

export const HEADLINE =
  "product engineer. I ship full stack features end to end and build the AI tooling that helps teams ship them.";

export const AppRoute = defineRouteUnion({
  Home: {},
  NotFound: { path: Schema.String },
});

export type AppRoute = typeof AppRoute.Type;

const homeRouter = pipe(Route.root, Route.mapTo(AppRoute.Home));

const urlToAppRoute = Route.parseUrlWithFallback(homeRouter, AppRoute.NotFound);

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

const pageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  AppRoute.match(model.route, {
    Home: () =>
      h.section(
        [h.Class("grid gap-6")],
        [h.h1([h.Class("text-4xl font-semibold tracking-tight")], [HEADLINE])]
      ),
    NotFound: ({ path }) =>
      h.section(
        [h.Class("grid gap-6")],
        [
          h.h1(
            [h.Class("text-4xl font-semibold tracking-tight")],
            ["Not found"]
          ),
          h.p([], [`Nothing lives at ${path}.`]),
        ]
      ),
  });

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  body: h.main(
    [h.Class("mx-auto grid min-h-screen max-w-3xl content-center p-8")],
    [pageView(model, h)]
  ),
  title: "Portfolio · product engineer",
});

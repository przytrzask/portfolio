import { pipe, Schema } from "effect";
import { Route } from "foldkit";
import { defineRouteUnion } from "foldkit/route";

export const AppRoute = defineRouteUnion({
  Home: {},
  NotFound: { path: Schema.String },
  Shipped: {},
  Work: { slug: Schema.String },
});

export type AppRoute = typeof AppRoute.Type;

export const homeRouter = pipe(Route.root, Route.mapTo(AppRoute.Home));

export const workRouter = pipe(
  Route.literal("work"),
  Route.slash(Route.string("slug")),
  Route.mapTo(AppRoute.Work)
);

export const shippedRouter = pipe(
  Route.literal("shipped"),
  Route.mapTo(AppRoute.Shipped)
);

export const urlToAppRoute = Route.parseUrlWithFallback(
  Route.oneOf(workRouter, shippedRouter, homeRouter),
  AppRoute.NotFound
);

export const workHref = (slug: string): string => workRouter({ slug });

export const shippedHref = (): string => shippedRouter();

export const homeHref = (): string => homeRouter();

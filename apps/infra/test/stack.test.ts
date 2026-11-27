import { NodeServices } from "@effect/platform-node";
import { describe, expect, it } from "@effect/vitest";
import { AuthProviders, Stage } from "alchemy";
import { AlchemyContextLive } from "alchemy/AlchemyContext";
import { tryFindProviderRegistrationByType } from "alchemy/Provider";
import { ConfigProvider, Effect, Layer, Option } from "effect";
import * as Digest from "effect/crypto/Digest";
import * as SecureRandom from "effect/crypto/SecureRandom";
import * as HttpClient from "effect/http/HttpClient";

import stack from "../alchemy.run.ts";

const offline = (env: Readonly<Record<string, string>>) =>
  Layer.mergeAll(
    AlchemyContextLive.pipe(
      Layer.provideMerge(
        Layer.mergeAll(
          NodeServices.layer,
          SecureRandom.layerWebCrypto,
          Digest.layerWebCrypto
        )
      )
    ),
    Layer.succeed(Stage, "prod"),
    Layer.succeed(AuthProviders, {}),
    ConfigProvider.layer(ConfigProvider.fromUnknown(env)),
    Layer.succeed(
      HttpClient.HttpClient,
      HttpClient.make(() => Effect.die("stack-test-must-not-call-cloud-api"))
    )
  );

const compile = (env: Readonly<Record<string, string>>) =>
  stack.pipe(Effect.provide(offline(env)));

const pullRequestEnv = {
  GITHUB_ACTIONS: "true",
  GITHUB_REPOSITORY: "przytrzask/portfolio",
  GITHUB_REPOSITORY_OWNER: "przytrzask",
  GITHUB_SHA: "0123456789abcdef0123456789abcdef01234567",
  PULL_REQUEST: "7",
};

describe("Portfolio stack", () => {
  it.effect("declares only the Website outside a pull request", () =>
    Effect.gen(function* declaresWebsiteOnly() {
      const compiled = yield* compile({});
      const resources = Object.values(compiled.resources);

      expect(
        resources.map((resource) => [resource.FQN, resource.Type])
      ).toEqual([["Website", "Cloudflare.Worker"]]);
    })
  );

  it.effect("adds the preview comment on a pull request", () =>
    Effect.gen(function* declaresPreviewComment() {
      const compiled = yield* compile(pullRequestEnv);
      const resources = Object.values(compiled.resources);

      expect(resources.map((resource) => resource.FQN).toSorted()).toEqual([
        "Website",
        "preview-comment",
      ]);
    })
  );

  it.effect("has a provider for every declared resource type", () =>
    Effect.gen(function* providesEveryResource() {
      const compiled = yield* compile(pullRequestEnv);

      for (const resource of Object.values(compiled.resources)) {
        const provider = yield* tryFindProviderRegistrationByType(
          resource.Type
        ).pipe(Effect.provideContext(compiled.services));

        expect(
          Option.isSome(provider),
          `${resource.FQN}: no provider for ${resource.Type}`
        ).toBe(true);
      }
    })
  );
});

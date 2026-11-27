// @effect-diagnostics nodeBuiltinImport:off -- A Vite build hook writes the emitted files into Vite's own output directory.
// @effect-diagnostics asyncFunction:off -- Vite's buildApp hook is a Promise-returning callback.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { Predicate, Schema } from "effect";
import type { Plugin } from "vite";

const BuildMetadata = Schema.Struct({
  clientDirectory: Schema.String,
  manifest: Schema.Struct({ prerendered: Schema.Array(Schema.String) }),
  serverEntry: Schema.String,
});

const StaticFiles = Schema.Array(
  Schema.Struct({ contents: Schema.String, path: Schema.String })
);

const decodeMetadata = Schema.decodeUnknownSync(BuildMetadata);

const decodeFiles = Schema.decodeUnknownSync(StaticFiles);

export const NOT_FOUND_PROBE = "http://localhost/404";

const foldkitMetadata = (plugins: ReadonlyArray<Plugin>) => {
  const foldkitBuild = plugins.find(
    (plugin) => plugin.name === "foldkit:build"
  );

  const api: unknown = foldkitBuild?.api;

  if (
    !Predicate.isObject(api) ||
    !("getBuildMetadata" in api) ||
    !Predicate.isFunction(api.getBuildMetadata)
  ) {
    throw new Error(
      "portfolio-emit-static needs the foldkit:build plugin with getBuildMetadata()."
    );
  }

  return decodeMetadata(api.getBuildMetadata());
};

const writeInto = async (root: string, path: string, contents: string) => {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents);
};

export const emitStatic = (): Plugin => ({
  apply: "build",
  buildApp: {
    async handler(builder) {
      const metadata = foldkitMetadata(builder.config.plugins);
      const entryUrl = pathToFileURL(metadata.serverEntry);
      entryUrl.searchParams.set("emit-static", randomUUID());
      const entry: unknown = await import(entryUrl.href);

      if (
        !Predicate.isObject(entry) ||
        !("staticFiles" in entry) ||
        !Predicate.isFunction(entry.staticFiles) ||
        !("default" in entry) ||
        !Predicate.isObject(entry.default) ||
        !("fetch" in entry.default) ||
        !Predicate.isFunction(entry.default.fetch)
      ) {
        throw new Error(
          "The server entry must export staticFiles and the Foldkit fetch handler."
        );
      }

      const files = decodeFiles(
        entry.staticFiles(metadata.manifest.prerendered)
      );

      await Promise.all(
        files.map((file) =>
          writeInto(metadata.clientDirectory, file.path, file.contents)
        )
      );

      const response: unknown = await entry.default.fetch(
        new Request(NOT_FOUND_PROBE, { headers: { accept: "text/html" } })
      );

      if (!(response instanceof Response) || response.status !== 404) {
        throw new Error(
          `The server entry must answer ${NOT_FOUND_PROBE} with 404 for 404.html.`
        );
      }

      await writeInto(
        metadata.clientDirectory,
        "/404.html",
        await response.text()
      );

      builder.config.logger.info(
        `  emitted ${[...files.map((file) => file.path), "/404.html"].join(", ")}`
      );
    },
    order: "post",
  },
  name: "portfolio-emit-static",
});

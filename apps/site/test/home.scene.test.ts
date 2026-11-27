import { expect, given, role, scene } from "foldkit/scene";
import { describe, test } from "vitest";

import { AppRoute, HEADLINE, update, view } from "../src/main.ts";

describe("home page", () => {
  test("leads with the product engineer headline", () => {
    scene(
      { update, view },
      given({ route: AppRoute.Home() }),
      expect(role("heading", { level: 1, name: HEADLINE })).toExist()
    );
  });
});

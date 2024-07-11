import assert from 'assert';
import { describe, it } from "node:test";
import "reflect-metadata";

import { Route, RouteMatcher } from "../src/router";

class EmptyView { }

describe("router", () => {
  describe("Route", () => {
    it("should match simple", () => {
      const route = new Route(["test"], EmptyView);

      const goodMatch = route.match(["test"]);
      assert.strictEqual(goodMatch.match, true);

      const badMatch = route.match(["pow"]);
      assert.strictEqual(badMatch.match, false);
    });

    it("should match no matter case", () => {
      const route = new Route(["test"], EmptyView);

      const goodMatch = route.match(["TeSt"]);
      assert.strictEqual(goodMatch.match, true);
    });

    it("should match with remaining", () => {
      const route = new Route(["test"], EmptyView);

      const goodMatch = route.match(["test", "pow"]);
      assert.strictEqual(goodMatch.match, true);
      assert.equal(goodMatch.remaining.length, 1);
    });

    it("should match with args", () => {
      const route = new Route(["test", ":arg"], EmptyView);

      const matchOn = ["test", "pow"];
      const goodMatch = route.match(matchOn);
      assert.strictEqual(goodMatch.match, true);
      assert.equal(route.getParams(matchOn)["arg"], "pow");
    });

    it("should match with multiple args", () => {
      const route = new Route(["test", ":arg1", ":arg2"], EmptyView);

      const matchOn = ["test", "pow", "hey"];
      const goodMatch = route.match(matchOn);
      assert.strictEqual(goodMatch.match, true);

      const params = route.getParams(matchOn);

      assert.equal(params["arg1"], "pow");
      assert.equal(params["arg2"], "hey");
    });

    it("should not match after args", () => {
      const route = new Route(["test", ":arg1", "match"], EmptyView);
      assert.strictEqual(route.match(["test", "anything", "nomatch"]).match, false);
      assert.strictEqual(route.match(["test", "anything", "match"]).match, true);
    });
  });

  describe("RouteMatcher", () => {
    it("should match first", () => {
      const rm = new RouteMatcher();
      rm.add("test/:arg1/match", EmptyView);
      rm.add("test/:arg1/match2", EmptyView);

      const match = rm.matches(["test", "pow", "match2"]);
      assert.strictEqual(match.matches, true);
      assert.deepStrictEqual(match.matchedOn, ["test", "pow", "match2"]);

      const noMatch = rm.matches(["test", "pow", "match3"]);
      assert.strictEqual(noMatch, null);

      const withRemaining = rm.matches(["test", "pow", "match2", "more", "matches"]);
      assert.strictEqual(withRemaining.matches, true);
      assert.deepStrictEqual(withRemaining.remaining, ["more", "matches"]);
    });
  });
});

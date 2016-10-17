import { assert } from "chai";

import { Route, RouteMatcher } from "../src/router";


class EmptyView { }

describe("router", () => {
  describe("Route", () => {
    it("should match simple", () => {
      const route = new Route(["test"], EmptyView);

      const goodMatch = route.match(["test"]);
      assert.isTrue(goodMatch.match);

      const badMatch = route.match(["pow"]);
      assert.isFalse(badMatch.match);
    });

    it("should match no matter case", () => {
      const route = new Route(["test"], EmptyView);

      const goodMatch = route.match(["TeSt"]);
      assert.isTrue(goodMatch.match);
    });

    it("should match with remaining", () => {
      const route = new Route(["test"], EmptyView);

      const goodMatch = route.match(["test", "pow"]);
      assert.isTrue(goodMatch.match);
      assert.equal(goodMatch.remaining.length, 1);
    });

    it("should match with args", () => {
      const route = new Route(["test", ":arg"], EmptyView);

      const matchOn = ["test", "pow"];
      const goodMatch = route.match(matchOn);
      assert.isTrue(goodMatch.match);
      assert.equal(route.getParams(matchOn)["arg"], "pow");
    });

    it("should match with multiple args", () => {
      const route = new Route(["test", ":arg1", ":arg2"], EmptyView);

      const matchOn = ["test", "pow", "hey"];
      const goodMatch = route.match(matchOn);
      assert.isTrue(goodMatch.match);

      const params = route.getParams(matchOn);

      assert.equal(params["arg1"], "pow");
      assert.equal(params["arg2"], "hey");
    });

    it("should not match after args", () => {
      const route = new Route(["test", ":arg1", "match"], EmptyView);
      assert.isFalse(route.match(["test", "anything", "nomatch"]).match);
      assert.isTrue(route.match(["test", "anything", "match"]).match);
    });
  });

  describe("RouteMatcher", () => {
    it("should match first", () => {
      const rm = new RouteMatcher();
      rm.add("test/:arg1/match", EmptyView);
      rm.add("test/:arg1/match2", EmptyView);

      const match = rm.matches(["test", "pow", "match2"]);
      assert.isTrue(match.matches);
      assert.deepEqual(match.matchedOn, [ "test", "pow", "match2"]);

      const noMatch = rm.matches(["test", "pow", "match3"]);
      assert.isNull(noMatch);

      const withRemaining = rm.matches(["test", "pow", "match2", "more", "matches"]);
      assert.isTrue(withRemaining.matches);
      assert.deepEqual(withRemaining.remaining, [ "more", "matches" ]);
    });
  });
});

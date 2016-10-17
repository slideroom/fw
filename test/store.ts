import { assert } from "chai";

import { dispatch, handle, Store } from "../src/store";
import { ContainerInstance } from "../src/container";


const wait = (n: number) => new Promise((res) => setTimeout(res, n));

class TestAction {
  constructor(public hi: string) { }
}

class AnotherTestAction {
  constructor(public hi: string) { }
}

class AnotherTestHandlerWrapper {
  public called = false;

  async handle(method: () => Promise<void>, arg) {
    this.called = true;
    await method();
  }
}

class TestStore extends Store<{ hi: string }> {
  defaultState() {
    return { hi: "" };
  }

  @handle(TestAction)
  private async handleTestAction(t: TestAction) {
    await wait(5);
    this.setState({ hi: t.hi });
  }

  @handle(AnotherTestAction, AnotherTestHandlerWrapper)
  private async handleAnotherTestAction(t: AnotherTestAction) {
    await wait(5);
    this.setState({ hi: t.hi });
  }
}

describe("store", () => {
  describe("handlers", () => {
    it("should handle", async () => {
      const testStore = ContainerInstance.get(TestStore);
      await dispatch(new TestAction("pow"));
      assert(testStore.state.hi == "pow");
    });
  });

  describe("handler wrappers", () => {
    it("should call the wrapper and then set the state", async () => {
      const testStore = ContainerInstance.get(TestStore);
      const anotherTestHandlerWrapper = ContainerInstance.get(AnotherTestHandlerWrapper);
      await dispatch(new AnotherTestAction("whammy"));

      assert(anotherTestHandlerWrapper.called == true, "wrapper wasn't called");
      assert(testStore.state.hi == "whammy", "state not set");
    });
  });

  describe("onStateChanged", () => {
    it("should call when state changed", async () => {
      let called = false;
      const testStore = ContainerInstance.get(TestStore);

      testStore.onStateChanged(() => {
        called = true;
      });

      await dispatch(new TestAction("powow"));

      assert(called == true);
    });

    it("should unsubscribe", async () => {
      let called = 0;
      const testStore = ContainerInstance.get(TestStore);

      const unsub = testStore.onStateChanged(() => {
        called += 1;
      });

      await dispatch(new TestAction("powow"));
      unsub.dispose();
      await dispatch(new TestAction("powow"));

      assert(called == 1);
    });
  });
});


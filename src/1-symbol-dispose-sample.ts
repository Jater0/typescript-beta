import "core-js/modules/esnext.symbol.dispose.js";
import "core-js/modules/esnext.symbol.async-dispose.js";
import "core-js/modules/esnext.disposable-stack.constructor.js";

import { test } from 'node:test';
import { deepEqual } from "node:assert";

function createDisposable(onDispose: () => void): Disposable {
  return {
    [Symbol.dispose]() {
      onDispose();
    }
  }
}

function createAsyncDisposable(onAsyncDispose: () => void): AsyncDisposable {
  return {
    async [Symbol.asyncDispose]() {
      return new Promise<void>(resolve => setTimeout(() => {
        onAsyncDispose();
        resolve();
      }, 16));
    }
  }
}

function disposeSample1(): string[] {
  const order: string[] = [];
  {
    order.push("start");
    using dispose_1 = createDisposable(() => order.push("dispose_1"));
    using dispose_2 = createDisposable(() => order.push("dispose_2"));
    {
      using dispose_3 = createDisposable(() => order.push("dispose_3"));
    }
    order.push("end");
  }
  // Output: ["start", "dispose_3", "end", "dispose_2", "dispose_1"];
  return order;
}

async function asyncDisposeSample(): Promise<string[]> {
  const result: string[] = [];
  {
    result.push("start");
    await using a1 = createAsyncDisposable(() => result.push("a1"));
    result.push("a1-a2");
    await using a2 = createAsyncDisposable(() => result.push("a2"));
    {
      await using a3 = createAsyncDisposable(() => result.push("a3"));
    }
    result.push("end")
  }
  result.push("out");
  return result;
}

test("disposable", () => {
  const order: string[] = disposeSample1();
  deepEqual(order, [
    "start",
    "dispose_3",
    "end",
    "dispose_2",
    "dispose_1"
  ]);
});

test("async-dispose", async () => {
  const order: string[] = await asyncDisposeSample();
  deepEqual(order, [
    "start",
    "a1-a2",
    "a3",
    "end",
    "a2",
    "a1",
    "out"
  ]);
});
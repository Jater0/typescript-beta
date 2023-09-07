import "core-js/modules/esnext.symbol.dispose.js";
import "core-js/modules/esnext.symbol.async-dispose.js";
import "core-js/modules/esnext.disposable-stack.constructor.js";

function disposableStackDemo() {
  const result: string[] = [];
  using stack = new DisposableStack();
  result.push("start");
  stack.use(((): Disposable => {
    return {
      [Symbol.dispose]() {
        result.push("s1");
      }
    }
  })());
  stack.use(((): Disposable => {
    return {
      [Symbol.dispose]() {
        result.push("s2");
      }
    }
  })());
  result.push("end");
  return result;
}

function main() {
  const result = disposableStackDemo();
  console.log(result);
}

/**
 * Will Output: ["start", "end", "s2", "s1"]
 */
main();
import "core-js/modules/esnext.symbol.dispose.js";
import "core-js/modules/esnext.symbol.async-dispose.js";
import "core-js/modules/esnext.disposable-stack.constructor.js";

class Logger implements AsyncDisposable {
  #flag: number;

  constructor(flag: number) {
    this.#flag = flag;
  }

  speak(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve(console.log(`[LOG] ${this.#flag}`))
      }, 20);
    });
  }

  [Symbol.asyncDispose](): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve(console.log(`[LOG.DISPOSE] ${this.#flag}`));
      }, 20);
    });
  }
}

async function main() {
  await using log1 = new Logger(1);
  {
    await using log2 = new Logger(2);
    await using log3 = new Logger(3);
    await log1.speak();
  }
  await using log4 = new Logger(4);
  await log1.speak();
}

/**
 * Will Output:
    [LOG] 1
    [LOG.DISPOSE] 3
    [LOG.DISPOSE] 2
    [LOG] 1
    [LOG.DISPOSE] 4
    [LOG.DISPOSE] 1
 */
main();
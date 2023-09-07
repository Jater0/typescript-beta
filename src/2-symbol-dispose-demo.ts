import "core-js/modules/esnext.symbol.dispose.js";
import "core-js/modules/esnext.symbol.async-dispose.js";
import "core-js/modules/esnext.disposable-stack.constructor.js";

function logger(flag: number): Disposable {
  console.log("LOGGER-", flag);
  return {
    [Symbol.dispose]() {
      console.log("Dispose-", flag);
    }
  }
}

class Logger implements Disposable {
  #flag: number;

  constructor(flag: number) {
    this.#flag = flag;
  }

  speak() {
    console.log(`[LOG] ${this.#flag}`);
  }

  [Symbol.dispose](): void {
    console.log(`[LOG.DISPOSE] ${this.#flag}`);
  }
}

// function main() {
//   using log1 = logger(1);
//   {
//     using log2 = logger(2);
//     using log3 = logger(3);
//   }
//   using log4 = logger(4);
// }

function main() {
  using log1 = new Logger(1);
  {
    using log2 = new Logger(2);
    using log3 = new Logger(3);
    log1.speak();
  }
  using log4 = new Logger(4);
  log1.speak();
}

main();
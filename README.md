# Typescript 5.2 Previews

## How to run it
``` sh
npm install
npx tsc
node lib/xxxx.js
```

## Features

### 1. `using`关键字和显示的资源管理

Typescript的团队成员[rbuckton](https://github.com/rbuckton)主导的TC39提案[proposal-explicit-resource-management](https://github.com/tc39/proposal-explicit-resource-management)在2023年的3月的TC39会议上已经进入了Stage 3阶段, 这就意味着它将会成为ECMAScript Next的一员, 所以rbuckton在Typescript 5.2 beta中添加了对应的支持.

Explict Resource Management 提案旨在为 JavaScript 中引入显式的资源管理能力, 如对内存、I/O、文件描述符等资源的分配与显式释放.

显示资源管理意味着, 用户可以主动声明块级作用域内依赖的资源管理, 通过<u>Symbol.dispose</u>这样的命令式或`using`这样的声明式, 然后在离开作用域时就能够由运行时自动地释放这些标记的资源.

在此前, Javascript中并不存在标准的资源管理能力, 如以下的函数:

``` js
function * g() {
  const handle = acquireFileHandle();
  try {
    ...
  }
  finally {
    handle.release(); // 释放资源
  }
}

const obj = g();
try {
  const r = obj.next();
  ...
}
finally {
  obj.return(); // 显式调用函数 g 中的 finally 代码块
}
```

在我们执行完生成器函数后, 需要使用`obj.return()`来显示地调用**g()**函数中的**finally**代码块, 才能确保文件句柄被正确释放.

类似的, 还有NodeJs中对文件描述符的操作(fs.openSync):

``` ts
export function doSomeWork() {
    const path = ".some_temp_file";
    const file = fs.openSync(path, "w+");

    try {
        if (someCondition()) {
            return;
        }
    }
    finally {
        fs.closeSync(file);
        fs.unlinkSync(path);
    }
}
```

这些资源释放的逻辑其实的没有必要的, 正常来说, 这些向操作系统申请的资源应该在代码离开当前作用域时就被释放, 而不需要显示的操作. 因此此提案提出使用`using`关键字, 来声明仅在当前作用内使用的资源:

``` js
function * g() {
  using handle = acquireFileHandle(); // 定义与代码块关联的资源
}

{
  using obj = g(); // 显式声明资源
  const r = obj.next();
} // 自动调用释放逻辑


{
  using handlerSync = openSync();
  await using handlerSync = openAsync(); // 同样支持异步的资源声明
} // 自动调用释放逻辑
```



#### Dispose & Disposable

``` ts
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

/**
 * Will Output:
 *	 [LOG] 1
 *   [LOG.DISPOSE] 3
 *   [LOG.DISPOSE] 2
 *   [LOG] 1
 *   [LOG.DISPOSE] 4
 *   [LOG.DISPOSE] 1
 */
main();
```



#### AsyncDispose & AsyncDisposable

``` ts
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
```



#### DisposableStack

``` ts
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
```



#### 如何支持这个特性

1. 在项目中添加这个依赖

``` shell
npm install core-js
```

2. tsconfig.json的内容

``` json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "ESNext"],
    // ....
  }
}
```

2. 将下面的代码块添加到ts文件中

``` ts
import "core-js/modules/esnext.symbol.dispose.js";
import "core-js/modules/esnext.symbol.async-dispose.js";
import "core-js/modules/esnext.disposable-stack.constructor.js";
```


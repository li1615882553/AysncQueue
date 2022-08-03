# AsyncQueue
一个支持串行执行，并行执行，并且支持限制最大并行数量的异步任务队列。
# 安装

# API文档
- ***then***

串行执行一个同步或异步函数，默认前一个函数返回值作为下一个函数的参数。
```ts
let asyncFun = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(time);
    }, time * 1000)
  })
}

asyncQueue.then(async () => {
  await asyncFun(1);
  return await asyncFun(2);
})
asyncQueue.then((value) => {
  console.log(value); //2
})
```
**返回值**

`Promise<T>`返回当前函数已经执行完的`Promise`对象

- ***limitQueue***

限制并行上限的异步执行任务(前后任务没有参数依赖关系)

**Parameters**

1. callbacks 异步或同步函数队列
2. limit 每次并行调用最大的数量

```ts
let callbacks = [];
for (let i = 0; i < 10; i++) {
  callbacks.push(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(i);
        resolve(i);
      }, 1000)
    });
  })
}
asyncQueue.limitQueue(callbacks, 3)
```
**返回值**

`Promise<T>`返回当前所有函数已执行完成的`Promise`对象




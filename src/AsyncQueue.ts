/**异步队列,用于串行或并行执行多个任务 */
export default class AsyncQueue implements PromiseLike<any> {
  /** 正在执行的第一个异步任务 */
  private _firstTask?: {
    readonly callback: (value?: any) => any
    readonly resolve: (value: any) => void
    readonly reject: (reason: any) => void
    promise?: Promise<any>
    next?: AsyncQueue["_firstTask"]
  }

  /** 正在执行的最后一个异步任务 */
  private _lastTask?: AsyncQueue["_firstTask"]

  /**
   * 串行执行一个同步或异步函数  默认前一个函数返回值作为下一个函数的参数
   * @param callback 待执行的函数
   * @returns 返回表示当前函数已执行完成的Promise对象
   */
  then<T>(callback: (value?: any) => T | Promise<T>) {
    let curPro = new Promise<T>((resolve, reject) => {
      const nextTask = { callback, resolve, reject }
      if (this._lastTask) {
        this._lastTask.promise.then(async value => {
          try {
            this._firstTask = this._firstTask.next;
            resolve(await callback(value))
          } catch (e) {
            reject(e)
          }
        })
        this._lastTask.next = this._lastTask = nextTask;
      } else {
        this._firstTask = this._lastTask = nextTask
        this._startChain(this._lastTask);
      }
    })
    return this._lastTask.promise = curPro;
  }

  /** 开始执行任务 */
  private async _startChain({ resolve, reject, callback }) {
    try {
      resolve(await callback())
    } catch (e) {
      reject(e)
    }
  }

  /**
   * 限制并行上限的异步执行任务(前后任务没有参数依赖关系)
   * @param callbacks 异步或同步函数队列
   * @param limit 每次并行调用最大的数量
   * @returns 返回当前所有函数已执行完成的Promise对象
   */
  limitQueue<T>(callbacks: (() => T | Promise<T>)[], limit?: number) {
    limit = limit == undefined || limit <= 0 ? Infinity : limit;
    const sequence = callbacks.slice(0, callbacks.length);
    const makePromise = (callback, index) => {
      return new Promise(async (resolve, reject) => {
        resolve(await callback())
      }).then(() => {
        return index;
      });
    };
    //如果limit为Infinity,则直接使用Promise.all实现
    let promises = sequence.splice(0, Math.min(limit, sequence.length)).map((callback, index) => {
      return makePromise(callback, index);
    });
    // 利用数组的 reduce 方法来以队列的形式执行
    return sequence.reduce((last, callback) => {
      return last.then(() => {
        // 返回最快改变状态的 Promise
        return Promise.race(promises)
      }).catch(err => {
        console.error(err)
      }).then((res) => {
        // 用新的 Promise 替换掉最快改变状态的 Promise
        promises[res] = makePromise(callback, res);
      })
    }, Promise.resolve()).then(() => {
      return Promise.all(promises)
    })
  } 
}
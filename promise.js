/**
 * 注意事项
 * 1. resolve不能使用this，因为resolve是直接调用的
 * 2. 捕获new Promise参数函数产生的异常
 *
 * @param {有两个参数的函数，这两个参数也为函数} executor
 */
function Promise(executor) {
  // 添加属性
  this.PromiseState = "pending";
  this.PromiseResult = null;
  //then参数的方法
  this.callbacks = [];
  // 因为resolve函数在index.htlm是直接调用的，直接调用的this 是window
  const self = this;

  /**
   *
   * @param {resolve函数参数，在new Promise时被调用} data
   * @returns
   */
  function resolve(data) {
    //判断PromiseState 是否被修改过，让PromiseState 只能被修改一次
    if (self.PromiseState !== "pending") return;
    // 1 修改对象状态
    self.PromiseState = "fulfilled"; //resolved
    // 2 设置对象结果值(promiseResult)
    self.PromiseResult = data;
    //调用成功的回调函数
    self.callbacks.forEach((item) => {
      item.onResolved(data);
    });
  }
  function reject(data) {
    if (self.PromiseState !== "pending") return;
    self.PromiseState = "rejected"; //resolved
    self.PromiseResult = data;
    self.callbacks.forEach((item) => {
      item.onRejected(data);
    });
  }

  //捕获new Promise参数函数产生的异常
  try {
    executor(resolve, reject);
  } catch (error) {
    reject(error);
  }

  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this;
    //判断回调函数参数
    if (typeof onRejected !== "function") {
      onRejected = (reason) => {
        throw reason;
      };
    }
    if (typeof onResolved !== "function") {
      onResolved = (value) => value;
    }
    return new Promise((resolve, reject) => {
      //封装函数
      function callback(type) {
        //如果result是Promise对象
        try {
          //result是作为参数的onResolved函数的结果

          //this在函数里面直接调用的，this是指向window的
          // let result = type(this.PromiseResult);
          let result = type(self.PromiseResult);
          if (result instanceof Promise) {
            result.then(
              (v) => {
                resolve(v);
              },
              (r) => {
                reject(r);
              }
            );
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      }

      //根据状态执行
      if (this.PromiseState === "fulfilled") {
        callback(onResolved);
      }
      if (this.PromiseState === "rejected") {
        callback(onRejected);
      }
      //判断pending 状态，当Promise为异步时
      if (this.PromiseState === "pending") {
        //保存回调函数
        this.callbacks.push({
          onResolved: function () {
            callback(onResolved);
          },
          onRejected: function () {
            callback(onRejected);
          },
        });
      }
    });
  };
}

Promise.prototype.catch = function (onRejected) {
  return this.then(undefined, onRejected);
};

export function hookFunc (obj: any, funcName: string, newFunc: (func: Function, args: any[]) => any) {
  var old = obj[funcName]
  obj[funcName] = function (...args: any[]) {
    return newFunc.call(this, old.bind(this), args)
  }
}

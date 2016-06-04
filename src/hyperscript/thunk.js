import {h} from './h'

function copyToThunk (vnode, thunk) {
  thunk.elm = vnode.elm
  vnode.data.fn = thunk.data.fn
  vnode.data.args = thunk.data.args
  thunk.data = vnode.data
  thunk.children = vnode.children
  thunk.text = vnode.text
  thunk.elm = vnode.elm
}

function init (thunk) {
  var cur = thunk.data
  var vnode = cur.fn.apply(void 0, cur.args)
  copyToThunk(vnode, thunk)
}

function prepatch (oldVnode, thunk) {
  let old = oldVnode.data
  let cur = thunk.data
  let oldArgs = old.args
  let args = cur.args
  if (old.fn !== cur.fn || oldArgs.length !== args.length) {
    copyToThunk(cur.fn.apply(void 0, args), thunk)
  }
  for (let i = 0; i < args.length; ++i) {
    if (oldArgs[i] !== args[i]) {
      copyToThunk(cur.fn.apply(void 0, args), thunk)
      return
    }
  }
  copyToThunk(oldVnode, thunk)
}

export function thunk (sel, key, fn, args) {
  if (args === void 0) {
    args = fn
    fn = key
    key = void 0
  }
  return h(sel, {
    key: key,
    hook: {init: init, prepatch: prepatch},
    fn: fn,
    args: args
  })
}

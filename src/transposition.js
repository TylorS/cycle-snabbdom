import {Observable as $} from 'rx'

function createVTree (vNode, children) {
  return {
    sel: vNode.sel,
    data: vNode.data,
    text: vNode.text,
    elm: vNode.elm,
    key: vNode.key,
    children
  }
}

export function transposeVNode (vNode) { // eslint-disable-line complexity
  if (vNode && vNode.data && vNode.data.static) {
    return $.just(vNode)
  } else if (typeof vNode.subscribe === 'function') {
    return vNode.map(transposeVNode).switch()
  } else if (vNode !== null && typeof vNode === 'object') {
    if (!vNode.children || vNode.children.length === 0) {
      return $.just(vNode)
    }

    return $.combineLatest(
      vNode.children.map(transposeVNode),
      (...children) => createVTree(vNode, children)
    )
  } else {
    throw new TypeError('transposition: Unhandled vNode type')
  }
}

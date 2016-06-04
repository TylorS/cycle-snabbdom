import is from 'snabbdom/is'
const vnode = require('snabbdom/vnode')

function isStream (stream) {
  return typeof stream.subscribe === 'function'
}

function mutateStreamWithNS (vNode) {
  addNS(vNode.data, vNode.children)
  return vNode
}

function addNS (data, children) { // eslint-disable-line complexity
  data.ns = 'http://www.w3.org/2000/svg'
  if (typeof children !== 'undefined' && is.array(children)) {
    for (let i = 0; i < children.length; ++i) {
      if (isStream(children[i])) {
        children[i] = children[i].map(mutateStreamWithNS)
      } else {
        addNS(children[i].data, children[i].children)
      }
    }
  }
}

export function h (sel, b, c) { // eslint-disable-line complexity
  let data = {}
  let children
  let text
  let i
  if (arguments.length === 3) {
    data = b
    if (is.array(c)) {
      children = c
    } else if (is.primitive(c)) {
      text = c
    }
  } else if (arguments.length === 2) {
    if (is.array(b)) {
      children = b
    } else if (is.primitive(b)) {
      text = b
    } else {
      data = b
    }
  }
  if (is.array(children)) {
    children = children.filter(x => x) // handle null/undef children
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i])
      }
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children)
  }
  return vnode(sel, data, children, text, undefined)
};

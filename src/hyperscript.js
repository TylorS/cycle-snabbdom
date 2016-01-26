import VNode from 'snabbdom/vnode'
import is from 'snabbdom/is'

const isObservable = x => typeof x.subscribe === `function`

const addNSToObservable = vNode => {
  addNS(vNode.data, vNode.children) // eslint-disable-line
}

function addNS(data, children) {
  data.ns = `http://www.w3.org/2000/svg`
  if (typeof children !== `undefined` && is.array(children)) {
    for (let i = 0; i < children.length; ++i) {
      if (isObservable(children[i])) {
        children[i] = children[i].tap(addNSToObservable)
      } else {
        addNS(children[i].data, children[i].children)
      }
    }
  }
}

/* eslint-disable */
function h(sel, b, c) {
  var data = {}, children, text, i;
  if (arguments.length === 3) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
  } else if (arguments.length === 2) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else { data = b; }
  }
  if (is.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children);
  }
  return VNode(sel, data, children, text, undefined);
};

/* eslint-enable */

export default h

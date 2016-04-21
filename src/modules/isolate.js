function setScope(elm, data, scope) {
  if (data.ns) { // is SVG
    elm.setAttribute(`cycleIsolate`, scope)
  } else {
    elm.dataset.cycleIsolate = scope
  }
}

function removeScope(elm, data, scope) {
  if (data.ns) { // is SVG
    elm.removeAttribute(`cycleIsolate`, scope)
  } else {
    delete elm.dataset.cycleIsolate
  }
}

function update(oldVNode, vNode) {
  const {data: oldData = {}} = oldVNode
  const {elm, data = {}} = vNode

  const oldIsolate = oldData.isolate || ``
  const isolate = data.isolate || ``

  if (isolate && isolate !== oldIsolate) {
    setScope(elm, data, isolate)
  }
  if (oldIsolate && !isolate) {
    removeScope(elm, data, isolate)
  }
}

const IsolateModule = {
  // init: (vNode) => update({}, vNode),
  create: update,
  update,
}

export {IsolateModule}

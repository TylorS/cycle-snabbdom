let isolatedElements = {}

export const getIsolatedElements = () => isolatedElements
export const resetIsolatedElements = () => { isolatedElements = {} }

export function isIsolatedElement(elm) {
  const keys = Object.keys(isolatedElements)
  for (let i = 0; i < keys.length; ++i) {
    if (elm === isolatedElements[keys[i]]) {
      return keys[i].trim()
    }
  }
  return false
}

function setScope(elm, scope) {
  isolatedElements[scope] = elm
}

function removeScope(scope) {
  delete isolatedElements[scope]
}

function update(oldVNode, vNode) {
  const {data: oldData = {}} = oldVNode
  const {elm, data = {}} = vNode

  const oldIsolate = oldData.isolate || ``
  const isolate = data.isolate || ``

  if (isolate) {
    removeScope(oldIsolate)
    setScope(elm, isolate)
  }
  if (oldIsolate && !isolate) {
    removeScope(isolate)
  }
}

function remove({data = {}}, cb) {
  if (data.isolate) {
    removeScope(data.isolate)
  }
  cb()
}

function destroy({data = {}}) {
  if (data.isolate) {
    removeScope(data.isolate)
  }
}

const IsolateModule = {
  // init: (vNode) => update({}, vNode),
  create: update,
  update,
  remove,
  destroy,
}

export {IsolateModule}

import {init} from 'snabbdom'

import {DOMSource} from './DOMSource'
import {VNodeWrapper} from './VNodeWrapper'
import {IsolateModule} from './isolate/module'
import defaultModules from './modules'
import {transposeVNode} from './transposition'
import {getElement} from './util'

function makeDOMDriverInputGuard (modules) {
  if (!Array.isArray(modules)) {
    throw new Error('Optional modules option must be ' +
      'an array for snabbdom modules')
  }
}

function domDriverInputGuard (view$) { // eslint-disable-line complexity
  if (!view$ || typeof view$.subscribe !== 'function') // eslint-disable-line brace-style
  {
    throw new Error('The DOM driver function expects as input an Observable ' +
      'of virtual DOM elements')
  }
}

export function makeDOMDriver (container, options = {}) {
  const transposition = options.transposition || false
  const modules = options.modules || defaultModules
  const isolateModule = new IsolateModule(new Map([]))
  const patch = init([isolateModule.createModule()].concat(modules))
  const rootElement = getElement(container)
  const vNodeWrapper = new VNodeWrapper(rootElement)
  const delegators = new Map([])
  makeDOMDriverInputGuard(modules)

  return function DOMDriver (vNode$) {
    domDriverInputGuard(vNode$)
    const preprocessedVNode$ = transposition
      ? vNode$.map(transposeVNode).switch()
      : vNode$

    const rootElement$ = preprocessedVNode$
      .map(vNode => vNodeWrapper.call(vNode))
      .scan(patch, rootElement)
      .startWith(rootElement)
      .map(vNode => vNode.elm || vNode)
      .replay(null, 1)

    rootElement$.connect()

    return new DOMSource(rootElement$, [], isolateModule, delegators)
  }
}

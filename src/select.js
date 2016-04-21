import {SCOPE_PREFIX, getScope, getSelectors} from './utils'
import {makeEventsSelector} from './events'
import {isolateSource, isolateSink} from './isolate'
import {makeIsStrictlyInRootScope} from './makeIsStrictlyInRootScope'
import {getIsolatedElements, isIsolatedElement} from './modules/isolate'

let matchesSelector
try {
  matchesSelector = require(`matches-selector`)
} catch (e) {
  matchesSelector = () => {}
}

function sortIsolatedNamespace(a) {
  return a.indexOf(SCOPE_PREFIX) !== -1 ? 1 : -1
}

function makeFindElements(namespace) {
  return function findElements(rootElement) {
    if (namespace.join(``) === ``) {
      return rootElement
    }
    const slice = Array.prototype.slice

    const scope = getScope(namespace).slice(-1).join(` `).trim()
    const selector = getSelectors(namespace).join(` `)
    let topNode = rootElement
    let topNodeMatches = []

    if (scope.length > 0) {
      topNode = getIsolatedElements()[scope]
      if (matchesSelector(topNode, selector)) {
        topNodeMatches.push(topNode)
      }
    }

    return slice.call(topNode.querySelectorAll(selector))
      .filter(makeIsStrictlyInRootScope(scope))
      .concat(topNodeMatches)
  }
}

function makeElementSelector(rootElement$, namespace) {
  return function elementSelector(selector) {
    if (typeof selector !== `string`) {
      throw new Error(`DOM driver's select() expects the argument to be a ` +
        `string as a CSS selector`)
    }

    const trimmedSelector = selector.trim()
    const childNamespace = trimmedSelector === `:root` ?
      namespace :
      namespace.concat(trimmedSelector).sort(sortIsolatedNamespace)

    return {
      observable: rootElement$.map(makeFindElements(childNamespace)),
      namespace: childNamespace,
      select: makeElementSelector(rootElement$, childNamespace),
      events: makeEventsSelector(rootElement$, childNamespace),
      isolateSource,
      isolateSink,
    }
  }
}

export {makeElementSelector, makeIsStrictlyInRootScope}

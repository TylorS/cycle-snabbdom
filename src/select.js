import {makeEventsSelector} from './events'
import {isolateSource, isolateSink} from './isolate'

let matchesSelector
try {
  matchesSelector = require(`matches-selector`)
} catch (e) {
  matchesSelector = () => {}
}

function getIsolate(el) {
  if (el instanceof SVGElement) {
    return el.getAttribute(`cycle-isolate`)
  }
  return el.dataset.cycleIsolate || null
}

function makeIsStrictlyInRootScope(namespace) {
  return function isStrictlyInRootScope(leaf) {
    for (let el = leaf; el; el = el.parentElement) {
      const isolate = getIsolate(el)
      const selector = `[data-cycle-isolate="${isolate}"]`
      if (isolate && namespace.indexOf(selector) === -1) {
        return false
      }
      if (isolate && namespace.indexOf(selector) !== -1) {
        return true
      }
    }
    return true
  }
}

const getScope = namespace =>
  namespace.filter(c => c.indexOf(`[data-cycle-isolate=`) > -1)

const getSelectors = namespace =>
  namespace.filter(c => c.indexOf(`[data-cycle-isolate=`) === -1)

function sortIsolatedNamespace(a) {
  return a.indexOf(`[`) !== -1 ? 1 : -1
}

function makeFindElements(namespace) {
  return function findElements(rootElement) {
    if (namespace.join(``) === ``) {
      return rootElement
    }
    const slice = Array.prototype.slice

    const scope = getScope(namespace).join(` `)
    const selector = getSelectors(namespace).join(` `)
    let topNode = rootElement
    let topNodeMatches = []

    if (scope.length > 0) {
      topNode = rootElement.querySelector(scope) || rootElement
      if (matchesSelector(topNode, selector)) {
        topNodeMatches.push(topNode)
      }
    }

    return slice.call(topNode.querySelectorAll(selector))
      .concat(topNodeMatches)
      .filter(makeIsStrictlyInRootScope(namespace))
  }
}

function makeElementSelector(rootElement$) {
  return function elementSelector(selector) {
    if (typeof selector !== `string`) {
      throw new Error(`DOM driver's select() expects the argument to be a ` +
        `string as a CSS selector`)
    }

    const namespace = this.namespace
    const trimmedSelector = selector.trim()
    const childNamespace = trimmedSelector === `:root` ?
      namespace :
      namespace.concat(trimmedSelector).sort(sortIsolatedNamespace)

    return {
      observable: rootElement$.map(makeFindElements(childNamespace)),
      namespace: childNamespace,
      select: makeElementSelector(rootElement$),
      events: makeEventsSelector(rootElement$, childNamespace),
      isolateSource,
      isolateSink,
    }
  }
}

export {makeElementSelector, makeIsStrictlyInRootScope}

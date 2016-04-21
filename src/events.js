import {fromEvent} from './fromEvent'
import {makeIsStrictlyInRootScope} from './makeIsStrictlyInRootScope'
import {getScope, getSelectors} from './utils'
let matchesSelector
try {
  matchesSelector = require(`matches-selector`)
} catch (e) {
  matchesSelector = () => {}
}

const eventTypesThatDontBubble = [
  `load`,
  `unload`,
  `focus`,
  `blur`,
  `mouseenter`,
  `mouseleave`,
  `submit`,
  `change`,
  `reset`,
  `timeupdate`,
  `playing`,
  `waiting`,
  `seeking`,
  `seeked`,
  `ended`,
  `loadedmetadata`,
  `loadeddata`,
  `canplay`,
  `canplaythrough`,
  `durationchange`,
  `play`,
  `pause`,
  `ratechange`,
  `volumechange`,
  `suspend`,
  `emptied`,
  `stalled`,
]

function maybeMutateEventPropagationAttributes(event) {
  if (!event.hasOwnProperty(`propagationHasBeenStopped`)) {
    event.propagationHasBeenStopped = false
    const oldStopPropagation = event.stopPropagation
    event.stopPropagation = function stopPropagation() {
      oldStopPropagation.call(this)
      this.propagationHasBeenStopped = true
    }
  }
}

function mutateEventCurrentTarget(event, currentTargetElement) {
  try {
    Object.defineProperty(event, `currentTarget`, {
      value: currentTargetElement,
      configurable: true,
    })
  } catch (err) {
    console.log(`please use event.ownerTarget`)
  }
  event.ownerTarget = currentTargetElement
}

function makeSimulateBubbling(namespace, rootEl) {
  const scope = getScope(namespace).slice(-1).join(` `).trim()
  const isStrictlyInRootScope = makeIsStrictlyInRootScope(scope)
  const selector = getSelectors(namespace).join(` `)
  const roof = rootEl.parentElement

  return function simulateBubbling(ev) {
    maybeMutateEventPropagationAttributes(ev)
    if (ev.propagationHasBeenStopped) {
      return false
    }
    for (let el = ev.target; el && el !== roof; el = el.parentElement) {
      if (!isStrictlyInRootScope(el)) {
        continue
      }
      if (matchesSelector(el, selector)) {
        mutateEventCurrentTarget(ev, el)
        return true
      }
    }
    return false
  }
}

function makeEventsSelector(rootElement$, namespace) {
  return function eventsSelector(type, options = {}) {
    if (typeof type !== `string`) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`)
    }
    let useCapture = false
    if (eventTypesThatDontBubble.indexOf(type) !== -1) {
      useCapture = true
    }
    if (typeof options.useCapture === `boolean`) {
      useCapture = options.useCapture
    }

    return rootElement$
      .first()
      .flatMapLatest(rootElement => {
        if (!namespace || namespace.length === 0) {
          return fromEvent(rootElement, type, useCapture)
        }
        const simulateBubbling = makeSimulateBubbling(namespace, rootElement)
        return fromEvent(rootElement, type, useCapture)
          .filter(simulateBubbling)
      })
      .share()
  }
}

export {makeEventsSelector}

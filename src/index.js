import {Observable} from 'rx'
import snabbdom from 'snabbdom'
import h from 'snabbdom/h';
import {getDomElement} from './utils'
import fromEvent from './fromEvent'
import parseTree from './parseTree'

function makeEventsSelector(element$) {
  return function events(eventName, useCapture = false) {
    if (typeof eventName !== `string`) {
      throw new Error(`DOM driver's events() expects argument to be a ` +
        `string representing the event type to listen for.`)
    }
    return element$.flatMapLatest(element => {
      if (!element) {
        return Rx.Observable.empty()
      }
      return fromEvent(element, eventName, useCapture)
    }).share()
  }
}

function makeElementSelector(rootElem$) {
  return function select(selector) {
    if (typeof selector !== `string`) {
      throw new Error(`DOM driver's select() expects first argument to be a ` +
        `string as a CSS selector`)
    }
    let element$ = selector.trim() === `:root` ? rootElem$ :
      rootElem$.map(rootElem => {
        return rootElem.querySelectorAll(selector)
      })
    return {
      observable: element$,
      events: makeEventsSelector(element$),
    }
  }
}

function makeDOMDriver(container, modules = [
  require(`snabbdom/modules/class`),
  require(`snabbdom/modules/props`),
  require(`snabbdom/modules/attributes`),
  require(`snabbdom/modules/style`),
]) {

  const patch = snabbdom.init(modules)
  const rootElem = getDomElement(container)

  return function DOMDriver(view$) {

    const rootElem$ = view$
      .flatMapLatest(parseTree)
      .flatMap(view => {
        // dirty dirty hack to workaround snabbdom bug
        // TODO: FIX!!!!
        rootElem.innerHTML = ''
        let renderContainer = document.createElement(`div`)
        rootElem.appendChild(renderContainer)
        patch(renderContainer, view)
        return Observable.just(rootElem)
      }).replay(null, 1)

    rootElem$.connect()
    rootElem$.subscribe()

    return {
      select: makeElementSelector(rootElem$)
    }

  }

}

export {makeDOMDriver, h};

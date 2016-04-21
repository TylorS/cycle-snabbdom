import {Observable} from 'rx'

function fromEvent(element, eventName, useCapture = false) {
  return Observable.create((observer) => {
    const next = event => observer.onNext(event)
    element.addEventListener(eventName, next, useCapture)

    return () => element.removeEventListener(eventName, next, useCapture)
  }).share()
}

export {fromEvent}

import {Observable} from 'rx'

export function fromEvent (eventType, node, useCapture) {
  return Observable.create((observer) => {
    const listener = ev => observer.next(ev)

    node.addEventListener(eventType, listener, useCapture)

    return () => node.removeEventListener(eventType, listener, useCapture)
  })
}

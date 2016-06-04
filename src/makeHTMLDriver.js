import {Observable} from 'rx'
import toHtml from 'snabbdom-to-html'

import {transposeVNode} from './transposition'

class HTMLSource {
  constructor (vNode$) {
    this._html$ = vNode$.last().map(toHtml)
  }

  get elements () {
    return this._html$
  }

  select () {
    return new HTMLSource(Observable.empty())
  }

  events () {
    return Observable.empty()
  }
}

export function makeHTMLDriver (options = {}) {
  const transposition = options.transposition || false
  return function htmlDriver (vNode$) {
    const preprocessedVNode$ = transposition
      ? vNode$.map(transposeVNode).switch()
      : vNode$
    return new HTMLSource(preprocessedVNode$)
  }
}

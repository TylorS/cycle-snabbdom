import Rx from 'rx'
import map from 'fast.js/array/map'

const combineVTreeStreams =
  (vTree, ...children) => ({
    sel: vTree.sel,
    data: vTree.data,
    text: vTree.text,
    elm: vTree.elm,
    key: vTree.key,
    children,
  })

const parseTree =
  vTree => {
    if (vTree.observe) {
      return vTree.flatMap(parseTree)
    } else if (`object` === typeof vTree) {
      const vtree$ = Rx.Observable.just(vTree)
      if (vTree.children && vTree.children.length > 0) {
        return Rx.Observable.combineLatest(
          vtree$,
          ...map(vTree.children, parseTree),
          combineVTreeStreams
        )
      }
      return vtree$
    } else {
      throw new Error(`Unhandled tree value`)
    }
  }

export default parseTree

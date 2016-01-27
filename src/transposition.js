import Rx from 'rx'

function transposeVTree(vTree) {
  if (!vTree) {
    return null
  } else if (typeof vTree.data === `object` && vTree.data.static) {
    return Rx.Observable.just(vTree)
  } else if (typeof vTree.subscribe === `function`) {
    return vTree.flatMapLatest(transposeVTree)
  } else if (typeof vTree === `object`) {
    if (vTree.children && vTree.children.length > 0) {
      return Rx.Observable.combineLatest(
        vTree.children.map(transposeVTree).filter(x => x !== null),
        (...children) => ({
          sel: vTree.sel,
          data: vTree.data,
          text: vTree.text,
          elm: vTree.elm,
          key: vTree.key,
          children,
        })
      )
    }
    return Rx.Observable.just(vTree)
  } else {
    throw new Error(`Unhandled vTree Value`)
  }
}

export {transposeVTree}

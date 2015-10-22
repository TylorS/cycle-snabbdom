import Rx from 'rx'

function parseTree(vTree) {
  // Child is a observable
  if (vTree.subscribe) {
    return vTree.flatMap(parseTree)
  } else if (`object` === typeof vTree && Array.isArray(vTree.children) &&
    vTree.children.length > 0)
  {
    return Rx.Observable
      .combineLatest(vTree.children.map(parseTree), (...children) => {
        return {
          sel: vTree.sel,
          data: vTree.data,
          children: children,
          text: vTree.text,
          elm: vTree.elm,
        }
      })
  } else if (`object` === typeof vTree) {
    return Rx.Observable.just(vTree)
  } else {
    throw new Error('Unhandled tree value')
  }
}

export default parseTree;
export {parseTree};

import {SCOPE_PREFIX} from '../util'

export function isolateSource (source, scope) {
  return source.select(SCOPE_PREFIX + scope)
}

export function isolateSink (sink, scope) {
  return sink.do(vTree => {
    if (vTree.data.isolate) {
      const existingScope =
        parseInt(vTree.data.isolate.split(SCOPE_PREFIX + 'cycle')[1])

      const _scope = parseInt(scope.split('cycle')[1])

      if (Number.isNaN(existingScope) ||
          Number.isNaN(_scope) ||
          existingScope > _scope
      ) {
        return vTree
      }
    }
    vTree.data.isolate = SCOPE_PREFIX + scope
  })
}

import {SCOPE_PREFIX} from './utils'

const isolateSource = (source, scope) =>
  source.select(SCOPE_PREFIX + scope)

const isolateSink = (sink, scope) =>
  sink.tap(vTree => { vTree.data.isolate = SCOPE_PREFIX + scope })

export {isolateSink, isolateSource}

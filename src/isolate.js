import {SCOPE_PREFIX} from './utils'

const isolateSource = (source, scope) =>
  source.select(`[data-${SCOPE_PREFIX}="${scope}"]`)

const isolateSink = (sink, scope) =>
  sink.tap(vTree => { vTree.data.isolate = scope })

export {isolateSink, isolateSource}

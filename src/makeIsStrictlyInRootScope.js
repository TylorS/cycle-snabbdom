import {isIsolatedElement} from './modules/isolate'

export function makeIsStrictlyInRootScope(scope) {
  return function isStrictlyInRootScope(leaf) {
    for (let el = leaf; el; el = el.parentElement) {
      const _scope = isIsolatedElement(el)
      if (_scope && _scope !== scope) {
        return false
      }
      if (_scope) {
        return true
      }
    }
    return true
  }
}

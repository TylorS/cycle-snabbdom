'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function parseTree(vTree) {
  // Child is a observable
  if (vTree.subscribe) {
    return vTree.flatMap(parseTree);
  } else if ('object' === typeof vTree && Array.isArray(vTree.children) && vTree.children.length > 0) {
    return _rx2['default'].Observable.combineLatest(vTree.children.map(parseTree), function () {
      for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
        children[_key] = arguments[_key];
      }

      return {
        sel: vTree.sel,
        data: vTree.data,
        children: children,
        text: vTree.text,
        elm: vTree.elm
      };
    });
  } else if ('object' === typeof vTree) {
    return _rx2['default'].Observable.just(vTree);
  } else {
    throw new Error('Unhandled tree value');
  }
}

exports['default'] = parseTree;
exports.parseTree = parseTree;
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _cycleCore = require('@cycle/core');

var _incrementalDom = require('incremental-dom');

var _jsxToIdom = require('jsx-to-idom');

var _utils = require('./../utils');

var _parseTree = require('./../parseTree');

;

function renderIDOM(_container, _markup) {
  (0, _incrementalDom.patch)(_container, function () {
    (0, _jsxToIdom.render)(_markup);
  });
}

function makeRenderToDOM$(rootElem) {
  return function renderToDOM$(idomTree) {

    var rootElem$ = _cycleCore.Rx.Observable.just(rootElem);

    renderIDOM(rootElem, idomTree);

    return rootElem$;
  };
}

function makeRootElem$(view$, container) {
  var renderToDOM$ = makeRenderToDOM$(container);

  return view$.flatMapLatest(_parseTree.parseTree).flatMap(renderToDOM$);
}

function makeIDOMDriver(container) {
  // Default place to patch in the dom`
  var rootElement = (0, _utils.getDomElement)(container);

  return function IDOMDriver(view$) {
    var rootElem$ = makeRootElem$(view$, rootElement);
    rootElem$.subscribe();
    return {
      select: (0, _utils.makeElementSelector)(rootElem$)
    };
  };
}

exports['default'] = makeIDOMDriver;
exports.makeIDOMDriver = makeIDOMDriver;
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rx = require('rx');

var _snabbdom = require('snabbdom');

var _snabbdom2 = _interopRequireDefault(_snabbdom);

var _snabbdomH = require('snabbdom/h');

var _snabbdomH2 = _interopRequireDefault(_snabbdomH);

var _utils = require('./utils');

var _fromEvent = require('./fromEvent');

var _fromEvent2 = _interopRequireDefault(_fromEvent);

var _parseTree = require('./parseTree');

var _parseTree2 = _interopRequireDefault(_parseTree);

function makeEventsSelector(element$) {
  return function events(eventName) {
    var useCapture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    if (typeof eventName !== 'string') {
      throw new Error('DOM driver\'s events() expects argument to be a ' + 'string representing the event type to listen for.');
    }
    return element$.flatMapLatest(function (element) {
      if (!element) {
        return Rx.Observable.empty();
      }
      return (0, _fromEvent2['default'])(element, eventName, useCapture);
    }).share();
  };
}

function makeElementSelector(rootElem$) {
  return function select(selector) {
    if (typeof selector !== 'string') {
      throw new Error('DOM driver\'s select() expects first argument to be a ' + 'string as a CSS selector');
    }
    var element$ = selector.trim() === ':root' ? rootElem$ : rootElem$.map(function (rootElem) {
      return rootElem.querySelectorAll(selector);
    });
    return {
      observable: element$,
      events: makeEventsSelector(element$)
    };
  };
}

function makeDOMDriver(container) {
  var modules = arguments.length <= 1 || arguments[1] === undefined ? [require('snabbdom/modules/class'), require('snabbdom/modules/props'), require('snabbdom/modules/attributes'), require('snabbdom/modules/style')] : arguments[1];

  var patch = _snabbdom2['default'].init(modules);
  var rootElem = (0, _utils.getDomElement)(container);

  return function DOMDriver(view$) {

    var rootElem$ = view$.flatMapLatest(_parseTree2['default']).flatMap(function (view) {
      // dirty dirty hack to workaround snabbdom bug
      // TODO: FIX!!!!
      rootElem.innerHTML = '';
      var renderContainer = document.createElement('div');
      rootElem.appendChild(renderContainer);
      patch(renderContainer, view);
      return _rx.Observable.just(rootElem);
    }).replay(null, 1);

    rootElem$.connect();
    rootElem$.subscribe();

    return {
      select: makeElementSelector(rootElem$)
    };
  };
}

exports.makeDOMDriver = makeDOMDriver;
exports.h = _snabbdomH2['default'];
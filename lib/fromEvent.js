"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Rx = require("rx");

var disposableCreate = Rx.Disposable.create;
var CompositeDisposable = Rx.CompositeDisposable;
var AnonymousObservable = Rx.AnonymousObservable;

function createListener(_ref) {
  var element = _ref.element;
  var eventName = _ref.eventName;
  var handler = _ref.handler;
  var useCapture = _ref.useCapture;

  if (element.addEventListener) {
    element.addEventListener(eventName, handler, useCapture);
    return disposableCreate(function removeEventListener() {
      element.removeEventListener(eventName, handler, useCapture);
    });
  }
  throw new Error("No listener found");
}

function createEventListener(_ref2) {
  var element = _ref2.element;
  var eventName = _ref2.eventName;
  var handler = _ref2.handler;
  var useCapture = _ref2.useCapture;

  var disposables = new CompositeDisposable();

  var toStr = Object.prototype.toString;
  if (toStr.call(element) === "[object NodeList]" || toStr.call(element) === "[object HTMLCollection]") {
    for (var i = 0, len = element.length; i < len; i++) {
      disposables.add(createEventListener({
        element: element.item(i),
        eventName: eventName,
        handler: handler,
        useCapture: useCapture }));
    }
  } else if (element) {
    disposables.add(createListener({ element: element, eventName: eventName, handler: handler, useCapture: useCapture }));
  }
  return disposables;
}

function fromEvent(element, eventName) {
  var useCapture = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  return new AnonymousObservable(function subscribe(observer) {
    return createEventListener({
      element: element,
      eventName: eventName,
      handler: function handler() {
        observer.onNext(arguments[0]);
      },
      useCapture: useCapture });
  }).publish().refCount();
}

exports["default"] = fromEvent;
module.exports = exports["default"];
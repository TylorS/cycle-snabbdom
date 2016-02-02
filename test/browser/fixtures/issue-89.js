'use strict';
let CycleDOM = require('../../../src');
let Rx = require('rx');
let {h} = CycleDOM;

function myElement(content) {
  return Rx.Observable.just(content).map(content =>
    h('h3.myelementclass', content)
  );
}

function makeModelNumber$() {
  return Rx.Observable.merge(
    Rx.Observable.just(123).delay(50),
    Rx.Observable.just(456).delay(100)
  );
}

function viewWithContainerFn(number$) {
  return number$.map(number =>
    h('div', [
      myElement(String(number))
    ])
  );
}

function viewWithoutContainerFn(number$) {
  return number$.map(number =>
    myElement(String(number))
  );
}

module.exports = {
  myElement,
  makeModelNumber$,
  viewWithContainerFn,
  viewWithoutContainerFn
};

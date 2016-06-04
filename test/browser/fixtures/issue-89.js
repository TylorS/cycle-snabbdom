'use strict'
let CycleDOM = require('../../../src/index')
let Observable = require('rx').Observable
let {h} = CycleDOM

function myElement (content) {
  return Observable.of(content).map(content =>
    h('h3.myelementclass', content)
  )
}

function makeModelNumber$ () {
  return Observable.merge(
    Observable.of(123).delay(50),
    Observable.of(456).delay(100)
  )
}

function viewWithContainerFn (number$) {
  return number$.map(number =>
    h('div', [
      myElement(String(number))
    ])
  )
}

function viewWithoutContainerFn (number$) {
  return number$.map(number =>
    myElement(String(number))
  )
}

module.exports = {
  myElement,
  makeModelNumber$,
  viewWithContainerFn,
  viewWithoutContainerFn
}

'use strict'
/* global describe, it */
let assert = require('assert')
let {Observable} = require('rx')
let CycleDOM = require('../../src/index')
let mockDOMSource = CycleDOM.mockDOMSource

describe('mockDOMSource', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof CycleDOM.mockDOMSource, 'function')
  })

  it('should make an Observable for clicks on `.foo`', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Observable.of(135)
      }
    })
    userEvents.select('.foo').events('click')
      .subscribe(ev => {
        assert.strictEqual(ev, 135)
        done()
      })
  })

  it('should make multiple user event Observables', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Observable.of(135)
      },
      '.bar': {
        'scroll': Observable.of(2)
      }
    })
    Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.bar').events('scroll'),
      (a, b) => a * b
    ).subscribe(ev => {
      assert.strictEqual(ev, 270)
      done()
    }, err => done(err))
  })

  it('should make multiple user event Observables on the same selector', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Observable.of(135),
        'scroll': Observable.of(3)
      }
    })
    Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll'),
      (a, b) => a * b
    ).subscribe(ev => {
      assert.strictEqual(ev, 405)
      done()
    }, done)
  })

  it('should return an empty Observable if query does not match', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Observable.of(135)
      }
    })
    userEvents.select('.impossible').events('scroll')
      .subscribe(done, done, () => done())
  })

  it('should return empty Observable for select().elements and none is defined', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Observable.of(135)
      }
    })
    userEvents.select('.foo').elements
      .subscribe(done, done, () => done())
  })

  it('should return defined Observable for select().elements', function (done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: Observable.of(135)
      }
    })
    mockedDOMSource.select('.foo').elements
      .subscribe(ev => {
        assert.strictEqual(ev, 135)
        done()
      }, done)
  })
  it('should return defined Observable when chaining .select()', function (done) {
    const mockedDOMSource = mockDOMSource({
      '.bar': {
        '.foo': {
          '.baz': {
            elements: Observable.of(135)
          }
        }
      }
    })
    mockedDOMSource.select('.bar').select('.foo').select('.baz').elements
      .subscribe(ev => {
        assert.strictEqual(ev, 135)
        done()
      }, done)
  })

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const DOM = mockDOMSource({})
      DOM.select('.something').select('.other').events('click')
    })
  })

  it('multiple .select()s should return empty observable if not defined', () => {
    const DOM = mockDOMSource({})
    const selector = DOM.select('.something').select('.other')
    assert.strictEqual(selector.events('click') instanceof Observable, true)
    assert.strictEqual(selector.elements instanceof Observable, true)
  })
})

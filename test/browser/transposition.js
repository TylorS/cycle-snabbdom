'use strict'
/* global describe, it */
let assert = require('assert')
let Cycle = require('@cycle/core')
let CycleDOM = require('../../src/index')
let Fixture89 = require('./fixtures/issue-89')
let Observable = require('rx').Observable
let {html} = require('snabbdom-jsx') // eslint-disable-line no-unused-vars
let {svg, div, p, h3, h4, makeDOMDriver} = CycleDOM

function createRenderTarget (id = null) {
  let element = document.createElement('div')
  element.className = 'cycletest'
  if (id) {
    element.id = id
  }
  document.body.appendChild(element)
  return element
}

describe('DOM rendering with transposition', function () {
  it('should accept a view wrapping a VTree$ (#89)', function (done) {
    function app () {
      const number$ = Fixture89.makeModelNumber$()
      return {
        DOM: Fixture89.viewWithContainerFn(number$)
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select('.myelementclass').elements.skip(1).take(1) // 1st
      .subscribe(function (elements) {
        const myelement = elements[0]
        assert.notStrictEqual(myelement, null)
        assert.strictEqual(myelement.tagName, 'H3')
        assert.strictEqual(myelement.textContent, '123')
      })

    sources.DOM.select('.myelementclass').elements.skip(2).take(1) // 2nd
      .subscribe(function (elements) {
        const myelement = elements[0]
        assert.notStrictEqual(myelement, null)
        assert.strictEqual(myelement.tagName, 'H3')
        assert.strictEqual(myelement.textContent, '456')
        setTimeout(() => {
          sinks.dispose()
          done()
        })
      })
  })

  it('should accept a view with VTree$ as the root of VTree', function (done) {
    function app () {
      const number$ = Fixture89.makeModelNumber$()
      return {
        DOM: Fixture89.viewWithoutContainerFn(number$)
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select('.myelementclass').elements.skip(1).take(1) // 1st
      .subscribe(function (elements) {
        const myelement = elements[0]
        assert.notStrictEqual(myelement, null)
        assert.strictEqual(myelement.tagName, 'H3')
        assert.strictEqual(myelement.textContent, '123')
      })
    sources.DOM.select('.myelementclass').elements.skip(2).take(1) // 1st
      .subscribe(function (elements) {
        const myelement = elements[0]
        assert.notStrictEqual(myelement, null)
        assert.strictEqual(myelement.tagName, 'H3')
        assert.strictEqual(myelement.textContent, '456')
        setTimeout(() => {
          sinks.dispose()
          done()
        })
      })
  })

  it('should render a VTree with a child Observable<VTree>', function (done) {
    function app () {
      const child$ = Observable.of(
        h4('.child', {}, 'I am a kid')
      ).delay(80)
      return {
        DOM: Observable.of(div('.my-class', [
          p({}, 'Ordinary paragraph'),
          child$
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.child')
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, 'undefined')
      assert.strictEqual(selectEl.tagName, 'H4')
      assert.strictEqual(selectEl.textContent, 'I am a kid')
      setTimeout(() => {
        sinks.dispose()
        done()
      })
    })
  })

  it('should render a VTree with a grandchild Observable<VTree>', function (done) {
    function app () {
      const grandchild$ = Observable.of(
          h4('.grandchild', {}, [
            'I am a baby'
          ])
        ).delay(20)
      const child$ = Observable.of(
          h3('.child', {}, [
            'I am a kid',
            grandchild$
          ])
        ).delay(80)
      return {
        DOM: Observable.of(div('.my-class', [
          p({}, 'Ordinary paragraph'),
          child$
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.grandchild')
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, 'undefined')
      assert.strictEqual(selectEl.tagName, 'H4')
      assert.strictEqual(selectEl.textContent, 'I am a baby')
      setTimeout(() => {
        sinks.dispose()
        done()
      })
    })
  })

  it('should render a SVG VTree with a child Observable<VTree>', function (done) {
    function app () {
      const child$ = Observable.of(
        svg.g({
          attrs: {'class': 'child'}
        })
      ).delay(80)
      return {
        DOM: Observable.of(svg([
          svg.g(),
          child$
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.child')
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, 'undefined')
      assert.strictEqual(selectEl.tagName, 'g')
      setTimeout(() => {
        sinks.dispose()
        done()
      })
    })
  })

  it('should only be concerned with values from the most recent nested Observable', function (done) {
    function app () {
      return {
        DOM: Observable.of(
          div([
            Observable.of(1).concat(Observable.of(2).delay(5)).map(outer =>
              Observable.of(1).concat(Observable.of(2).delay(10)).map(inner =>
                div('.target', outer + '/' + inner)
              )
            )
          ])
        )
      }
    }

    const {sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    let expected = ['1/1', '2/1', '2/2']

    sources.DOM.select('.target').elements
      .skip(1)
      .take(3)
      .map(els => els[0].innerHTML)
      .subscribe((x) => {
        assert.strictEqual(x, expected.shift())
      }, done, () => done())
  })
})

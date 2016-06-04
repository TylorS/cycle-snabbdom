'use strict'
/* global describe, it */
let assert = require('assert')
let Cycle = require('@cycle/core')
let CycleDOM = require('../../src/index')
let Observable = require('rx').Observable
let {html} = require('snabbdom-jsx') // eslint-disable-line no-unused-vars
let {div, h2, h4, select, option, thunk, makeDOMDriver} = CycleDOM

function createRenderTarget (id = null) {
  let element = document.createElement('div')
  element.className = 'cycletest'
  if (id) {
    element.id = id
  }
  document.body.appendChild(element)
  return element
}

describe('DOM Rendering', function () {
  it('should render DOM elements even when DOMSource is not utilized', function (done) {
    function main () {
      return {
        DOM: Observable.of(
          div('.my-render-only-container', [
            h2('Cycle.js framework')
          ])
        )
      }
    }

    Cycle.run(main, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    setTimeout(() => {
      const myContainer = document.querySelector('.my-render-only-container')
      assert.notStrictEqual(myContainer, null)
      assert.notStrictEqual(typeof myContainer, 'undefined')
      assert.strictEqual(myContainer.tagName, 'DIV')
      const header = myContainer.querySelector('h2')
      assert.notStrictEqual(header, null)
      assert.notStrictEqual(typeof header, 'undefined')
      assert.strictEqual(header.textContent, 'Cycle.js framework')
      done()
    }, 150)
  })

  it('should convert a simple virtual-dom <select> to DOM element', function (done) {
    function app () {
      return {
        DOM: Observable.of(select('.my-class', [
          option({value: 'foo'}, 'Foo'),
          option({value: 'bar'}, 'Bar'),
          option({value: 'baz'}, 'Baz')
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class')
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, 'undefined')
      assert.strictEqual(selectEl.tagName, 'SELECT')
      setTimeout(() => {
        sinks.dispose()
        sources.dispose()
        done()
      })
    })
  })

  it('should convert a simple virtual-dom <select> (JSX) to DOM element', function (done) {
    function app () {
      return {
        DOM: Observable.of(
          <select className='my-class'>
            <option value='foo'>Foo</option>
            <option value='bar'>Bar</option>
            <option value='baz'>Baz</option>
          </select>
        )
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class')
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, 'undefined')
      assert.strictEqual(selectEl.tagName, 'SELECT')
      setTimeout(() => {
        sinks.dispose()
        sources.dispose()
        done()
      })
    })
  })

  it('should allow snabbdom Thunks in the VTree', function (done) {
    function renderThunk (greeting) {
      return h4('Constantly ' + greeting)
    }

    // The Cycle.js app
    function app () {
      return {
        DOM: Observable.interval(10).take(5).map(i =>
          div([
            thunk('h4', renderThunk, ['hello' + 0])
          ])
        )
      }
    }

    // Run it
    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Assert it
    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('h4')
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, 'undefined')
      assert.strictEqual(selectEl.tagName, 'H4')
      assert.strictEqual(selectEl.textContent, 'Constantly hello0')
      sources.dispose()
      sinks.dispose()
      done()
    })
  })

  it('should filter out null/undefined children', function (done) {
    // The Cycle.js app
    function app () {
      return {
        DOM: Observable.interval(10).take(5).map(i =>
          div('.parent', [
            'Child 1',
            null,
            h4('.child3', [
              null,
              'Grandchild 31',
              div('.grandchild32', [
                null,
                'Great grandchild 322'
              ])
            ]),
            undefined
          ])
        )
      }
    }

    // Run it
    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Assert it
    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      assert.strictEqual(root.querySelector('div.parent').childNodes.length, 2)
      assert.strictEqual(root.querySelector('h4.child3').childNodes.length, 2)
      assert.strictEqual(root.querySelector('div.grandchild32').childNodes.length, 1)
      sinks.dispose()
      sources.dispose()
      done()
    })
  })
})

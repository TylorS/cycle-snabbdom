'use strict'
/* global describe, it */
let assert = require('assert')
let Cycle = require('@cycle/core')
let CycleDOM = require('../../src/index')
let Observable = require('rx').Observable
let {svg, div, p, span, h2, h3, h4, makeDOMDriver} = CycleDOM

function createRenderTarget (id = null) {
  let element = document.createElement('div')
  element.className = 'cycletest'
  if (id) {
    element.id = id
  }
  document.body.appendChild(element)
  return element
}

describe('DOMSource.select()', function () {
  it('should have Observable `:root` in DOM source', function (done) {
    function app () {
      return {
        DOM: Observable.of(
          div('.top-most', [
            p('Foo'),
            span('Bar')
          ])
        )
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const classNameRegex = /top\-most/
      assert.strictEqual(root.tagName, 'DIV')
      const child = root.children[0]
      assert.notStrictEqual(classNameRegex.exec(child.className), null)
      assert.strictEqual(classNameRegex.exec(child.className)[0], 'top-most')
      setTimeout(() => {
        sinks.dispose()
        done()
      })
    })
  })

  it('should return an object with observable and events()', function (done) {
    function app () {
      return {
        DOM: Observable.of(h3('.myelementclass', 'Foobar'))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Make assertions
    const selection = sources.DOM.select('.myelementclass')
    assert.strictEqual(typeof selection, 'object')
    assert.strictEqual(typeof selection.elements, 'object')
    assert.strictEqual(typeof selection.elements.subscribe, 'function')
    assert.strictEqual(typeof selection.events, 'function')
    sinks.dispose()
    done()
  })

  it('should have an observable of DOM elements', function (done) {
    function app () {
      return {
        DOM: Observable.of(h3('.myelementclass', 'Foobar'))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Make assertions
    sources.DOM.select('.myelementclass').elements.skip(1).take(1)
      .subscribe(elements => {
        assert.notStrictEqual(elements, null)
        assert.notStrictEqual(typeof elements, 'undefined')
        // Is an Array
        assert.strictEqual(Array.isArray(elements), true)
        assert.strictEqual(elements.length, 1)
        // Array with the H3 element
        assert.strictEqual(elements[0].tagName, 'H3')
        assert.strictEqual(elements[0].textContent, 'Foobar')
        setTimeout(() => {
          sinks.dispose()
          done()
        })
      })
  })

  it('should not select element outside the given scope', function (done) {
    function app () {
      return {
        DOM: Observable.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.foo', [
              h4('.bar', 'Correct')
            ])
          ])
        )
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Make assertions
    sources.DOM.select('.foo').select('.bar').elements.skip(1).take(1)
      .subscribe(elements => {
        assert.strictEqual(elements.length, 1)
        const element = elements[0]
        assert.notStrictEqual(element, null)
        assert.notStrictEqual(typeof element, 'undefined')
        assert.strictEqual(element.tagName, 'H4')
        assert.strictEqual(element.textContent, 'Correct')
        setTimeout(() => {
          sinks.dispose()
          done()
        })
      })
  })

  it('should select svg element', function (done) {
    function app () {
      return {
        DOM: Observable.of(
          svg({width: 150, height: 150}, [
            svg.polygon({
              attrs: {
                class: 'triangle',
                points: '20 0 20 150 150 20'
              }
            })
          ])
        )
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Make assertions
    sources.DOM.select('.triangle').elements.skip(1).take(1)
      .subscribe(elements => {
        assert.strictEqual(elements.length, 1)
        const triangleElement = elements[0]
        assert.notStrictEqual(triangleElement, null)
        assert.notStrictEqual(typeof triangleElement, 'undefined')
        assert.strictEqual(triangleElement.tagName, 'polygon')
        sinks.dispose()
        done()
      })
  })
})

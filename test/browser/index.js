/* global describe, it, beforeEach */
import assert from 'assert'
import { run } from '@cycle/core'
import { makeDOMDriver, div, p, span, h3 } from '../../src'
import Rx from 'rx'

function click(el){
    var ev = document.createEvent("MouseEvent")
    ev.initMouseEvent(
        "click",
        true /* bubble */, true /* cancelable */,
        window, null,
        0, 0, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    )
    el.dispatchEvent(ev)
}

function createRenderTarget( id = null ) {
  let element = document.createElement('div')
  element.className = 'cycletest'
  if (id) {
    element.id = id
  }
  document.body.appendChild(element)
  return element
}

describe('Rendering', () => {
  describe('makeDomDriver', () => {
    it('should accept a DOM element as input', () => {
      assert.doesNotThrow(() => makeDOMDriver( createRenderTarget() ) )
    })

    it('should accept a DocumentFragment as input', () => {
      let element = document.createDocumentFragment()
      assert.doesNotThrow(() => makeDOMDriver( element ) )
    })

    it('should accept a string selection to an existing element as input', () => {
      let id = 'testShouldAcceptSelectorToExisting'
      let element = createRenderTarget( id )
      assert.doesNotThrow( () => makeDOMDriver( `#${id}` ) )
    })
  })

  describe('DOM Driver', () => {
    it('should throw if input is not an Observable<VTree>', function () {
      let domDriver = makeDOMDriver(createRenderTarget())
      assert.throws(function () {
        domDriver({})
      }, /The DOM driver function expects as input an Observable of virtual/)
    })

    it('should have Observable ":root" in response', function (done) {
      function app() {
        return {
          DOM: Rx.Observable.just(
            div('.top-most', [
              p('Foo'),
              span('Bar')
            ])
          )
        }
      }
      let [sinks, sources] = run(app, {
        DOM: makeDOMDriver(createRenderTarget('fuckThisTest'))
      })

      sources.DOM.select(':root').observable.subscribe(root => {
        let classNameRegex = /top\-most/
        assert.strictEqual(root.tagName, 'DIV')
        assert.notStrictEqual(classNameRegex.exec(root.className), null)
        assert.strictEqual(classNameRegex.exec(root.className)[0], 'top-most')
        done()
      })
    })
  })
  it('should catch interactions coming from wrapped view', done => {
    const app = () => ({
      DOM: Rx.Observable.just(
        div('#top-most', [
          h3('.myelementclass', {}, 'Foobar')
        ])
      )
    })

    const [sinks, sources] = run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.myelementclass').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      done()
    })

    sources.DOM.select(':root').observable.subscribe(root => {
      let myElement = root.querySelector('.myelementclass')
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.doesNotThrow(() => {
        click(myElement)
        myElement.click()
      })
    })
  })

  it('should render child observable vTrees', done => {
    const app = () => ({
      DOM: Rx.Observable.just(
        div('#top-most', [
          Rx.Observable.just(
            h3('.myelementclass', {}, 'Foobar')
          )
        ])
      )
    })

    const [sinks, sources] = run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select(':root').observable.subscribe(root => {
      assert.strictEqual(root.tagName, 'DIV')
      assert.strictEqual(root.id, 'top-most')
      let myElement = root.children[0]
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.strictEqual(myElement.textContent, 'Foobar')
      done()
    })
  })

  it('should render when child stream children === undefined', done => {
    const app = () => ({
      DOM: Rx.Observable.just(
        div('#top-most', [
          Rx.Observable.just(
            h3('.myelementclass', {}, 'Foobar')
          )
        ])
      )
    })

    const [sinks, sources] = run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select(':root').observable.subscribe(root => {
      assert.strictEqual(root.tagName, 'DIV')
      assert.strictEqual(root.id, 'top-most')
      let myElement = root.children[0]
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.strictEqual(myElement.textContent, 'Foobar')
      done()
    })
  })

  it('should render properly when child is null', done => {
    const app = () => ({
      DOM: Rx.Observable.just(
        div('#top-most', [
          Rx.Observable.just(
            div([
              h3('.myelementclass', {}, 'Foobar'),
              null,
              h3('Baz')
            ])
          )
        ])
      )
    })

    const [sinks, sources] = run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select(':root').observable.subscribe(root => {
      assert.strictEqual(root.tagName, 'DIV')
      assert.strictEqual(root.id, 'top-most')
      let child = root.children[0]
      assert.notStrictEqual(child, null)
      assert.notStrictEqual(typeof child, 'undefined')
      assert.strictEqual(child.tagName, 'DIV')
      let grandchildren = child.children
      //first grandchild
      assert.notStrictEqual(grandchildren, null)
      assert.notStrictEqual(typeof grandchildren, 'undefined')
      assert.strictEqual(grandchildren[0].tagName, 'H3')
      assert.strictEqual(grandchildren[0].textContent, 'Foobar')
      //second grandchild
      assert.notStrictEqual(grandchildren[1], null)
      assert.notStrictEqual(typeof grandchildren[1], 'undefined')
      assert.strictEqual(grandchildren[1].tagName, 'H3')
      assert.strictEqual(grandchildren[1].textContent, 'Baz')
      done()
    })
  })
})

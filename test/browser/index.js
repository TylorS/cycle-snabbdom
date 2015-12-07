/* global describe, it, beforeEach */
import assert from 'assert'
import { run } from '@cycle/core'
import { makeDOMDriver, div, p, span, h2, h3, h4 } from '../../src'
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

  it(`should have isolateSource() and isolateSink() in source`, done => {
    function app() {
      return {
        DOM: Rx.Observable.just(div()),
      }
    }
    const [sinks, sources] = run(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    })
    assert.strictEqual(typeof sources.DOM.isolateSource, `function`)
    assert.strictEqual(typeof sources.DOM.isolateSink, `function`)
    done()
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

  describe(`isolateSource`, () => {
    it(`should have the same effect as DOM.select()`, done => {
      function app() {
        return {
          DOM: Rx.Observable.just(
            h3(`.top-most`, [
              h2(`.bar`, `Wrong`),
              div(`.cycle-scope-foo`, [
                h4(`.bar`, `Correct`),
              ]),
            ])
          ),
        }
      }
      let [sinks, sources] = run(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      })
      let isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, `foo`)
      // Make assertions
      isolatedDOMSource.select(`.bar`).events(`click`).subscribe(ev => {
        assert.strictEqual(ev.type, `click`)
        assert.strictEqual(ev.target.textContent, `Correct`)

        done()
      })
      sources.DOM.select(`:root`).observable
        .subscribe(root => {
          let wrongElement = root.querySelector(`.bar`)
          let correctElement = root.querySelector(`.cycle-scope-foo .bar`)
          assert.notStrictEqual(wrongElement, null)
          assert.notStrictEqual(correctElement, null)
          assert.notStrictEqual(typeof wrongElement, `undefined`)
          assert.notStrictEqual(typeof correctElement, `undefined`)
          assert.strictEqual(wrongElement.tagName, `H2`)
          assert.strictEqual(correctElement.tagName, `H4`)
          assert.doesNotThrow(() => {
            click(wrongElement)
            setTimeout(() => click(correctElement), 5)
          })
          done()
        })
    })

    it(`should return source also with isolateSource and isolateSink`,
        done => {
          function app() {
            return {
              DOM: Rx.Observable.just(h3(`.top-most`)),
            }
          }
          let [sinks, sources] = run(app, {
            DOM: makeDOMDriver(createRenderTarget()),
          })
          let isolatedDOMSource =
            sources.DOM.isolateSource(sources.DOM, `top-most`)
          // Make assertions
          assert.strictEqual(typeof isolatedDOMSource.isolateSource, `function`)
          assert.strictEqual(typeof isolatedDOMSource.isolateSink, `function`)

          done()
        })
  })

  describe(`isolateSink`, () => {
    it(`should add a className to the vtree sink`, done => {
      function app(sources) {
        let vtree$ = Rx.Observable.just(
            h3(`.top-most`)
          )
        return {
          DOM: sources.DOM.isolateSink(vtree$, `foo`),
        }
      }
      let [sinks, sources] = run(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      })
      // Make assertions
      sources.DOM.select(`:root`).observable
        .subscribe(root => {
          console.log(root)
          assert.notStrictEqual(root, null)
          assert.notStrictEqual(typeof root, `undefined`)
          assert.strictEqual(root.tagName, `H3`)
          assert.strictEqual(root.className, `top-most cycle-scope-foo`)
          done()
        })
    })

    it(`should prevent parent from DOM.selecting() inside the isolation`,
      done => {
        function app(sources) {
          return {
            DOM: Rx.Observable.just(
              h3(`.top-most`, [
                sources.DOM.isolateSink(Rx.Observable.just(
                  div(`.foo`, [
                    h4(`.bar`, `Wrong`),
                  ])
                ), `ISOLATION`),
                h2(`.bar`, `Correct`),
              ])
            ),
          }
        }
        let [sinks, sources] = run(app, {
          DOM: makeDOMDriver(createRenderTarget()),
        })
        sources.DOM.select(`.bar`).observable.subscribe(elements => {
          assert.strictEqual(Array.isArray(elements), true)
          assert.strictEqual(elements.length, 1)
          const correctElement = elements[0]
          assert.notStrictEqual(correctElement, null)
          assert.notStrictEqual(typeof correctElement, `undefined`)
          assert.strictEqual(correctElement.tagName, `H2`)
          assert.strictEqual(correctElement.textContent, `Correct`)
          done()
        })
      })

    it(`should allow parent to DOM.select() an isolation boundary`, done => {
      function app(sources) {
        return {
          DOM: Rx.Observable.just(
            h3(`.top-most`, [
              sources.DOM.isolateSink(Rx.Observable.just(
                span(`.foo`, [
                  h4(`.foo`, `Wrong`),
                ])
              ), `ISOLATION`),
            ])
          ),
        }
      }
      let [sinks, sources] = run(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      })
      sources.DOM.select(`.foo`).observable.subscribe(elements => {
        assert.strictEqual(Array.isArray(elements), true)
        assert.strictEqual(elements.length, 1)
        const correctElement = elements[0]
        assert.notStrictEqual(correctElement, null)
        assert.notStrictEqual(typeof correctElement, `undefined`)
        assert.strictEqual(correctElement.tagName, `SPAN`)
        done()
      })
    })
  })
})

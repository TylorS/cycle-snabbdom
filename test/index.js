import test from 'tape'
import {run} from '@cycle/core'
import {Observable} from 'rx'
import {h, makeDOMDriver} from '../src'

function createRenderTarget(id = `cycletest`) {
  let element = document.createElement(`div`)
  element.className = `cycletest`
  element.id = id
  document.body.appendChild(element)
  return element
}

test(`makeDOMDriver`, assert => {
  const target = createRenderTarget()
  const fragment = document.createDocumentFragment()

  assert.ok(
    makeDOMDriver(target),
    `should accept a DOM element as input`
  )

  assert.ok(
    makeDOMDriver(fragment),
    `should accept a document fragment as input`
  )

  assert.ok(
    makeDOMDriver(`.cycletest`),
    `should accept a css class selector as input`
  )

  assert.ok(
    makeDOMDriver(`#cycletest`),
    `should accept a css id selector as input`
  )

  assert.notOk(
    makeDOMDriver(`.thisSelectorDoesNotExist`),
    `should not accept an unknown element`
  )
})

// eslint complains of too many statements 31 is over 30
test(`DOMDriver`, assert => { // eslint-disable-line
  const domDriver = makeDOMDriver(createRenderTarget())

  assert.throws(
    domDriver({}),
    `should throw if not give an Observable<VTree>`
  )

  function app1() {
    return {
      DOM: Observable.of(
        h(`div.top-most`, [
          h(`p`, `Foo`),
          h(`span`, `Bar`),
        ])
      ),
    }
  }
  /* eslint-disable */
  let [sinks1, sources1] = run(app1, { // sinks is never used
    DOM: makeDOMDriver(createRenderTarget()),
  })
  /* eslint-enable */

  sources1.DOM.select(`:root`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(root => {
      let classNameRegex = /top\-most/
      assert.strictEqual(root.tagName, `DIV`)
      let child = root.children[0]
      assert.notStrictEqual(classNameRegex.exec(child.className), null)
      assert.strictEqual(classNameRegex.exec(child.className)[0], `top-most`)
      sources1.dispose()
      assert.pass(`should have Observable \`:root\` in response`)
    })

  function app2() {
    return {
      DOM: Observable.of(
        h(`select.my-class`, [
          h(`option`, {value: `foo`}, `Foo`),
          h(`option`, {value: `bar`}, `Bar`),
          h(`option`, {value: `baz`}, `Baz`),
        ])
      ),
    }
  }

  /* eslint-disable */
  let [sinks2, sources2] = Cycle.run(app2, { //sinks2 never used
    DOM: makeDOMDriver(createRenderTarget()),
  })
  /* eslint-enable */

  sources2.DOM.select(`:root`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(function next(root) {
      let selectEl = root.querySelector(`.my-class`)
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, `undefined`)
      assert.strictEqual(selectEl.tagName, `SELECT`)
      sources2.dispose()
      assert.pass(`should convert a simple virtual-dom <select> to DOM element`)
    })

  // TODO: Add test for Widgets and Thunks

  function app3() {
    return {
      DOM: Observable.of(
        h(`h3.myelementclass`, `Foobar`)
      ),
    }
  }

  /* eslint-disable */
  let [sinks3, sources3] = run(app3, { // sink3 never used
    DOM: makeDOMDriver(createRenderTarget())
  })
  /* eslint-enable */

  sources3.DOM
    .select(`.myelementclass`)
    .events(`click`)
    .subscribe(ev => {
      assert.strictEqual(ev.type, `click`)
      assert.strictEqual(ev.target.textContent, `Foobar`)
      sources3.dispose()
      assert.pass(`should catch interaction events coming from wrapped view`)
    })

  sources3.DOM
    .select(`:root`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(root => {
      let myElement = root.querySelector(`.myelementclass`)
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, `undefined`)
      assert.strictEqual(myElement.tagName, `H3`)
      // eslint complains of too many nested callbacks
      assert.doesNotThrow(function click(){ //eslint-disable-line
        myElement.click()
      })
    })

  function app4() {
    return {
      DOM: makeDOMDriver(createRenderTarget(`parent-001`)),
    }
  }

  /* eslint-disable */
  let [sinks4, sources4] = run(app4, {
    DOM: Observable.of(
      h(`h3.myelementclass`, `Foobar`)
    ),
  })
  /* eslint-enable */

  sources4.DOM
    .select(`#parent-001`)
    .events(`click`)
    .subscribe(ev => {
      assert.strictEqual(ev.type, `click`)
      assert.strictEqual(ev.target.textContent, `Foobar`)
      sources4.dispose()
      assert.pass(`should catch interaction events using id in
        DOM.select(cssSeletor).events(event)`)
    })
  sources4.DOM.select(`:root`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(function next(root) {
      let myElement = root.querySelector(`.myelementclass`)
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, `undefined`)
      assert.strictEqual(myElement.tagName, `H3`)
      // eslint complains of too many nested callbacks
      assert.doesNotThrow(function click() { //eslint-disable-line
        myElement.click()
      })
    })

  function app5() {
    return {
      DOM: makeDOMDriver(createRenderTarget(`parent-001`)),
    }
  }

  /* eslint-disable */
  let [sinks5, sources5] = run(app5, {
    DOM: Observable.of(
      h(`div.parent`, [
        h(`h4.clickable.first`, `First`),
        h(`h4.clickable.second`, `Second`),
      ])
    ),
  })
  /* eslint-enable */

  sources5.DOM
    .select(`.clickable`)
    .events(`click`)
    .elementAt(0)
    .subscribe(ev => {
      assert.strictEqual(ev.type, `click`)
      assert.strictEqual(ev.target.textContent, `First`)
    })
  sources5.DOM
    .select(`.clickable`)
    .events(`click`)
    .elementAt(1)
    .subscribe(ev => {
      assert.strictEqual(ev.type, `click`)
      assert.strictEqual(ev.target.textContent, `Second`)
      sources5.dispose()
      assert.pass(`should catch events from many elements using
        DOM.select().events()`)
    })
  sources5.DOM.select(`:root`).observable.skip(1).take(1)
    .subscribe(function next(root) {
      let firstElem = root.querySelector(`.first`)
      let secondElem = root.querySelector(`.second`)
      assert.notStrictEqual(firstElem, null)
      assert.notStrictEqual(typeof firstElem, `undefined`)
      assert.notStrictEqual(secondElem, null)
      assert.notStrictEqual(typeof secondElem, `undefined`)
      assert.doesNotThrow(function click() { // eslint-disable-line
        firstElem.click()
        setTimeout(() => secondElem.click(), 1) // eslint-disable-line
      })
    })

  function app6() {
    let child$ = Observable.of(
      h(`h4.child`, {}, `I am a kid`)
    ).delay(80)
    return {
      DOM: Observable.of(
        h(`div.my-class`, [
          h(`p`, {}, `Ordinary paragraph`),
          child$,
        ])
      ),
    }
  }
  /* eslint-disable */
  let [sinks6, sources6] = run(app6, {
    DOM: makeDOMDriver(createRenderTarget())
  })
  /* eslint-enable */

  sources6.DOM.select(`:root`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(function next(root) {
      let selectEl = root.querySelector(`.child`)
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, `undefined`)
      assert.strictEqual(selectEl.tagName, `H4`)
      assert.strictEqual(selectEl.textContent, `I am a kid`)
      sources6.dispose()
      assert.pass(`should render a VTree with a child Observable<VTree>`)
    })

  function app7() {
    let grandchild$ = Observable
      .of(
        h(`h4.grandchild`, {}, [
          `I am a baby`,
        ])
      )
      .delay(20)
    let child$ = Observable
      .of(
        h(`h3.child`, {}, [
          `I am a kid`,
          grandchild$,
        ])
      )
      .delay(80)
    return {
      DOM: Observable.of(
        h(`div.my-class`, [
          h(`p`, {}, `Ordinary paragraph`),
          child$,
        ])
      ),
    }
  }
  /* eslint-disable */
  let [sinks7, sources7] = Cycle.run(app7, {
    DOM: makeDOMDriver(createRenderTarget())
  })
  /* eslint-enable */
  sources7.DOM
    .select(`:root`)
    .observable.skip(1)
    .take(1)
    .subscribe(function next(root) {
      let selectEl = root.querySelector(`.grandchild`)
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, `undefined`)
      assert.strictEqual(selectEl.tagName, `H4`)
      assert.strictEqual(selectEl.textContent, `I am a baby`)
      sources7.dispose()
      assert.pass(`should render a VTree with a grandchild Observable<VTree>`)
    })

  let number$ = Observable.range(1, 3)
    .concatMap(x => Observable.of(x).delay(50))

  function app8() {
    return {
      DOM: number$.map(number =>
        h(`h3.target`, String(number))
      ),
    }
  }

  let [sinks8, sources8] = run(app8, {
    DOM: makeDOMDriver(createRenderTarget()),
  })
  sources8.DOM
    .select(`:root`)
    .observable.skip(1)
    .subscribe(function next(root) {
      let selectEl = root.querySelector(`.target`)
      assert.notStrictEqual(selectEl, null)
      assert.notStrictEqual(typeof selectEl, `undefined`)
      assert.strictEqual(selectEl.tagName, `H3`)
      assert.notStrictEqual(selectEl.textContent, `3`)
      if (selectEl.textContent === `2`) {
        sources8.dispose()
        sinks8.dispose()
        setTimeout(() => { //eslint-disable-line
          assert.pass(`should not work after has been disposed`)
        }, 100)
      }
    })
})

test(`DOM.select()`, assert => {
  function app() {
    return {
      DOM: Observable.of(
        h(`h3.myelementclass`, `Foobar`)
      ),
    }
  }

  /* eslint-disable */
  let [sources, sinks] = run(app, {
    DOM: makeDOMDriver(createRenderTarget()),
  })
  /* eslint-enable */

  const selection = sinks.DOM.select(`.myelementclass`)
  assert.strictEqual(typeof selection, `object`)
  assert.strictEqual(typeof selection.observable, `object`)
  assert.strictEqual(typeof selection.observable.subscribe, `function`)
  assert.strictEqual(typeof selection.events, `function`)
  assert.pass(`should be an object with observable and events()`)
  sinks.dispose()

  /* eslint-disable */
  let [sources1, sinks1] = run(app, {
    DOM: makeDOMDriver(createRenderTarget())
  })
  /* eslint-enable */

  sinks1.DOM
    .select(`.myelementclass1`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(elem => {
      assert.notStrictEqual(elem, null)
      assert.notStrictEqual(typeof elem, `undefined`)
      // Is a NodeList
      assert.strictEqual(Array.isArray(elem), false)
      assert.strictEqual(elem.length, 1)
      // NodeList with the H3 element
      assert.strictEqual(elem[0].tagName, `H3`)
      assert.strictEqual(elem[0].textContent, `Foobar`)
      sinks1.dispose()
      assert.pass(`should have an observable of DOM elements`)
    })

  /* eslint-disable */
  let [sinks2, sources2] = run(app3, { // sinks2 never used
    DOM: makeDOMDriver(createRenderTarget())
  })
  /* eslint-enable */

  sources2.DOM
    .select(`.myelementclass`)
    .events(`click`)
    .subscribe(ev => {
      assert.strictEqual(ev.type, `click`)
      assert.strictEqual(ev.target.textContent, `Foobar`)
      sources2.dispose()
      assert.pass(`should allow subscribing to interactions`)
    })

  sources2.DOM
    .select(`:root`)
    .observable
    .skip(1)
    .take(1)
    .subscribe(root => {
      let myElement = root.querySelector(`.myelementclass`)
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, `undefined`)
      assert.strictEqual(myElement.tagName, `H3`)
      // eslint complains of too many nested callbacks
      assert.doesNotThrow(function click(){ //eslint-disable-line
        myElement.click()
      })
    })
})

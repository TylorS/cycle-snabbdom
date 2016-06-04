'use strict'
/* global describe, it */
let assert = require('assert')
let Cycle = require('@cycle/core')
let CycleDOM = require('../../src/index')
let Observable = require('rx').Observable
let {div, input, h2, h3, h4, form, span, makeDOMDriver} = CycleDOM

function createRenderTarget (id = null) {
  let element = document.createElement('div')
  element.className = 'cycletest'
  if (id) {
    element.id = id
  }
  document.body.appendChild(element)
  return element
}

describe('DOMSource.events()', function () {
  it('should catch a basic click interaction Observable', function (done) {
    function app () {
      return {
        DOM: Observable.of(h3('.myelementclass', 'Foobar'))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.myelementclass').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      sources.dispose()
      sinks.dispose()
      done()
    })
    // Make assertions
    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const myElement = root.querySelector('.myelementclass')
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.doesNotThrow(function () {
        myElement.click()
      })
    })
  })

  it('should setup click detection with events() after run() occurs', function (done) {
    function app () {
      return {
        DOM: Observable.of(h3('.test2.myelementclass', 'Foobar'))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })
    sources.DOM.select('.myelementclass').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      sinks.dispose()
      sources.dispose()
      done()
    })
    // Make assertions
    setTimeout(() => {
      const myElement = document.querySelector('.test2.myelementclass')
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.doesNotThrow(function () {
        setTimeout(() => myElement.click())
      })
    }, 200)
  })

  it('should setup click detection on a ready DOM element (e.g. from server)', function (done) {
    function app () {
      return {
        DOM: Observable.never()
      }
    }

    const containerElement = createRenderTarget()
    let headerElement = document.createElement('H3')
    headerElement.className = 'myelementclass'
    headerElement.textContent = 'Foobar'
    containerElement.appendChild(headerElement)

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(containerElement)
    })
    sources.DOM.select('.myelementclass').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      sinks.dispose()
      sources.dispose()
      done()
    })
    // Make assertions
    setTimeout(() => {
      const myElement = containerElement.querySelector('.myelementclass')
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.doesNotThrow(function () {
        setTimeout(() => myElement.click())
      })
    }, 200)
  })

  it('should catch events using id of root element in DOM.select', function (done) {
    function app () {
      return {
        DOM: Observable.of(h3('.myelementclass', 'Foobar'))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-001'))
    })

    // Make assertions
    sources.DOM.select('#parent-001').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const myElement = root.querySelector('.myelementclass')
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.doesNotThrow(function () {
        setTimeout(() => myElement.click())
      })
    })
  })

  it('should catch events using id of top element in DOM.select', function (done) {
    function app () {
      return {
        DOM: Observable.of(h3('#myElementId', 'Foobar'))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-002'))
    })

    // Make assertions
    sources.DOM.select('#myElementId').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(1).take(1)
      .subscribe(function (root) {
        const myElement = root.querySelector('#myElementId')
        assert.notStrictEqual(myElement, null)
        assert.notStrictEqual(typeof myElement, 'undefined')
        assert.strictEqual(myElement.tagName, 'H3')
        assert.doesNotThrow(function () {
          setTimeout(() => myElement.click())
        })
      })
  })

  it('should catch interaction events without prior select()', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          h3('.myelementclass', 'Foobar')
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Make assertions
    sources.DOM.events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Foobar')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const myElement = root.querySelector('.myelementclass')
      assert.notStrictEqual(myElement, null)
      assert.notStrictEqual(typeof myElement, 'undefined')
      assert.strictEqual(myElement.tagName, 'H3')
      assert.doesNotThrow(function () {
        setTimeout(() => myElement.click())
      })
    })
  })

  it('should catch user events using DOM.select().select().events()', function (done) {
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
    sources.DOM.select('.foo').select('.bar').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Correct')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(1).take(1)
      .subscribe(function (root) {
        const wrongElement = root.querySelector('.bar')
        const correctElement = root.querySelector('.foo .bar')
        assert.notStrictEqual(wrongElement, null)
        assert.notStrictEqual(correctElement, null)
        assert.notStrictEqual(typeof wrongElement, 'undefined')
        assert.notStrictEqual(typeof correctElement, 'undefined')
        assert.strictEqual(wrongElement.tagName, 'H2')
        assert.strictEqual(correctElement.tagName, 'H4')
        assert.doesNotThrow(function () {
          setTimeout(() => wrongElement.click())
          setTimeout(() => correctElement.click(), 15)
        })
      })
  })

  it('should catch events from many elements using DOM.select().events()', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          h4('.clickable.first', 'First'),
          h4('.clickable.second', 'Second')
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    // Make assertions
    sources.DOM.select('.clickable').events('click').take(1)
      .subscribe(ev => {
        assert.strictEqual(ev.type, 'click')
        assert.strictEqual(ev.target.textContent, 'First')
      })

    sources.DOM.select('.clickable').events('click').skip(1).take(1)
      .subscribe(ev => {
        assert.strictEqual(ev.type, 'click')
        assert.strictEqual(ev.target.textContent, 'Second')
        sinks.dispose()
        sources.dispose()
        done()
      })

    sources.DOM.select(':root').elements.skip(1).take(1)
      .subscribe(function (root) {
        const firstElem = root.querySelector('.first')
        const secondElem = root.querySelector('.second')
        assert.notStrictEqual(firstElem, null)
        assert.notStrictEqual(typeof firstElem, 'undefined')
        assert.notStrictEqual(secondElem, null)
        assert.notStrictEqual(typeof secondElem, 'undefined')
        assert.doesNotThrow(function () {
          setTimeout(() => firstElem.click())
          setTimeout(() => secondElem.click(), 5)
        })
      })
  })

  it('should catch interaction events from future elements', function (done) {
    function app () {
      return {
        DOM: Observable.merge(
          Observable.of(h2('.blesh', 'Blesh')),
          Observable.of(h3('.blish', 'Blish')).delay(100),
          Observable.of(h4('.blosh', 'Blosh')).delay(150)
        )
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-002'))
    })

    // Make assertions
    sources.DOM.select('.blosh').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.textContent, 'Blosh')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(3).take(1)
      .subscribe(function (root) {
        const myElement = root.querySelector('.blosh')
        assert.notStrictEqual(myElement, null)
        assert.notStrictEqual(typeof myElement, 'undefined')
        assert.strictEqual(myElement.tagName, 'H4')
        assert.strictEqual(myElement.textContent, 'Blosh')
        assert.doesNotThrow(function () {
          setTimeout(() => myElement.click())
        })
      })
  })

  it('should have currentTarget or ownerTarget pointed to the selected parent', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.top', [
          h2('.parent', [
            span('.child', 'Hello world')
          ])
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.parent').events('click').subscribe(ev => {
      assert.strictEqual(ev.type, 'click')
      assert.strictEqual(ev.target.tagName, 'SPAN')
      assert.strictEqual(ev.target.className, 'child')
      assert.strictEqual(ev.target.textContent, 'Hello world')
      const currentTargetIsParentH2 =
        ev.currentTarget.tagName === 'H2' && ev.currentTarget.className === 'parent'
      const ownerTargetIsParentH2 =
        ev.ownerTarget.tagName === 'H2' && ev.ownerTarget.className === 'parent'
      assert.strictEqual(currentTargetIsParentH2 || ownerTargetIsParentH2, true)
      sinks.dispose()
      sources.dispose()
      done()
    })
    // Make assertions
    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(function (root) {
      const child = root.querySelector('.child')
      assert.notStrictEqual(child, null)
      assert.notStrictEqual(typeof child, 'undefined')
      assert.strictEqual(child.tagName, 'SPAN')
      assert.strictEqual(child.className, 'child')
      assert.doesNotThrow(function () {
        setTimeout(() => child.click())
      })
    })
  })

  it('should catch a non-bubbling Form `reset` event', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          form('.form', [
            input('.field', {type: 'text'})
          ])
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.form').events('reset').subscribe(ev => {
      assert.strictEqual(ev.type, 'reset')
      assert.strictEqual(ev.target.tagName, 'FORM')
      assert.strictEqual(ev.target.className, 'form')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const form = root.querySelector('.form')
      setTimeout(() => form.reset())
    })
  })

  it('should catch a non-bubbling click event with useCapture', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          div('.clickable', 'Hello')
        ]))
      }
    }

    function click (el) {
      const ev = document.createEvent('MouseEvent')
      ev.initMouseEvent(
        'click',
        false /* bubble */, true /* cancelable */,
        window, null,
        0, 0, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /* left */, null
      )
      el.dispatchEvent(ev)
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.clickable').events('click', {useCapture: true})
      .subscribe(ev => {
        assert.strictEqual(ev.type, 'click')
        assert.strictEqual(ev.target.tagName, 'DIV')
        assert.strictEqual(ev.target.className, 'clickable')
        assert.strictEqual(ev.target.textContent, 'Hello')
        sinks.dispose()
        sources.dispose()
        done()
      })

    sources.DOM.select('.clickable').events('click', {useCapture: false})
      .subscribe(assert.fail)

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const clickable = root.querySelector('.clickable')
      setTimeout(() => click(clickable))
    })
  })

  // This test does not work if and only if the browser is unfocused in the
  // operating system. In some browsers in SauceLabs, this test would always
  // fail for that reason. Until we find how to force the browser to be
  // focused, we can't run this test.
  it.skip('should catch a blur event with useCapture', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          input('.correct', {type: 'text'}, []),
          input('.wrong', {type: 'text'}, []),
          input('.dummy', {type: 'text'})
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.correct').events('blur', {useCapture: true})
      .subscribe(ev => {
        assert.strictEqual(ev.type, 'blur')
        assert.strictEqual(ev.target.className, 'correct')
        sinks.dispose()
        sources.dispose()
        done()
      })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const correct = root.querySelector('.correct')
      const wrong = root.querySelector('.wrong')
      const dummy = root.querySelector('.dummy')
      setTimeout(() => wrong.focus(), 50)
      setTimeout(() => dummy.focus(), 100)
      setTimeout(() => correct.focus(), 150)
      setTimeout(() => dummy.focus(), 200)
    })
  })

  // This test does not work if and only if the browser is unfocused in the
  // operating system. In some browsers in SauceLabs, this test would always
  // fail for that reason. Until we find how to force the browser to be
  // focused, we can't run this test.
  it.skip('should catch a blur event by default (no options)', function (done) {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          input('.correct', {type: 'text'}, []),
          input('.wrong', {type: 'text'}, []),
          input('.dummy', {type: 'text'})
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.correct').events('blur')
      .subscribe(ev => {
        assert.strictEqual(ev.type, 'blur')
        assert.strictEqual(ev.target.className, 'correct')
        sinks.dispose()
        sources.dispose()
        done()
      })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const correct = root.querySelector('.correct')
      const wrong = root.querySelector('.wrong')
      const dummy = root.querySelector('.dummy')
      setTimeout(() => wrong.focus(), 50)
      setTimeout(() => dummy.focus(), 100)
      setTimeout(() => correct.focus(), 150)
      setTimeout(() => dummy.focus(), 200)
    })
  })

  it('should not simulate bubbling for non-bubbling events', done => {
    function app () {
      return {
        DOM: Observable.of(div('.parent', [
          form('.form', [
            input('.field', {type: 'text'})
          ])
        ]))
      }
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    })

    sources.DOM.select('.parent').events('reset').subscribe(ev => {
      done(new Error('Reset event should not bubble to parent'))
    })

    sources.DOM.select('.form').events('reset').delay(200).subscribe(ev => {
      assert.strictEqual(ev.type, 'reset')
      assert.strictEqual(ev.target.tagName, 'FORM')
      assert.strictEqual(ev.target.className, 'form')
      sinks.dispose()
      sources.dispose()
      done()
    })

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const form = root.querySelector('.form')
      setTimeout(() => form.reset())
    })
  })
})

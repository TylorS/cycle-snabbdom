'use strict'
/* global describe, it*/
let assert = require('assert')
let Cycle = require('@cycle/core')
let CycleDOM = require('../../src/index')
let Observable = require('rx').Observable
let {div, h, makeHTMLDriver} = CycleDOM

describe('HTML Driver', function () {
  it('should output HTML when given a simple vtree stream', function (done) {
    function app () {
      return {
        html: Observable.of(div('.test-element', ['Foobar']))
      }
    }
    let {sinks, sources} = Cycle.run(app, {
      html: makeHTMLDriver()
    })
    sources.html.elements.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>')
      sinks.dispose()
      sources.dispose()
      done()
    })
  })

  it('should make bogus select().events() as sources', function (done) {
    function app ({html}) {
      assert.strictEqual(typeof html.select, 'function')
      assert.strictEqual(typeof html.select('whatever').elements.subscribe, 'function')
      assert.strictEqual(typeof html.select('whatever').events().subscribe, 'function')
      return {
        html: Observable.of(div('.test-element', ['Foobar']))
      }
    }
    let {sinks, sources} = Cycle.run(app, {
      html: makeHTMLDriver()
    })
    sources.html.elements.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>')
      sinks.dispose()
      sources.dispose()
      done()
    })
  })

  it('should output simple HTML Observable', function (done) {
    function app () {
      return {
        html: Observable.of(div('.test-element', ['Foobar']))
      }
    }
    let {sinks, sources} = Cycle.run(app, {
      html: makeHTMLDriver()
    })
    sources.html.elements.subscribe(html => {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>')
      sinks.dispose()
      sources.dispose()
      done()
    })
  })

  describe('with transposition=true', function () {
    it('should render a simple nested vtree$ as HTML', function (done) {
      function app () {
        return {
          DOM: Observable.of(h('div.test-element', [
            Observable.of(h('h3.myelementclass'))
          ]))
        }
      }
      let {sinks, sources} = Cycle.run(app, {
        DOM: makeHTMLDriver({transposition: true})
      })
      sources.DOM.elements.subscribe(html => {
        assert.strictEqual(html,
          '<div class="test-element">' +
          '<h3 class="myelementclass"></h3>' +
          '</div>'
        )
        sinks.dispose()
        sources.dispose()
        done()
      })
    })

    it('should render double nested vtree$ as HTML', function (done) {
      function app () {
        return {
          html: Observable.of(h('div.test-element', [
            Observable.of(h('div.a-nice-element', [
              String('foobar'),
              Observable.of(h('h3.myelementclass'))
            ]))
          ]))
        }
      }
      let {sinks, sources} = Cycle.run(app, {
        html: makeHTMLDriver({transposition: true})
      })

      sources.html.elements.subscribe(html => {
        assert.strictEqual(html,
          '<div class="test-element">' +
          '<div class="a-nice-element">' +
          'foobar<h3 class="myelementclass"></h3>' +
          '</div>' +
          '</div>'
        )
        sinks.dispose()
        sources.dispose()
        done()
      })
    })

    it('should HTML-render a nested vtree$ with props', function (done) {
      function myElement (foobar$) {
        return foobar$.map(foobar =>
          h('h3.myelementclass', String(foobar).toUpperCase())
        )
      }
      function app () {
        return {
          DOM: Observable.of(
            h('div.test-element', [
              myElement(Observable.of('yes'))
            ])
          )
        }
      }
      let {sinks, sources} = Cycle.run(app, {
        DOM: makeHTMLDriver({transposition: true})
      })

      sources.DOM.elements.subscribe(html => {
        assert.strictEqual(html,
          '<div class="test-element">' +
          '<h3 class="myelementclass">YES</h3>' +
          '</div>'
        )
        sinks.dispose()
        sources.dispose()
        done()
      })
    })

    it('should render a complex and nested vtree$ as HTML', function (done) {
      function app () {
        return {
          html: Observable.of(
            h('.test-element', [
              h('div', [
                h('h2.a', 'a'),
                h('h4.b', 'b'),
                Observable.of(h('h1.fooclass'))
              ]),
              h('div', [
                h('h3.c', 'c'),
                h('div', [
                  h('p.d', 'd'),
                  Observable.of(h('h2.barclass'))
                ])
              ])
            ])
          )
        }
      }
      let {sinks, sources} = Cycle.run(app, {
        html: makeHTMLDriver({transposition: true})
      })

      sources.html.elements.subscribe(html => {
        assert.strictEqual(html,
          '<div class="test-element">' +
            '<div>' +
              '<h2 class="a">a</h2>' +
              '<h4 class="b">b</h4>' +
              '<h1 class="fooclass"></h1>' +
            '</div>' +
            '<div>' +
              '<h3 class="c">c</h3>' +
              '<div>' +
                '<p class="d">d</p>' +
                '<h2 class="barclass"></h2>' +
              '</div>' +
            '</div>' +
          '</div>'
        )
        sinks.dispose()
        sources.dispose()
        done()
      })
    })
  })
})

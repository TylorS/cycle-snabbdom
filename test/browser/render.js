'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/rx-run').default;
let CycleDOM = require('../../src');
let Fixture89 = require('./fixtures/issue-89');
let Rx = require('rx');
let {html} = require('snabbdom-jsx');
let {h, div, input, p, span, h2, h3, h4, select, option, makeDOMDriver, thunk} = CycleDOM;

function createRenderTarget(id = null) {
  let element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

describe('DOM Rendering', function () {
  it('should convert a simple virtual-dom <select> to DOM element', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(select('.my-class', [
          option({props: {value: 'foo'}}, 'Foo'),
          option({props: {value: 'bar'}}, 'Bar'),
          option({props: {value: 'baz'}}, 'Baz')
        ]))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.observable.subscribe(function (root) {
      const selectEl = root.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      dispose();
      done();
    });
  });


  it('should convert a simple virtual-dom <select> (JSX) to DOM element', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(
          <select className="my-class">
            <option value="foo">Foo</option>
            <option value="bar">Bar</option>
            <option value="baz">Baz</option>
          </select>
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.select(':root').observable.take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      dispose();
      done();
    });
  });

  it('should allow snabbdom Thunks in the VTree', function (done) {
    function renderThunk(greeting) {
      return h4('Constantly ' + greeting)
    }

    // The Cycle.js app
    function app() {
      return {
        DOM: Rx.Observable.interval(10).take(5).map(i =>
          div([
            thunk('thunk', renderThunk, 'hello' + 0)
          ])
        )
      };
    }

    // Run it
    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    // Assert it
    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('h4');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'Constantly hello0');
      dispose();
      done();
    });
  });

  it('should accept a view wrapping a VTree$ (#89)', function (done) {
    function app() {
      const number$ = Fixture89.makeModelNumber$();
      return {
        DOM: Fixture89.viewWithContainerFn(number$)
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.select('.myelementclass').observable.first() // 1st
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '123');
      });
    sources.DOM.select('.myelementclass').observable.skip(1).first() // 2nd
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '456');
        dispose();
        done();
      });
  });

  it('should accept a view with VTree$ as the root of VTree', function (done) {
    function app() {
      const number$ = Fixture89.makeModelNumber$();
      return {
        DOM: Fixture89.viewWithoutContainerFn(number$)
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.select('.myelementclass').observable.first() // 1st
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '123');
      });
    sources.DOM.select('.myelementclass').observable.skip(1).first() // 1st
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '456');
        dispose();
        done();
      });
  });

  it('should render a VTree with a child Observable<VTree>', function (done) {
    function app() {
      const child$ = Rx.Observable.just(
        h4('.child', {}, 'I am a kid')
      ).delay(80);
      return {
        DOM: Rx.Observable.just(div('.my-class', [
          p({}, 'Ordinary paragraph'),
          child$
        ]))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.select(':root').observable.take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.child');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'I am a kid');
      dispose();
      done();
    });
  });

  it('should render a VTree with a grandchild Observable<VTree>', function (done) {
    function app() {
      const grandchild$ = Rx.Observable.just(
          h4('.grandchild', {}, [
            'I am a baby'
          ])
        ).delay(20);
      const child$ = Rx.Observable.just(
          h3('.child', {}, [
            'I am a kid',
            grandchild$
          ])
        ).delay(80);
      return {
        DOM: Rx.Observable.just(div('.my-class', [
          p({}, 'Ordinary paragraph'),
          child$
        ]))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.select(':root').observable.take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.grandchild');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'I am a baby');
      dispose();
      done();
    });
  });

  it('should render a SVG VTree with a child Observable<VTree>', function (done) {
    function app() {
      const child$ = Rx.Observable.just(
        h('g', {attrs: {class: 'child'}}, [])
      ).delay(80);
      return {
        DOM: Rx.Observable.just(h('svg', {}, [
          h('g', {}, []),
          child$
        ]))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.select(':root').observable.take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.child');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'g');
      dispose();
      done();
    });
  });

  it('should only be concerned with values from the most recent nested Observable', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(div([
          Rx.Observable.just(2).startWith(1).map(outer =>
            Rx.Observable.just(2).delay(0).startWith(1).map(inner =>
              div('.target', outer+'/'+inner)
            )
          )
        ]))
      };
    };

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const expected = Rx.Observable.from(['1/1','2/1','2/2'])

    sources.DOM.select('.target').observable
      .map(els => els[0].innerHTML)
      .sequenceEqual(expected)
      .subscribe((areSame) => {
        assert.strictEqual(areSame, true);
        done();
      });

    run();
  });

  it('should ignore `null` children values', function (done) {
    function app(){
      return {
        DOM: Rx.Observable.just(div('.test', [
          Rx.Observable.just(h4('Hello')),
          null,
        ]))
      };
    };

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.observable.subscribe(function(root){
      const myElement = root.querySelector('.test')
      assert.strictEqual(myElement.children.length, 1);
      dispose();
      done();
    });
  });

  it('should ignore `null` children values with no siblings', function (done) {
    function app(){
      return {
        DOM: Rx.Observable.just(div('.test', [
          null,
          null,
          null,
        ]))
      };
    };

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.observable.subscribe(function(root){
      const myElement = root.querySelector('.test')
      assert.strictEqual(myElement.children.length, 0);
      dispose();
      done();
    });
  });

  it('should ignore `null` children values with some siblings', function (done) {
    function app(){
      return {
        DOM: Rx.Observable.just(div('.test', [
          null,
          Rx.Observable.just(div('Hello')),
          Rx.Observable.just(h4('World')),
          null,
        ]))
      };
    };

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const dispose = run();

    sources.DOM.observable.subscribe(function(root){
      const myElement = root.querySelector('.test')
      assert.strictEqual(myElement.children.length, 2);
      dispose();
      done();
    });
  });
});

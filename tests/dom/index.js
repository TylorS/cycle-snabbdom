import {test} from 'tape';
import Rx from 'rx'
import {h, makeDOMDriver} from '../../src/';

function createRenderTarget(id = null) {
  let element = document.createElement('div');
  element.className = 'domTest';
  if (id) element.id = id;
  document.body.appendChild(element);
  return element;
}

function createView() {
  return h(`div`, { className: `root`}, [
    h(`h1`, {className: `helloWorld`}, `Hello, World!`)
  ])
}

test('makeDOMDriver', t => {
  let el = createRenderTarget();
  t.ok(makeDOMDriver(el), 'should accept a HTMLElement');
  t.ok(makeDOMDriver('.domTest'), 'should accept a querySelector string');
  let frag = document.createDocumentFragment();
  t.ok(makeDOMDriver(frag), 'should accept document fragment')
  t.ok('function' === typeof makeDOMDriver('.domTest'), 'makeDOMDriver()' +
    'should return a function');
  t.end();
})

test('DOMDriver', t => {
  createRenderTarget();

  let domDriver = makeDOMDriver('.domTest');
  let view$ = Rx.Observable.just(createView());

  let responses = domDriver(view$);

  t.equal(typeof responses, 'object', 'DOMDriver() should return an object');
  t.equal(Object.keys(responses).length, 1, 'IDOMDriver() Should return an object with only one method');

  let domTest = responses.select('.domTest');

  t.ok(responses.select(':root'), 'Should be able to select(`:root`)');
  t.equal(typeof domTest, 'object', '.select() should return an object');
  t.equal(Object.keys(domTest).length, 2, '.select() method should return an object with only two methods.');

  let eventTest = domTest.events('click');

  t.equal(typeof eventTest.subscribe, 'function', '.events() should return an observable' );
  t.end()
});

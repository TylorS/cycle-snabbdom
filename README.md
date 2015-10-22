<<<<<<< HEAD
# Cycle-JSX-IR

This is a Cycle driver which uses the fantastic [JSX-IR](https://github.com/jsx-ir) library.

# Install
```
npm install cycle-jsx-ir
```
###### If you plan to use JSX you also need babel-plugin-jsx
```
npm install babel-plugin-jsx
```
See [here](https://babeljs.io/docs/advanced/plugins/) for usage if you're not familiar.

# Roadmap
  - [x] Incremental DOM Driver [jsx-to-idom](https://github.com/jsx-ir/jsx-to-idom)
  - [x] Virtual Hyperscript
  - [X] HTML  Driver [jsx-to-html](https://github.com/jsx-ir/jsx-to-html)
  - [ ] Generic DOM Driver [jsx-to-dom](https://github.com/jsx-ir/jsx-to-dom)
  - [ ] Nativescript Driver [jsx-to-nativescript](https://github.com/jsx-ir/jsx-to-nativescript) (This repo is a work in progress)
  - [ ] Rule the world!

# Super Basic Example

```javascript
import {Rx, run} from '@cycle/core';
import {makeIDOMDriver, h} from 'cycle-jsx-ir';

function main(responses) {
  let view$ = Rx.Observable.interval(1000)
    .map(i => {
      return h('h1', `I've been running for ${i} seconds!`)
    });

  return {
    IDOM: view$
  }
}

let drivers = {
  IDOM: makeIDOMDriver('.app')
}

run(main, drivers);
```
# UI Partials
One cool feature provided by JSX-IR is to create functions that can encapsulate parts of your UI.

These are **not** custom elements, only resuable UI elements.

### Example UI Partial
```javascript
// With hyperscript
function myPartial(props, children) {
  //children === [ ];
  return h('div', {className: 'special-partial'}, [
   h('h1', `${props.currentTime.toLocaleString()}`)
  ]);
}

function view(state$) {
  return state$.map(
    ({currentTime}) => {
      //currentTime === new Date()
      return h('div', {}, [
        h(myPartial, {currentTime}, [])
      ])
    }
  );
}

// With JSX
function myPartial(props, children) {
  //children === [ ];
  return (
    <div className='special-partial'>
      <h1>{props.currentTime.toLocalestring()}</h1>
    </div>
  );
}

function view(state$) {
  return state$.map(
    ({currentTime}) =>
    <div>
      <myPartial currentTime={currentTime}></myPartial>
    </div>
  );
}
```
UI Partials that return hyperscript **can** be used in JSX and partials that return JSX **can** be used from hyperscript!
=======
# cycle-snabbdom
Alternative DOM driver utilizing the snabbdom library
>>>>>>> 6d784a563f8b93e6752923a262fece8867295c33

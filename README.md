# cycle-snabbdom
Alternative DOM driver utilizing the snabbdom library

# Install
```js
$ npm insall cycle-snabbdom
```

This library implements all of the same API's that the standard Cycle-DOM driver implements, except currently Snabbdom does not have any decent way to render HTML. That means that this library is currently client-side only.

This library also exports the hyperscript-helpers for shorter view functions.
# Examples

##### Simple Counter
```js
import Rx from 'rx'
import {run} from '@cycle/core'
import {makeDOMDriver, div, button, p} from 'cycle-snabbdom'

function main({DOM}) {
  let action$ = Rx.Observable.merge(
    DOM.select('.decrement').events('click').map(ev => -1),
    DOM.select('.increment').events('click').map(ev => +1)
  )
  let count$ = action$.startWith(0).scan((x,y) => x+y)
  return {
    DOM: count$.map(count =>
        div([
          button('.decrement', 'Decrement'),
          button('.increment', 'Increment'),
          p('Counter: ' + count)
        ])
      )
  }
}

run(app, {
  DOM: makeDOMDriver('#app')
})
```

##### @cycle/isolate
```js
import Rx from 'rx'
import {run} from '@cycle/core'
import {makeDOMDriver, div, h2} from 'cycle-snabbdom'
import isolate from '@cycle/isolate';

function bmiCalculator({DOM}) {
  let weightProps$ = Rx.Observable.just({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = Rx.Observable.just({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });

  // LabeledSlider is a dataflow component
  // isolate(LabeledSlider) is an impure function: it generates
  // a NEW dataflow component every time it is called.
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightSlider = WeightSlider({DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM, props$: heightProps$});

  let bmi$ = Rx.Observable.combineLatest(
    weightSlider.value$,
    heightSlider.value$,
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    }
  );

  return {
    DOM: bmi$.combineLatest(weightSlider.DOM, heightSlider.DOM,
      (bmi, weightVTree, heightVTree) =>
        div([
          weightVTree,
          heightVTree,
          h2('BMI is ' + bmi)
        ])
      )
  };
}

run(app, { DOM: makeDOMDriver('#app') })
```

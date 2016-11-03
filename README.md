# react-resolve-dependencies

A [higher order component](https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e#.4osqw2gnf) that enables specifying dependencies that should be met before the component is rendered.

## Installation

    $ npm install react-resolve-dependencies

## Usage

```javascript
import React from 'react'
import resolveDependencies from 'react-resolve-dependencies'

function dependency() {
  return Promise.resolve('dependency resolved')
}

function onDependencyResolution(results) {
  console.log(results)
}

function onDependencyFailure(reason) {
  console.log(reason)
}

class LoadingComponent extends React.Component {

  render() {
    <div>loading...</div>
  }

}

class FailureComponent extends React.Component {

  render() {
    <div>failed...</div>
  }

}

class ComponentWithDependencies extends React.Component {

  static dependencies = [
    dependency
  ]

  static onDependencyResolution = onDependencyResolution

  static onDependencyFailure = onDependencyFailure

  render() {
    <div>all dependencies have now been resolved!</div>
  }

}

export default resolveDependencies(LoadingComponent, FailureComponent)(ComponentWithDependencies)

```

A 'dependency' is any function that returns a promise. Specify these in an array as a component property `dependencies`. The promises returned by the dependency functions will be passed to `Promise.all` and resolved before rendering the component. Whilst this takes place, the `LoadingComponent` passed to `resolveDependencies` will be rendered, passed the same props as the wrapped component. If no loading component is passed, then `null` will be rendered.

If any of the promises fail, then the `FailureComponent` will be rendered, passed the same props as the wrapped component. If no failure component is passed, then `null` will be rendered.

It's also possible to specify methods to be called in the event of dependency resolution or failure. These should be specified as component properties `onDependencyResolution` and `onDependencyFailure`, and will be passed either the results from `Promise.all`, or the reason for the failure, respectively.

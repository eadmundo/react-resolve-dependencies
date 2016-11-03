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

class LoadingComponent extends React.Component {

  render() {
    <div>loading...</div>
  }

}

class ComponentWithDependencies extends React.Component {

  static dependencies = [
    dependency
  ]

  static onDependencyResolution = onDependencyResolution

  render() {
    <div>all dependencies have now been resolved!</div>
  }

}

export default resolveDependencies(LoadingComponent)(ComponentWithDependencies)

```
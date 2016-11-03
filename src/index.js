import React from 'react';

export default function resolveDependencies(LoadingComponent, FailureComponent) {

  return function wrapWithResolver(WrappedComponent) {

    class DependenciesResolver extends React.Component {

      constructor(props, context) {
        super(props, context);
        this.state = {
          dependenciesResolved: false,
          dependenciesFailed: false
        }
        this.onDependencyResolution = this.onDependencyResolution.bind(this);
        this.onDependencyFailure = this.onDependencyFailure.bind(this);
      }

      arrayPropertyIsValid(propertyName) {
        return Array.isArray(WrappedComponent[propertyName]) && WrappedComponent[propertyName].length;
      }

      get hasDependencies() {
        return this.arrayPropertyIsValid('dependencies')
      }

      get componentDependencies() {
        return WrappedComponent.dependencies.map(dependency => {
          return dependency()
        })
      }

      onDependencyResolution(results=[]) {
        this.setState({
          dependenciesResolved: true
        })
        if (WrappedComponent.onDependencyResolution) {
          WrappedComponent.onDependencyResolution(results)
        }
      }

      onDependencyFailure(reason) {
        this.setState({
          dependenciesFailed: true
        })
        if (WrappedComponent.onDependencyFailure) {
          WrappedComponent.onDependencyFailure(reason)
        }
      }

      get dependencies() {
        return this.hasDependencies
          ? this.componentDependencies
          : [Promise.resolve('no component dependencies')]
      }

      componentWillMount() {
        Promise.all(this.dependencies)
          .then(this.onDependencyResolution)
          .catch(this.onDependencyFailure)
      }

      render() {

        if (!this.state.dependenciesResolved) {
          if (LoadingComponent) {
            return <LoadingComponent {...this.props} />;
          }
          if (this.state.dependenciesFailed) {
            if (FailureComponent) {
              return <FailureComponent {...this.props} />;
            }
          }
          return null;
        }

        return <WrappedComponent {...this.props} />;
      }

    }

    return DependenciesResolver;
  }

}
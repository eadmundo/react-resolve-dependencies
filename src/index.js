import React from 'react';

export default function resolveDependencies(LoadingComponent) {

  return function wrapWithResolver(WrappedComponent) {

    class DependenciesResolver extends Component {

      constructor(props, context) {
        super(props, context);
        this.state = {
          dependenciesResolved: false
        }
      }

      arrayPropertyIsValid(propertyName) {
        return Array.isArray(WrappedComponent[propertyName]) && WrappedComponent[propertyName].length;
      }

      get hasDependencies() {
        return this.arrayPropertyIsValid('dependencies')
      }

      get dependencies() {
        return WrappedComponent.dependencies.map(dependency => {
          return dependency()
        })
      }

      get dependencies() {
        return this.hasDependencies
          ? this.dependenciesAsPromises
          : [Promise.resolve(true)]
      }

      getWrappedInstance() {
        return this.refs.wrappedInstance
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
        if (WrappedComponent.onDependencyFailure) {
          WrappedComponent.onDependencyFailure(results)
        }
      }

      componentWillMount() {
        if (this.hasDependencies) {
          Promise.all(this.dependencies)
            .then(results => this.onDependencyResolution(results))
            .catch(reason => this.onDependencyFailure(reason))
        } else {
          this.onDependencyResolution()
        }
      }

      render() {

        if (!this.state.dependenciesResolved) {
          if (LoadingComponent) {
            return <LoadingComponent />;
          }
          return null;
        }

        return <WrappedComponent {...this.props} ref='resolverWrappedInstance' />;
      }

    }

    return DependenciesResolver;
  }

}
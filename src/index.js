import React from 'react';

export default function resolveDependencies(LoadingComponent, FailureComponent) {

  return function wrapWithResolver(WrappedComponent) {

    class DependenciesResolver extends React.PureComponent {

      static wrappedComponent = WrappedComponent

      static defaultProps = {
        serverRendered: false
      }

      constructor(props, context) {
        super(props, context);
        if (!this.isOnServer) {
          this.state = {
            dependenciesResolved: this.props.serverRendered,
            dependenciesFailed: false
          }
        }
        this.onDependencyResolution = this.onDependencyResolution.bind(this);
        this.onDependencyFailure = this.onDependencyFailure.bind(this);
      }

      static arrayPropertyIsValid(component, propertyName) {
        return Array.isArray(component[propertyName]) && component[propertyName].length > 0;
      }

      get isOnServer() {
        return !(typeof window !== 'undefined' && window.document);
      }

      static componentHasDependencies(component) {
        return this.arrayPropertyIsValid(component, 'dependencies')
      }

      static componentDependencies(component) {
        return component.dependencies.map(dependency => {
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

      static dependencies(component) {
        return this.componentHasDependencies(component)
          ? this.componentDependencies(component)
          : [Promise.resolve('no component dependencies')]
      }

      componentWillMount() {
        if (!this.isOnServer && !this.props.serverRendered) {
          Promise.all(this.constructor.dependencies(WrappedComponent))
            .then(this.onDependencyResolution)
            .catch(this.onDependencyFailure)
        }
      }

      render() {

        if (!this.isOnServer && !this.state.dependenciesResolved) {
          if (LoadingComponent && !this.state.dependenciesFailed) {
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
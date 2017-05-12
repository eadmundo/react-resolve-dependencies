import React from 'react';
import getDisplayName from 'react-display-name';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

export default function resolveDependencies(LoadingComponent, FailureComponent) {

  return function wrapWithResolver(WrappedComponent) {

    class DependenciesResolver extends React.PureComponent {

      static displayName = `DependenciesResolver(${getDisplayName(WrappedComponent)})`;

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

      get isOnServer() {
        return !(typeof window !== 'undefined' && window.document);
      }

      static arrayPropertyIsValid(component, propertyName) {
        return Array.isArray(component[propertyName]) && component[propertyName].length > 0;
      }

      static componentHasDependencies(component) {
        return this.arrayPropertyIsValid(component, 'dependencies')
      }

      static componentDependencies(component, state, dispatch, resProps) {
        return component.dependencies.map(dependency => {
          return dependency(state, dispatch, resProps)
        })
      }

      onDependencyResolution(results=[]) {
        if (!this.isOnServer) {
          this.setState({
            dependenciesResolved: true
          })
        }
        if (WrappedComponent.onDependencyResolution) {
          // WrappedComponent.onDependencyResolution(results)
        }
      }

      onDependencyFailure(reason) {
        console.log(reason)
        if (!this.isOnServer) {
          console.log('setting state')
          this.setState({
            dependenciesFailed: true
          })
        }
        if (WrappedComponent.onDependencyFailure) {
          // WrappedComponent.onDependencyFailure(this.props.dispatch, reason)
        }
      }

      static resolve(component, state, dispatch, resProps, onResolution, onFailure) {
        Promise.all(this.dependencies(component, state, dispatch, resProps))
          .then(results => {
            if (component.onDependencyFailure) {
              // component.onDependencyFailure(dispatch, results)
            }
            return onResolution(results)
          })
          .catch(reason => {
            if (component.onDependencyFailure) {
              // component.onDependencyFailure(dispatch, reason)
            }
            return onFailure(reason)
          })
      }

      static dependencies(component, state, dispatch, resProps) {
        return this.componentHasDependencies(component)
          ? this.componentDependencies(component, state, dispatch, resProps)
          : [Promise.resolve('no component dependencies')]
      }

      componentDidMount() {
        if (!this.props.serverRendered) {
          this.constructor.resolve(WrappedComponent, this.props.dispatch, (results) => {
            this.onDependencyResolution(results);
            if (WrappedComponent.redirectOnSuccess) {
              this.props.dispatch(push(WrappedComponent.redirectOnSuccess))
            }
          }, (reason) => {
            this.onDependencyFailure(reason);
            if (WrappedComponent.redirectOnFailure) {
              this.props.dispatch(push(WrappedComponent.redirectOnFailure))
            }
          })
        }
      }

      static resolveDependencies(dispatch) {
        Promise.all(this.dependencies(WrappedComponent))
          .then(this.onDependencyResolution)
          .catch(this.onDependencyFailure)
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

    return connect()(DependenciesResolver);
  }

}
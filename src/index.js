import React, { useState, useEffect } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { makeCancelable } from './makeCancelable';

export default function resolveDependencies(
  LoadingComponent,
  FailureComponent,
) {
  return function wrapWithResolver(WrappedComponent) {
    const DependenciesResolver = props => {
      const [dependenciesResolved, setDependenciesResolved] = useState(false);
      const [dependenciesFailed, setDependenciesFailed] = useState(false);
      const [reason, setReason] = useState(null);

      const arrayPropertyIsValid = (component, propertyName) => {
        return (
          Array.isArray(component[propertyName]) &&
          component[propertyName].length > 0
        );
      };

      const componentHasDependencies = component =>
        arrayPropertyIsValid(component, 'dependencies');

      const componentDependencies = component =>
        component.dependencies.map(dependency => dependency(props), this);

      const dependencies = component =>
        componentHasDependencies(component)
          ? componentDependencies(component)
          : [Promise.resolve('no component dependencies')];

      const onDependencyResolution = (results = []) => {
        setDependenciesResolved(true);
        if (WrappedComponent.onDependencyResolution) {
          WrappedComponent.onDependencyResolution(results);
        }
      };

      const onDependencyFailure = reason => {
        const { isCanceled } = reason;

        if (!isCanceled) {
          // If we have cancelled the promise when unmounting the component, don't
          // attempt to update any state values.
          setDependenciesFailed(true);
          setReason(reason);
          if (WrappedComponent.onDependencyFailure) {
            WrappedComponent.onDependencyFailure(reason);
          }
        }
      };

      useEffect(() => {
        const cancelablePromise = makeCancelable(Promise.all(
          dependencies(WrappedComponent)
        ));

        cancelablePromise
          .promise
          .then(onDependencyResolution)
          .catch(onDependencyFailure)

        return function cleanup() {
          cancelablePromise.cancel()
        };
      }, []);

      if (!dependenciesResolved) {
        if (LoadingComponent && !dependenciesFailed) {
          return <LoadingComponent {...props} />;
        }
        if (dependenciesFailed && FailureComponent) {
          return <FailureComponent {...props} reason={reason} />;
        }
        return null;
      }
      return <WrappedComponent {...props} />;
    };

    return hoistNonReactStatics(DependenciesResolver, WrappedComponent);
  };
}

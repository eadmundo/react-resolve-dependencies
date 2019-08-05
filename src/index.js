import React, { useState, useEffect } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

export default function resolveDependencies(
  LoadingComponent,
  FailureComponent,
) {
  return function wrapWithResolver(WrappedComponent) {
    const DependenciesResolver = (props) => {
      const [dependenciesResolved, setDependenciesResolved] = useState(false);
      const [dependenciesFailed, setDependenciesFailed] = useState(false);
      const [reason, setReason] = useState(null);

      const componentHasDependencies = component => arrayPropertyIsValid(component, 'dependencies');

      const componentDependencies = component => component.dependencies.map(
        dependency => dependency(props),
        this,
      );

      const dependencies = component => (componentHasDependencies(component)
        ? componentDependencies(component)
        : [Promise.resolve('no component dependencies')])

      const arrayPropertyIsValid = (component, propertyName) => {
        return Array.isArray(component[propertyName]) && component[propertyName].length > 0;
      }

      const onDependencyResolution = (results = []) => {
        setDependenciesResolved(true);
        if (WrappedComponent.onDependencyResolution) {
          WrappedComponent.onDependencyResolution(results);
        }
      }

      const onDependencyFailure = (reason) => {
        setDependenciesFailed(true)
        setReason(reason)
        if (WrappedComponent.onDependencyFailure) {
          WrappedComponent.onDependencyFailure(reason);
        }
      }

      useEffect(() => {
        let hasCancelled = false;

        if (!hasCancelled) {
          Promise.all(dependencies(WrappedComponent))
            .then(onDependencyResolution)
            .catch(onDependencyFailure);
        }
        return () => hasCancelled = true;
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
    }

    return hoistNonReactStatics(DependenciesResolver, WrappedComponent);
  };
}

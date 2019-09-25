
import { expect } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import React from 'react';
import resolveDependencies from '../src'

class FailureComponent extends React.Component {
  render() {
    return <div className="failed">Dependency Failure</div>
  }
}

describe('resolveDependencies', () => {

  let WrappedComponent;
  let mountedComponent;
  let dependencyStub;

  context('no dependencies', () => {

    beforeEach(done => {
      function onDependencyResolution() {
        done()
      }

      class ComponentWithoutDependencies extends React.Component {
        static onDependencyResolution = onDependencyResolution
        render() {
          return null
        }
      }

      WrappedComponent = resolveDependencies(null, FailureComponent)(ComponentWithoutDependencies)
      mountedComponent = mount(<WrappedComponent />)
    })

    it('should render the WrappedComponent', () => {
      expect(mountedComponent.contains(<WrappedComponent />)).to.be.true;
    })
  })

  context('failing dependencies', () => {
    beforeEach(done => {
      function onDependencyFailure() {
        done()
      }

      dependencyStub = sinon.stub().returns(Promise.reject('failed'))

      const ComponentWithFailingDependencies = () => null;

      ComponentWithFailingDependencies.dependencies = [dependencyStub]
      ComponentWithFailingDependencies.onDependencyFailure = onDependencyFailure

      WrappedComponent = resolveDependencies(() => null, FailureComponent)(ComponentWithFailingDependencies)
      mountedComponent = mount(<WrappedComponent />)
    })

    it('should attempt to resolve the dependencies', () => {
      expect(dependencyStub.calledOnce).to.be.true;
    })

    it('should render the FailureComponent', () => {
      expect(mountedComponent.update().find('.failed').length === 1);
    })
  })

  context('resolving dependencies', () => {
    beforeEach(done => {

      function onDependencyResolution() {
        done()
      }

      dependencyStub = sinon.stub().returns(Promise.resolve('succeeded'))

      class ComponentWithResolvingDependencies extends React.Component {
        static dependencies = [
          dependencyStub
        ]
        static onDependencyResolution = onDependencyResolution
        render() {
          return null
        }
      }

      WrappedComponent = resolveDependencies()(ComponentWithResolvingDependencies)
      mountedComponent = mount(<WrappedComponent />)
    })

    it('should resolve the dependencies', () => {
      expect(dependencyStub.calledOnce).to.be.true;
    })

    it('should render the WrappedComponent', () => {
      expect(mountedComponent.contains(<WrappedComponent />)).to.be.true;
    })
  })

  context('cancelling dependency resolution', () => {
    it('should not call onDependencyResolution or onDependencyFailure', (done) => {
      // Promise will never resolve
      dependencyStub = sinon.stub().returns(new Promise(() => {
        setTimeout(() => {}, 2000);
      }));

      const failureSpy = sinon.spy();
      const successSpy = sinon.spy();

      class ComponentWithResolvingDependencies extends React.Component {
        static dependencies = [dependencyStub];
        static onDependencyResolution = successSpy;
        static onDependencyFailure = failureSpy;

        render() {
          return null
        }
      }

      WrappedComponent = resolveDependencies()(ComponentWithResolvingDependencies)
      mountedComponent = mount(<WrappedComponent />)

      expect(dependencyStub.calledOnce).to.be.true;

      mountedComponent.unmount();

      expect(failureSpy.calledOnce).to.be.false;
      expect(successSpy.calledOnce).to.be.false;

      done()
    })
  })
})

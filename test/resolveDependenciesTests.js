import { expect } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import React from 'react';
import resolveDependencies from '../src'

class FailureComponent extends React.Component {

  render() {
    return <div>Dependency Failure</div>
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

    it('should set dependenciesResolved to true', () => {
      expect(mountedComponent.state('dependenciesResolved')).to.be.true;
    })

    it('should leave dependenciesFailed as false', () => {
      expect(mountedComponent.state('dependenciesFailed')).to.be.false;
    })

  })

  context('failing dependencies', () => {

    beforeEach(done => {

      function onDependencyFailure() {
        done()
      }

      dependencyStub = sinon.stub().returns(Promise.reject('failed'))

      class ComponentWithFailingDependencies extends React.Component {

        static dependencies = [
          dependencyStub
        ]

        static onDependencyFailure = onDependencyFailure

        render() {
          return null
        }

      }

      WrappedComponent = resolveDependencies(null, FailureComponent)(ComponentWithFailingDependencies)
      mountedComponent = mount(<WrappedComponent />)
    })

    it('should attempt to resolve the dependencies', () => {
      expect(dependencyStub.calledOnce).to.be.true;
    })

    it('should render the FailureComponent', () => {
      expect(mountedComponent.contains(<FailureComponent />)).to.be.true;
    })

    it('should set dependenciesFailed to true', () => {
      expect(mountedComponent.state('dependenciesFailed')).to.be.true;
    })

    it('should leave dependenciesResolved as false', () => {
      expect(mountedComponent.state('dependenciesResolved')).to.be.false;
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

    it('should set dependenciesResolved to true', () => {
      expect(mountedComponent.state('dependenciesResolved')).to.be.true;
    })

    it('should leave dependenciesFailed as false', () => {
      expect(mountedComponent.state('dependenciesFailed')).to.be.false;
    })

  })
})
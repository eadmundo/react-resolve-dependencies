import jsdom from 'jsdom';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

const { JSDOM } = jsdom;
const virtualConsole = new jsdom.VirtualConsole();

/* Console error handling. */
virtualConsole.on('jsdomError', (error) => {
  console.error(error.stack, error.detail); /* eslint-disable-line no-console */
});

/* Console logging. */
virtualConsole.on('log', (message) => {
  console.log('console.log called ->', message); /* eslint-disable-line no-console */
});

/* Create the DOM. */
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  virtualConsole,
  url: 'http://localhost/',
});

/* Define the window and document objects. */
global.window = dom.window;
global.document = dom.window.document;

/* Make all keys in the window object available globally. */
Object.keys(window).forEach((key) => { // eslint-disable-line no-undef
  if (!(key in global)) {
    global[key] = window[key]; /* eslint-disable-line no-undef */
  }
});

/* This is so that we can stub these methods with sinon in tests */
class MockLocalStorage {
  setItem() {} /* eslint-disable-line class-methods-use-this */
  getItem() {} /* eslint-disable-line class-methods-use-this */
}

/* Add mock local storage. */
global.localStorage = new MockLocalStorage();

/* Configure enzyme to work with react 16. */
Enzyme.configure({ adapter: new Adapter() });

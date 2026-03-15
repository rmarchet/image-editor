import { mount } from './index';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

mount(rootElement);

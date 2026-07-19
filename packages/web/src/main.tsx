import { render } from 'preact';
import { App } from './app.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root element');
render(<App />, root);

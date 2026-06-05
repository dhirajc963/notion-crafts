// polyfill browser globals used inside component bodies
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.window = { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
global.document = { addEventListener() {}, removeEventListener() {}, documentElement: { style: {} } };
global.navigator = { clipboard: { writeText() {} }, userAgent: 'node' };
require('./bundle.cjs');

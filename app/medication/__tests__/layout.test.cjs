/* eslint-env node */
/* eslint-disable no-undef */
const assert = require('node:assert');
const Module = require('module');
const path = require('path');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'expo-router') {
    return path.resolve(__dirname, './expo-router-stub.js');
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const { SCREEN_TITLES, default: MedicationLayout } = require('../_layout');

const element = MedicationLayout();
const rawChildren = element.props.children;
const screens = Array.isArray(rawChildren) ? rawChildren.flat() : [rawChildren];

const names = ['add', 'scan', 'manually', '[id]'];

for (const name of names) {
  const screen = screens.find((s) => s.props.name === name);
  assert(screen, `Screen '${name}' not found`);
  assert.strictEqual(screen.props.options?.title, SCREEN_TITLES[name]);
}

const confirmation = screens.find((s) => s.props.name === 'confirmation');
assert(confirmation, "Screen 'confirmation' not found");
assert.strictEqual(confirmation.props.options?.headerShown, false);

console.log('Medication screen titles verified');



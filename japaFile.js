require('@adonisjs/require-ts/build/register')
require('reflect-metadata')

const { configure } = require('japa')
configure({
  files: ['test/**/*.spec.ts'],
})

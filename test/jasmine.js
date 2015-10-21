#!/usr/bin/env node

var path = require('path'),
    Command = require('jasmine/lib/command.js'),
    Jasmine = require('jasmine/lib/jasmine.js');

var jasmine = new Jasmine({ projectBaseDir: path.resolve() });
var examplesDir = path.join(__dirname, '..', 'node_modules', 'jasmine-core', 'lib', 'jasmine-core', 'example', 'node_example');
var command = new Command(path.resolve(), examplesDir, console.log);

// or: hack1 - remove dot-reporter
jasmine.configureDefaultReporter({print: () => {} });

// or: hack2 - add custom reporter
var SpecReporter = require('jasmine-spec-reporter');
var reporter = new SpecReporter();
jasmine.addReporter(reporter);

command.run(jasmine, process.argv.slice(2));
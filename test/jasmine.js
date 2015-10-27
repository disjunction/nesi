#!/usr/bin/env node
"use strict";

let path = require("path"),
    Command = require("jasmine/lib/command.js"),
    Jasmine = require("jasmine/lib/jasmine.js");

let jasmine = new Jasmine({ projectBaseDir: path.resolve() });
let examplesDir = path.join(__dirname, "..", "node_modules", "jasmine-core", "lib", "jasmine-core", "example", "node_example");
let command = new Command(path.resolve(), examplesDir, console.log);

// or: hack1 - remove dot-reporter
jasmine.configureDefaultReporter({print: () => {} });

// or: hack2 - add custom reporter
let SpecReporter = require("jasmine-spec-reporter");
let reporter = new SpecReporter();
jasmine.addReporter(reporter);

command.run(jasmine, process.argv.slice(2));
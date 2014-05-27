#!/usr/bin/env node

(function(global) {

var USAGE = _multiline(function() {/*
    Usage:
        node bin/Zzz.js [--help]
                        [--verbose]
                        [--output output-file]
                        input-file [input-file ...]

    See:
        https://github.com/uupaa/Zzz.js/wiki/Zzz.js
*/});


var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

var Zzz     = require("../lib/Zzz");
var fs      = require("fs");
var argv    = process.argv.slice(2);
var options = _parseCommandLineOptions({
        help:       false,      // Boolean: true is show help.
        verbose:    false,      // Boolean: true is verbose mode.
        output:     "a.out",    // String: output file.
        inputs:     []          // StringArray: input files. [file, ...]
    });

if (options.help) {
    console.log(CONSOLE_COLOR.YELLOW + USAGE + CONSOLE_COLOR.CLEAR);
    return;
}

if (options.verbose) {
}

/*
Zzz({
    "verbose":      options.verbose,
    "output":       options.output,
    "inputs":       options.inputs,
}, function(err) {
    //
});
 */

function _parseCommandLineOptions(options) { // @arg Object:
                                             // @ret Object:
    for (var i = 0, iz = argv.length; i < iz; ++i) {
        switch (argv[i]) {
        case "-h":
        case "--help":      options.help = true; break;
        case "-v":
        case "--verbose":   options.verbose = true; break;
        case "--output":    options.output = argv[++i]; break;
        default:
            var file = argv[i];
            if (options.inputs.indexOf(file) < 0) { // avoid duplicate
                options.inputs.push(file);
            }
        }
    }
    return options;
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}

})((this || 0).self || global);


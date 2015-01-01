(function(global) {

var _USAGE = _multiline(function() {/*
    Usage:
        node WebModule/run/score.js [--help]
                                    [--verbose]
                                    [--title page-title]
                                    [--output output-dir]
                                    input-file [input-file ...]

    See:
        https://github.com/uupaa/Plato.js/wiki/Plato
*/});

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";

// require("../lib/plato.js") は、score.js を呼び出したスクリプトのディレクトリを基準としたパスになるため、WebModule/run/lib/xxx.js などを require できない
// fs.read("../lib/plato.js") は、score.js を呼び出したスクリプトのディレクトリを記述としたパスになる

//var Plato   = require("../lib/plato"); // WebModule/run/lib/plato.js
var fs   = require("fs");
var cp   = require("child_process");
var argv = process.argv.slice(2);
var pkg  = JSON.parse(fs.readFileSync("./package.json"));
var wmlib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod = require(wmlib + "Module.js");
var target = mod.collectBuildTarget(pkg);

var options = _parseCommandLineOptions({
        help:       false,          // Boolean: true is show help.
        verbose:    false,          // Boolean: true is verbose mode.
        title:      pkg.name,       // String: title.
        output:     "./lint/plato", // String: output dir.
        files:      target.sources  // StringArray: input files. [file, ...]
    });

if (options.help) {
    console.log(WARN + _USAGE + CLR);
    return;
}
if (!options.files.length) {
    console.log(ERR + "Input files are empty." + CLR);
    return;
}

Plato({
    "verbose":      options.verbose,
    "title":        options.title,
    "output":       options.output,
    "files":        options.files
}, function() { });


// --- class / interfaces ----------------------------------
function Plato(options,    // @arg Object - { verbose, title, output, files }
               callback) { // @arg Function = null - callback(err):void
//{@dev
    _if(options.constructor !== ({}).constructor, Plato, "options");
    _if(!_keys(options, "verbose,title,output,files"), Plato, "options");
    if (callback) {
        _if(typeof callback !== "function", Plato, "callback");
    }
//}@dev

    _do(options, callback || null);
}

// --- implements ------------------------------------------
function _do(options, callback) {

    var command = "plato";

    if (options.title) {
        command += " --title " + options.title;
    }
    command += " --dir "   + options.output;
    command += " --jshint .jshintrc";
    command += " " + options.files.join(" ");

    if (options.verbose) {
        console.log("command: " + command);
    }
    cp.exec(command, function(err) {
        if (!err) {
            if (options.verbose) {
                console.log(command);
            }
            _parseHistoryJS();
            _parseHistoryJSON();
            _parseReportJS();
            _parseReportJSON();
        }
        if (options.callback) {
            callback(err);
        }
    });
}

// ---------------------------------------------------------
function _parseHistoryJS() {
    var fileName = "./lint/plato/report.history.js";

    if (fs.existsSync(fileName)) {
        _write(fileName, "__history = ", _load(fileName), "");
    }
}
function _parseHistoryJSON() {
    var fileName = "./lint/plato/report.history.json";

    if (fs.existsSync(fileName)) {
        _write(fileName, "", _load(fileName), "");
    }
}

function _parseReportJS() {
    var fileName = "./lint/plato/report.js";

    if (fs.existsSync(fileName)) {
        _write(fileName, "__report = ", _sort(_load(fileName)), "");
    }
}
function _parseReportJSON() {
    var fileName = "./lint/plato/report.json";

    if (fs.existsSync(fileName)) {
        _write(fileName, "", _sort(_load(fileName)), "");
    }
}

function _load(fileName) {
    if (/\.json$/.test(fileName)) {
        return JSON.parse( fs.readFileSync(fileName, "utf8") );
    } else if (/\.js$/.test(fileName)) {
        return eval("(" + fs.readFileSync(fileName, "utf8") + ")");
    }
    return fs.readFileSync(fileName, "utf8");
}

function _sort(json) {
    var result = {};
    var keys = Object.keys(json).sort();

    for (var i = 0, iz = keys.length; i < iz; ++i) {
        result[keys[i]] = json[keys[i]];
    }
    return result;
}

function _write(fileName, prefix, json, postfix) {
    fs.writeFileSync(fileName, prefix + JSON.stringify(json, null, 2) + postfix + "\n");
}

//{@dev
function _keys(value, keys) {
    var items = keys.split(",");

    return Object.keys(value).every(function(key) {
        return items.indexOf(key) >= 0;
    });
}

function _if(value, fn, hint) {
    if (value) {
        throw new Error(fn.name + " " + hint);
    }
}
//}@dev


function _parseCommandLineOptions(options) {
    for (var i = 0, iz = argv.length; i < iz; ++i) {
        switch (argv[i]) {
        case "-h":
        case "--help":      options.help = true; break;
        case "-v":
        case "--verbose":   options.verbose = true; break;
        case "--title":     options.title = argv[++i]; break;
        case "--output":    options.output = argv[++i]; break;
        default:
            var file = argv[i];
            if (options.files.indexOf(file) < 0) { // avoid duplicate
                options.files.push(file);
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


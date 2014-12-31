#!/usr/bin/env node

(function(global) {

var USAGE = _multiline(function() {/*
    Usage:
        node Minify.js [@label ...]
                       [--brew]
                       [--help]
                       [--verbose]
                       [--nowrap]
                       [--nocompile]
                       [--header file]
                       [--footer file]
                       [--es5in]
                       [--es6in]
                       [--es5out]
                       [--es6out]
                       [--keep]
                       [--simple]
                       [--strict]
                       [--pretty]
                       [--option "compile option"]
                       [--extern file]
                       [--output file]
                       [--source file]
                       [--label @label]
                       [--release]

    See:
        https://github.com/uupaa/Minify.js/wiki/Minify
*/});

var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

var fs = require("fs");
var cp = require("child_process");
var argv = process.argv.slice(2);
var wmlib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod = require(wmlib + "Module.js");
var pkg = JSON.parse(fs.readFileSync("./package.json"));
var wm = pkg.webmodule;

var options = _parseCommandLineOptions({
        name:       pkg.name,       // Object       - { git:String, npm:String }. github repository name, npm package name.
        brew:       false,          // Boolean      - use brew installed closure-compiler.
        help:       false,          // Boolean      - true is show help.
        keep:       false,          // Boolean      - keep tmp file.
        label:      ["dev", "debug", "assert"], // LabelStringArray
        nowrap:     false,          // Boolean      - false -> wrap WebModule idiom.
        header:     "",             // PathString   - header file.
        footer:     "",             // PathString   - footer file.
        es5in:      false,          // Boolean      - input ES5 code.
        es6in:      false,          // Boolean      - input ES6 code.
        es5out:     false,          // Boolean      - output ES5 code.
        es6out:     false,          // Boolean      - output ES6 code.
        strict:     false,          // Boolean      - true -> add 'use strict'.
        pretty:     false,          // Boolean      - true -> pretty print.
        source:     wm.source,      // PathStringArray - package.json webmodule.source. ["source-file", ...]
        target:     wm.target,      // StringArray  - build target. ["Browser", "Worker", "Node"]
        output:     wm.output,      // PathString   - "output-file-name"
        option:     [],             // OptionStringArray - ["language_in ECMASCRIPT5_STRICT", ...]
        compile:    true,           // Boolean      - true -> compile.
        release:    false,          // Boolean      - true -> release build, use NodeModule.files().
        externs:    [],             // FilePathArray- ["externs-file-name", ...]
        verbose:    false,          // Boolean      - true -> verbose mode.
        workDir:    "",             // PathString   - work dir.
        advanced:   true            // Boolean      - true -> ADVANCED_OPTIMIZATIONS MODE.
    });

if (options.help) {
    console.log(CONSOLE_COLOR.YELLOW + USAGE + CONSOLE_COLOR.CLEAR);
    return;
}
if (!options.source.length) {
    console.log(CONSOLE_COLOR.RED + "Input source are empty." + CONSOLE_COLOR.CLEAR);
    return;
}
if (!options.output.length) {
    console.log(CONSOLE_COLOR.RED + "Output file is empty." + CONSOLE_COLOR.CLEAR);
    return;
}
if (!options.workDir.length) {
    console.log(CONSOLE_COLOR.RED + "WorkDir is empty." + CONSOLE_COLOR.CLEAR);
    return;
}

// $ npm run build は、package.json の webmodule.source( options.source ) 以下をビルドします
// $ npm run build.release は、webmodule.source に加え、依存関係にあるファイルもビルドします
var mergedSource = options.source;

if (options.release) {
    // 依存関係にあるソース(deps.files.all)を取得する
    var deps = mod.getDependencies(options.release);

    console.log("\u001b[33m" + "deps.files.all: " + JSON.stringify(deps.files.all, null, 2) + "\u001b[0m");
    console.log("\u001b[35m" + "source: "         + JSON.stringify(options.source, null, 2) + "\u001b[0m");

    // ソースコードのリストをマージし重複を取り除く
    mergedSource = mod.toUniqueArray([].concat(deps.files.all, options.source));

    if (options.verbose) {
        console.log("Release build source: " + JSON.stringify(mergedSource, null, 2));
    }
} else {
    //
}

if (!_isFileExists(options.externs)) {
    console.log(CONSOLE_COLOR.YELLOW + USAGE + CONSOLE_COLOR.CLEAR);
    return;
}
if (!_isFileExists(mergedSource)) {
    console.log(CONSOLE_COLOR.YELLOW + USAGE + CONSOLE_COLOR.CLEAR);
    return;
}

Minify(mergedSource, {
    "brew":         options.brew,
    "keep":         options.keep,
    "label":        options.label,
    "nowrap":       options.nowrap,
    "header":       options.header,
    "footer":       options.footer,
    "es5in":        options.es5in,
    "es6in":        options.es6in,
    "es5out":       options.es5out,
    "es6out":       options.es6out,
    "strict":       options.strict,
    "pretty":       options.pretty,
    "option":       options.option,
    "compile":      options.compile,
    "externs":      options.externs,
    "verbose":      options.verbose,
    "workDir":      options.workDir,
    "advanced":     options.advanced
}, function(err,  // @arg Error
            js) { // @arg String - minified JavaScript Expression string.
    fs.writeFileSync(options.output, js);
});

function _isFileExists(fileList) { // @arg Array
                                   // @ret Boolean
    return fileList.every(function(file) {
        if (!fs.existsSync(file)) {
            console.log(CONSOLE_COLOR.RED + "File not found: " + file + CONSOLE_COLOR.CLEAR);
            return false;
        }
        return true;
    });
}

function _parseCommandLineOptions(options) {
    for (var i = 0, iz = argv.length; i < iz; ++i) {
        switch (argv[i]) {
        case "-h":
        case "--help":      options.help = true; break;
        case "-v":
        case "--brew":      options.brew = true; break;
        case "--verbose":   options.verbose = true; break;
        case "--nowrap":    options.nowrap = true; break;
        case "--nocompile": options.compile = false; break;
        case "--header":    options.header = fs.readFileSync(argv[++i], "utf8"); break;
        case "--footer":    options.footer = fs.readFileSync(argv[++i], "utf8"); break;
        case "--es5in":     options.es5in = true; break;
        case "--es6in":     options.es6in = true; break;
        case "--es5out":    options.es5out = true; break;
        case "--es6out":    options.es6out = true; break;
        case "--strict":    options.strict = true; break;
        case "--pretty":    options.pretty = true; break;
        case "--keep":      options.keep = true; break;
        case "--simple":    options.advanced = false; break;
        case "--output":    options.output = argv[++i]; break;
        case "--extern":
        case "--externs":   _pushif(options.externs, argv[++i]); break;
        case "--option":    _pushif(options.option, argv[++i]); break;
        case "--module":
        case "--release":   options.release = true; break;
        case "--label":     _pushif(options.label, argv[++i].replace(/^@/, "")); break;
        case "--source":    _pushif(options.source, argv[++i]); break;
        default:
            if ( /^@/.test(argv[i]) ) { // @label
                _pushif(options.label, argv[i].replace(/^@/, ""));
            } else {
                throw new Error("Unknown option: " + argv[i]);
            }
        }
    }
    // work dir
    if (options.output) {
        if (options.output.indexOf("/") <= 0) {
            options.workDir = "";
        } else {
            // "release/Zzz.min.js" -> "release/";
            options.workDir = (options.output.split("/").slice(0, -1)).join("/") + "/";
        }
    }
    return options;
}

function _pushif(source, value) {
    if (source.indexOf(value) < 0) { // avoid duplicate
        source.push(value);
    }
}

function _multiline(fn) { // @arg Function
                          // @ret String
    return (fn + "").split("\n").slice(1, -1).join("\n");
}















// Closure Compiler Service
//  http://closure-compiler.appspot.com/home

// --- dependency modules ----------------------------------

// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

var OUTPUT_FILE   = "./.Minify.output.js";
var TMP_FILE      = "./.Minify.tmp.js";

// --- class / interfaces ----------------------------------
function Minify(sources, // @arg StringArray - JavaScript sources file path. [path, ...]
                options, // @arg Object = null - { brew, keep, label, nowrap, header, footer, es5in, es6in, es5out, es6out, strict, pretty, option, compile, externs, verbose, workDir, advanced }
                         // @options.brew       Boolean = false  - force global installed closure-compiler.
                         // @options.keep       Boolean = false  - keep temporary file.
                         // @options.label      LabelStringArray = null - ["@label", ...]
                         // @options.nowrap     Boolean = false  - false is wrap WebModule idiom.
                         // @options.header     String = ""      - Header part extras JavaScript expression string.
                         // @options.footer     String = ""      - Footer part extras JavaScript expression string.
                         // @options.es5in      Boolean = false  - input ES5 code.
                         // @options.es6in      Boolean = false  - input ES6 code.
                         // @options.es5out     Boolean = false  - output ES5 code.
                         // @options.es6out     Boolean = false  - output ES6 code.
                         // @options.strict     Boolean = false  - true is add 'use strict'.
                         // @options.pretty     Boolean = false  - true is pretty strict.
                         // @options.option     StringArray = [] - ClosureCompiler additional options string.
                         // @options.compile    Boolean = false  - true is compile. false is concat files.
                         // @options.externs    StringArray = [] - Clouser Compiler externs definition file path
                         // @options.verbose    boolean = false  - true is verbose mode.
                         // @options.workDir    String = ""      - work dir.
                         // @options.advanced   Boolean = false  - true is advanced build mode
                fn) {    // @arg Function = null - callback function. fn(err:Error, result:String)
//{@dev
    _if(!Array.isArray(sources), Minify, "sources");
    if (options) {
        _if(options.constructor !== ({}).constructor, Minify, "options");
        _if(!_keys(options, "brew,keep,label,nowrap,header,footer,es5in,es6in,es5out,es6out,strict,pretty,option,compile,externs,verbose,workDir,advanced"), Minify, "options");
    }
    if (fn) {
        _if(typeof fn !== "function", Minify, "fn");
    }
//}@dev

    var optionsString = _makeClouserCompilerOptions(options);

    if (options.compile) {
        cp.exec("which -s closure-compiler", function(err) {
            var brew = options.brew || false;

            if (err) {
                brew = false;
            }

            if (brew) {
                // $ brew install closure-compiler
                _offlineMinificationBrew(sources, options, optionsString, fn);
            } else {
                // $ node install uupaa.compile.js
                _offlineMinificationNode(sources, options, optionsString, fn);
            }
        });
    } else {
        // debug build, concat and preprocess only.
        _noMinification(sources, options, fn);
    }
}

Minify["preprocess"] = Minify_preprocess; // Minify.preprocess(js:JavaScriptExpressionString, labels):String

// --- implements ------------------------------------------
function _makeClouserCompilerOptions(options) { // @arg Object - { keep, nowrap, ... }. see Minify()
                                                // @ret String - "--option value ..."
    var result = [];

  //result["transform_amd_modules"] = "";
  //result["create_source_map"] = "source.map";

    if (options.advanced) {
        result.push("--compilation_level ADVANCED_OPTIMIZATIONS");
        if (options.externs && options.externs.length) {
            result.push("--externs " + options.externs.join(" --externs "));
        }
    } else {
        result.push("--compilation_level SIMPLE_OPTIMIZATIONS");
    }
    if (!options.nowrap) { // wrap WebModule idiom
        result.push("--output_wrapper '(function(global){\n%output%\n})((this||0).self||global);'");
    }

    if (options.strict) {
        if (options.es5in) {
            result.push("--language_in ECMASCRIPT5_STRICT");
        } else if (options.es6in) {
            result.push("--language_in ECMASCRIPT6_STRICT");
        } else { // back compat
            result.push("--language_in ECMASCRIPT5_STRICT");
        }
        if (options.es5out) {
            result.push("--language_out ECMASCRIPT5_STRICT");
        } else if (options.es6out) {
            result.push("--language_out ECMASCRIPT6_STRICT");
        }
    } else {
        if (options.es5in) {
            result.push("--language_in ECMASCRIPT5");
        } else if (options.es6in) {
            result.push("--language_in ECMASCRIPT6");
        } else { // back compat
            result.push("--language_in ECMASCRIPT5");
        }
        if (options.es5out) {
            result.push("--language_out ECMASCRIPT5");
        } else if (options.es6out) {
            result.push("--language_out ECMASCRIPT6");
        }
    }
    if (options.pretty) {
        result.push("--formatting pretty_print");
    }
    if (options.option.length) {
        result.push("--" + optionsObject.option.join(" --"));
    }
    return result.join(" ");
}

function _offlineMinificationBrew(sources,       // @arg StringArray - JavaScript SourceCode file path. [path, ...]
                                  options,       // @arg Object - { keep, nowrap, ... }. see Minify()
                                  optionsString, // @arg String
                                  callback) {    // @arg Function = null - callback(err:Error, result:String)

    var js = (options.header || "") + _concatFiles(sources) + (options.footer || "");

    if (options.label && options.label.length) {
        js = Minify_preprocess(js, options.label);
    }
    fs.writeFileSync(options.workDir + TMP_FILE, js);

    var command = "closure-compiler "  + optionsString +
                  " --js_output_file " + options.workDir + OUTPUT_FILE +
                  " --js "             + options.workDir + TMP_FILE;

    if (options.verbose) {
        console.log(CONSOLE_COLOR.GREEN + command + CONSOLE_COLOR.CLEAR);
    }

    cp.exec(command, function(err, stdout, stderr) {
        if (err || stderr) {
            console.log(stderr);
            if (callback) {
                callback(new Error(stderr), "");
            }
        } else {
            var minifiedCode = fs.readFileSync(options.workDir + OUTPUT_FILE, "utf8");

            fs.unlinkSync(options.workDir + OUTPUT_FILE);
            if (!options.keep) {
                fs.unlinkSync(options.workDir + TMP_FILE);
            }
            if (callback) {
                callback(null, minifiedCode);
            }
        }
    });
}

function _offlineMinificationNode(sources,       // @arg StringArray - JavaScript SourceCode file path. [path, ...]
                                  options,       // @arg Object - { keep, nowrap, ... }. see Minify()
                                  optionsString, // @arg String
                                  callback) {    // @arg Function = null - callback(err:Error, result:String)

    var js = (options.header || "") + _concatFiles(sources) + (options.footer || "");

    if (options.label && options.label.length) {
        js = Minify_preprocess(js, options.label);
    }
    fs.writeFileSync(options.workDir + TMP_FILE, js);

    if (options.verbose) {
        console.log(CONSOLE_COLOR.GREEN + "\nCompile options: \n  " + optionsString.replace(/\n/g, "") + CONSOLE_COLOR.CLEAR);
    }

    // `npm install -g uupaa.compile.js`
    var compile = require("uupaa.compile.js");

    compile.exec(options.workDir + TMP_FILE,
                 options.workDir + OUTPUT_FILE,
                 optionsString,
                 function(err, stdout, stderr) {
        if (err || stderr) {
            console.log(stderr);
            if (callback) {
                callback(new Error(stderr), "");
            }
        } else {
            var minifiedCode = fs.readFileSync(options.workDir + OUTPUT_FILE, "utf8");

            fs.unlinkSync(options.workDir + OUTPUT_FILE);
            if (!options.keep) {
                fs.unlinkSync(options.workDir + TMP_FILE);
            }
            if (callback) {
                callback(null, minifiedCode);
            }
        }
    });
}

function Minify_preprocess(js,       // @arg String - JavaScript expression string.
                           labels) { // @arg StringArray - strip labels. ["label", ...]
//{@dev
    _if(typeof js !== "string", Minify_preprocess, "js");
    _if(!Array.isArray(labels), Minify_preprocess, "labels");
//}@dev

    // normalize line feed.
    js = js.replace(/(\r\n|\r|\n)/mg, "\n");

    // trim code block.
    js = _trimCodeBlock(js, labels);

    return js;
}

function _noMinification(sources, // @arg StringArray - JavaScript SourceCode file path. [path, ...]
                         options, // @arg Object - { keep, nowrap, ... } see Minify()
                         fn) {    // @arg Function = null - callback function. fn(err:Error, result:String)

    var js = (options.header || "") + _concatFiles(sources) + (options.footer || "");

    if (options.label && options.label.length) {
        js = Minify_preprocess( js, options.label );
    }
    if (fn) {
        fn(null, js);
    }
}

function _trimCodeBlock(js,       // @arg String - JavaScript expression string.
                        labels) { // @arg StringArray - [label, ...]
                                  // @ret String
    return labels.reduce(function(js, label) {
        // trim:
        //
        // {@label ... }@label
        //
        var line  = RegExp("\\{@" + label + "\\b(?:[^\\n]*)\\}@" +
                                    label + "\\b", "g");

        // trim:
        //
        // {@label
        //   ...
        // }@label
        //
        var lines = RegExp("\\{@" + label + "\\b(?:[^\\n]*)\n(?:[\\S\\s]*?)?\\}@" +
                                    label + "\\b", "g");

        return js.replace(line, " ").replace(lines, " ");
    }, js);
}

function _concatFiles(sources) { // @arg FilePathArray
                                 // @ret String
    return sources.map(function(path) {
        if (fs.existsSync(path)) {
            return fs.readFileSync(path, "utf8");
        }
        console.log(path + " is not exists");
        return "";
    }).join("");
}

// --- validate / assertions -------------------------------
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
//}@def




})((this || 0).self || global);



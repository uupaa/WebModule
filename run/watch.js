#!/usr/bin/env node

(function(global) {

var USAGE = _multiline(function() {/*
    Usage:
        node bin/Watch.js [--help]
                          [--verbose]
                          [--run script][--action script]
                          [--command script]
                          [--delay n]
                          watch-target-file [watch-target-file ...]

    See:
        https://github.com/uupaa/Watch.js/wiki/Watch
*/});

var ERR  = "\u001b[31m"; // RED
var WARN = "\u001b[33m"; // YELLOW
var INFO = "\u001b[32m"; // GREEN
var CLR  = "\u001b[0m";  // WHITE

var fs = require("fs");
var cp = require("child_process");
var argv = process.argv.slice(2);
var pkg = JSON.parse(fs.readFileSync("./package.json"));
var wmlib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod = require(wmlib + "Module.js");
var target = mod.collectBuildTarget(pkg);

var options = _parseCommandLineOptions(argv, {
        help:   false,               // show help
        source: target.sources,      // WatchTargetPathStringArray: [dir, file, ...]
        delay:  1000,                // delay time (unit ms)
        runScript: "",               // $ npm run {{script}}
        command: "",                 // $ command
        verbose: false,              // verbose
        ignoreDir: [".watchignore"]  // ignore dir name
    });

if (options.help) {
    console.log(WARN + USAGE + CLR);
    return;
}
if (!options.source.length) {
    console.log(ERR + "Input files are empty." + CLR);
    return;
}

Watch(options.source, {
    "delay":     options.delay,
    "verbose":   options.verbose,
    "ignoreDir": options.ignoreDir
}, function(err, path) { // @arg Error:
    if (!err) {
        var command = options.runScript ? ("npm run " + options.runScript) :
                      options.command   ? options.command : "";

        if (options.verbose) {
            var stat = fs.statSync(path);

            console.log(INFO + "|﹏o )з !? " + CLR + path + " (size:" + stat.size + ")");
            console.log(INFO + "|﹏・)っ   "  + CLR + command);
        }
        cp.exec(command, function(err, stdout, stderr) {
                        if (err) {
                            if (options.verbose) {
                                console.log(ERR + "|﹏<)з  error. " + CLR);
                                console.log(stdout.split("\n").map(function(line) {
                                    return ERR + "| " + CLR + line;
                                }).join("\n"));
                            }
                        } else {
                            if (options.verbose) {
                                console.log(INFO + "|◇・ミ)  done. " + CLR);
                            }
                        }
                     });
    }
});

function _parseCommandLineOptions(argv, options) {
    for (var i = 0, iz = argv.length; i < iz; ++i) {
        switch (argv[i]) {
        case "-h":
        case "--help":      options.help = true; break;
        case "-v":
        case "--verbose":   options.verbose = true; break;
        case "--delay":     options.delay = argv[++i]; break;
        case "--run":
        case "--action":    options.runScript = argv[++i]; break;
        case "--command":   options.command = argv[++i]; break;
        default:
            var path = argv[i];

            if (fs.existsSync(path) && fs.statSync(path).isFile()) {
                if (options.source.indexOf(path) < 0) { // avoid duplicate
                    options.source.push(path);
                }
            } else if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
                path = path.replace(/\/+$/, "") + "/"; // supply tail slash. "path" -> "path/"

                if (options.source.indexOf(path) < 0) { // avoid duplicate
                    options.source.push(path);
                }
            } else {
                console.log(ERR + "invalid path: " + path + CLR);
            }
        }
    }
    return options;
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}












// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

// --- class / interfaces ----------------------------------
function Watch(paths,      // @arg PathArray
               options,    // @arg Object   - { delay, action, verbose, ... }
               callback) { // @arg Function - callback(err:Error):void
//{@dev
    _if(!Array.isArray(paths),  "invalid Watch(paths)");
    _if(!_isObject(options),    "invalid Watch(,options)");
    _if(!_isFunction(callback), "invalid Watch(,,callback)");
//}@dev

    var that = this;

    this._options = options || {};

    paths.forEach(function(path) {
        if (_isFile(path)) {
            if (this._options.verbose) {
                var stat = fs.statSync(path);
                console.log(INFO + "|◇・)з   " + CLR + "start watch...");
                console.log(INFO + "|◇・)з   " + CLR + path + " (size:" + stat.size + ")");
            }
            Watch_file(that, path, function() {
                callback(null, path);
            });
/*
        } else if (_isDir(path)) {
            if (this._options.verbose) {
                console.log("|◇・)зstart watch...");
            }
            Watch_dir(that, path, function(diff) { // { path: { dir, size, mtime }, ... }
                callback(null, diff);
            }, options);
 */
        }
    });
}

// --- implements ------------------------------------------
function Watch_file(that,          // @arg this
                    watchFilePath, // @arg String   - watch file path
                    callback) {    // @arg Function - callback(null):void
    var timerID = 0;

    fs.watchFile(watchFilePath, _watchdogCallback);

    function _watchdogCallback() {
        // event throttling
        if (timerID) {
            clearTimeout(timerID); timerID = 0;
        }
        timerID = setTimeout(function() {
            clearTimeout(timerID); timerID = 0;

            callback(null);
        }, that._options.delay);
    }
}

/*
function Watch_dir(that,         // @arg this
                   watchRoorDir, // @arg String   - watch root dir
                   callback,     // @arg Function - callback(diff:Object):void
                   options) {    // @arg Object   - { ... }
                                 //      diff - Object: { path: { dir, size, mtime }, ... }
    var timerID = 0;
    var keepDirTrees = Watch_scanDir(watchRoorDir, options); // { dirs, files }

    for (var path in keepDirTrees.dirs) {
        if (that._options.verbose) {
            console.log(INFO + "  watch target: " + CLR + path + "/");
        }
        fs.watch(path, _watchdogCallback);
    }

    function _watchdogCallback() {
        if (timerID) {
            clearTimeout(timerID); timerID = 0;
        }

        // -> sleep(1000)
        // -> scanDir(watchRootDir)
        // -> get diff
        // -> callback(diff)
        // -> sleep...

        timerID = setTimeout(function() {
            var currentDirTrees = Watch_scanDir(watchRoorDir, options); // { dirs, files }
            var diff = _diff(currentDirTrees, keepDirTrees); // { path: { dir, size, mtime }, ... }

            keepDirTrees = currentDirTrees;

            clearTimeout(timerID); timerID = 0;

            callback(diff);
        }, that._options.delay);
    }

    function _diff(curt,   // @arg Object - current dir tree. { dirs, files }
                   last) { // @arg Object - last dir tree.    { dirs, files }
                           // @ret Object - diff dir tree.    { path: { dir, size, mtime }, ... }
        var result = {};

        for (var path in curt.files) {
            if ( !_match( path, curt.files[path], last.files[path] ) ) {
                result[path] = curt.files[path];
            }
        }
        return result;
    }

    function _match(path,
                    a,    // @arg Object - { dir, size, mtime }
                    b) {  // @arg Object - { dir, size, mtime }
        if (a && b) {
            if (a.dir === b.dir) {
                if (a.size === b.size) {
                    if (a.mtime === b.mtime) {
                        return true;
                    }
                }
            }
            if (that._options.verbose) {
                console.log(WARN + "  changed: " + CLR + path);
            }
        }
        return false;
    }
}
 */

/*
function Watch_scanDir(scanRootDir, // @arg String - scan root dir
                       options) {   // @arg Object - { ... }
                                    // @ret Object - { dirs: {}, files: {} }
                                    // @options.dirs  Object - { dir:Boolean, size:Intger, mtime:Integre }
                                    // @options.files Object - { dir:Boolean, size:Intger, mtime:Integre }
    var result = { dirs: {}, files: {} };
    var stat = fs.statSync(scanRootDir);
    var ignoreDir = options.ignoreDir || [];
    var found = false;

    if ( stat.isDirectory() ) {
        // found .watchignore ?
        if (ignoreDir.length) {
            found = ignoreDir.some(function(value) {
                        return _isFile(scanRootDir + value);
                    });
        }
        if (found) {
            // ignore dir
        } else {
            result.dirs[scanRootDir] = {
                dir:   true,
                size:  stat.size,
                mtime: +stat.mtime
            };
            _readDir(result, scanRootDir, options);
        }
    }
    return result;
}
 */

/*
function _readDir(result,    // @arg Object    - { dirs: {}, files: {} }
                  dir,       // @arg DirString
                  options) { // @arg Object    - { ... }
                             // @recursive
    var fileList = fs.readdirSync(dir);
    var ignoreDir = options.ignoreDir || [];
    var ignoreFileNamePostFix = options.ignoreFileNamePostFix || [];

    Sort_nat(fileList).forEach(function(fname) {
        var path = dir + fname;
        var stat = fs.statSync(path);
        var found = false;

        if ( stat.isFile() ) {
            if (ignoreFileNamePostFix.length) {
                found = ignoreFileNamePostFix.some(function(value) {
                            return path.lastIndexOf(value) === path.length - value.length;
                        });
            }
            if (found) {
                // found *.min.js
            } else {
                result.files[path] = { dir: false, size: stat.size, mtime: +stat.mtime };
            }
        } else if ( stat.isDirectory() ) {
            path += "/";
            // found .watchignore
            if (ignoreDir.length) {
                found = ignoreDir.some(function(value) {
                            return _isFile(path + value);
                        });
            }

            if (found) {
                // ignore dir
            } else {
                result.dirs[path] = { dir: true, size: stat.size, mtime: +stat.mtime };
                _readDir(result, path, options); // recursive call
            }
        }
    });
}
 */

function _isFile(path) { // @arg String
                         // @ret Boolean
    return fs.existsSync(path) && fs.statSync(path).isFile();
}

/*
function _isDir(path) { // @arg String
                        // @ret Boolean
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
}
 */

/*
// copy from Sort.js
function Sort_nat(source,       // @arg StringArray     - source. ["abc100", "abc1", "abc10"]
                  ignoreCase) { // @arg Boolean = false - true is case-insensitive
                                // @ret StringArray     - sorted array. ["abc1", "abc10", "abc100"]
                                // @desc nat sort
//{@dev
    _if(!Array.isArray(source), "Sort.nat(source)");
    _if(ignoreCase !== undefined &&
        typeof ignoreCase !== "boolean", "Sort.nat(,ignoreCase)");
//}@dev

    function toNumberArray(str) {
        return str.split(/(\d+)/).reduce(function(prev, next) {
                    if (next !== "") {
                        if (isNaN(next)) {
                            next.split("").forEach(function(v) {
                                prev.push( v.charCodeAt(0) );
                            });
                        } else {
                            prev.push(+next);
                        }
                    }
                    return prev;
                }, []);
    }

    var cache = {}; // { keyword: [number, ...], ... }

    return source.sort(function(a, b) {
        var aa, bb;

        if (a in cache) {
            aa = cache[a];
        } else {
            cache[a] = aa = toNumberArray( ignoreCase ? a.toLowerCase() : a );
        }
        if (b in cache) {
            bb = cache[b];
        } else {
            cache[b] = bb = toNumberArray( ignoreCase ? b.toLowerCase() : b );
        }
        var x = 0, y = 0, i = 0, iz = aa.length;

        for (; i < iz; ++i) {
            x = aa[i] || 0;
            y = bb[i] || 0;
            if (x !== y) {
                return x - y;
            }
        }
        return a.length - b.length;
    });
}
 */

// --- validate / assertions -------------------------------
//{@dev
//function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
//function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

//{@dev
function _isFunction(target) {
    return target !== undefined && (typeof target === "function");
}
function _isObject(target) {
    return target && (target.constructor === ({}).constructor);
}
function _if(booleanValue, errorMessageString) {
    if (booleanValue) {
        throw new Error(errorMessageString);
    }
}
//}@dev


})((this || 0).self || global);



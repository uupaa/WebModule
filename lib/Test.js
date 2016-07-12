// Test.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var Task = global["_TestTask_"];

// --- define / local variables ----------------------------
var STYLISH = global["navigator"] && /Chrome/.test(global["navigator"]["userAgent"] || "");

// console colors
var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";
var GHOST = "\uD83D\uDC7B";
var BEER  = "\uD83C\uDF7B";

// --- class / interfaces ----------------------------------
function Test(moduleName, // @arg String|StringArray - target modules.
              options) {  // @arg Object = {} - { disable, browser, worker, node, nw, el, button, both, ignoreError }
                          // @options.disable     Boolean = false - Disable all tests.
                          // @options.browser     Boolean = false - Enable the browser test.
                          // @options.worker      Boolean = false - Enable the webWorker test.
                          // @options.node        Boolean = false - Enable the node.js test.
                          // @options.nw          Boolean = false - Enable the NW.js test.
                          // @options.el          Boolean = false - Enable the Electron (render process) test.
                          // @options.button      Boolean = false - Show test buttons.
                          // @options.both        Boolean = false - Test the primary and secondary module.
                          // @options.ignoreError Boolean = false - ignore error
                          // @options.callback    Function = null - callback():void
                          // @options.errorback   Function = null - errorback(err:Error):void
    options = options || {};

    this._testCases   = [];
    this._secondary   = false; // using secondary module
    this._module      = Array.isArray(moduleName) ? moduleName : [moduleName];
    this._browser     = options["browser"]     || false;
    this._worker      = options["worker"]      || false;
    this._node        = options["node"]        || false;
    this._nw          = options["nw"]          || false;
    this._el          = options["el"]          || false;
    this._button      = options["button"]      || false;
    this._both        = options["both"]        || false;
    this._ignoreError = options["ignoreError"] || false;
    this._callback    = options["callback"]    || function() {};
    this._errorback   = options["errorback"]   || function() {};

    if (options["disable"]) {
        this._browser = false;
        this._worker  = false;
        this._node    = false;
        this._nw      = false;
        this._el      = false;
        this._button  = false;
        this._both    = false;
    }
}

Test["prototype"]["add"] = Test_add; // Test#add(cases:TestFunction|TestFunctionArray = null):this
Test["prototype"]["run"] = Test_run; // Test#run():TestFunctionArray

// --- implements ------------------------------------------
function Test_add(testCases) { // @arg TestFunction|TestFunctionArray = null - [fn, ...]
                               // @ret this
                               // @desc add test cases.
    if (testCases) {
        this._testCases = this._testCases.concat(testCases);
    }
    return this;
}

function Test_run(deprecated) { // @ret TestFunctionArray
    if (deprecated) { throw new Error("argument error"); }

    var that = this;
    var plan = "node_primary > browser_primary > worker_primary > nw_primary > el_primary";

    if (that._both) {
        if (IN_WORKER) {
            plan += " > 1000 > swap > node_secondary > browser_secondary";
        } else {
            plan += " > 1000 > swap > node_secondary > browser_secondary > worker_secondary";
        }
    }
    Task.run(plan, {
        node_primary: function(task)        { _nodeTestRunner(that, task); },
        browser_primary: function(task)     { _browserTestRunner(that, task); },
        worker_primary: function(task)      { _workerTestRunner(that, task); },
        nw_primary: function(task)          { _nwTestRunner(that, task); },
        el_primary: function(task)          { _elTestRunner(that, task); },
        swap: function(task) {
            _swap(that);
            task.pass();
        },
        node_secondary: function(task)      { _nodeTestRunner(that, task); },
        browser_secondary: function(task)   { _browserTestRunner(that, task); },
        worker_secondary: function(task)    { _workerTestRunner(that, task); },
//      nw_secondary: function(task)        { _nwTestRunner(that, task); },
//      el_secondary: function(task)        { _elTestRunner(that, task); },
    }, function taskFinished(err) {
        _undo(that);
//        if (err && global["console"]) {
//            if (err.stack) {
//                console.error(err.stack);
//            } else {
//                console.error(err.message);
//            }
//        }
        err ? that._errorback(err) : that._callback();
    });
    return this._testCases.slice();
}

function _testRunner(that,               // @arg this
                     finishedCallback) { // @arg Function
    var testCases = that._testCases.slice(); // clone
    var progress = { cur: 0, max: testCases.length };
    var task = new Task(testCases.length, finishedCallback, { "tick": _next });

    _next();

    function _next() {
        var testCase = testCases.shift();
        if (!testCase) { return; }

        var testCaseName = _getFunctionName(testCase);
        if (testCase.length === 0) {
            throw new Error("Function " + testCaseName + " has not argument.");
        }
        var test = {
            done: function(error) {
                if (IN_BROWSER || IN_NW || IN_EL) {
                    if (that._button) {
                        _addTestButton(that, testCase, error ? "red" : "green");
                    }
                    var green = ((++progress.cur / progress.max) * 255) | 0;
                    var bgcolor = "rgb(0, " + green + ", 0)";

                    document.body["style"]["backgroundColor"] = bgcolor;
                }
                if (error) {
                    task.miss();
                } else {
                    task.pass();
                }
            }
        };
        var pass = _getPassFunction(that, testCaseName + " pass");
        var miss = _getMissFunction(that, testCaseName + " miss");

        //  textCaseName(test, pass, miss) {
        //      test.done(pass());
        //      test.done(miss());
        //  }

        if (!that._ignoreError) {
            testCase(test, pass, miss); // execute testCase
        } else {
            try {
                testCase(test, pass, miss);
            } catch (o_O) { // [!] catch uncaught exception
                miss();
                if (IN_NODE) {
                    console.log(ERR + testCase + CLR);
                } else if (IN_BROWSER || IN_NW) {
                    global["Help"](testCase, testCaseName);
                }
                task.message(o_O.message + " in " + testCaseName + " function").miss();
            }
        }
    }
}

function _browserTestRunner(that, task) {
    if (that._browser) {
        if (IN_BROWSER) {
            if (document["readyState"] === "complete") { // already document loaded
                _onload(that, task);
            } else if (global.addEventListener) { // avoid [IE8] error
                global.addEventListener("load", function() { _onload(that, task); });
            } else if (global.attachEvent) {
                global.attachEvent("onload", function() { _onload(that, task); });
            }
            return;
        }
    }
    task.pass();
}

function _nwTestRunner(that, task) {
    if (that._nw) {
        if (IN_NW) {
            if (document["readyState"] === "complete") { // already document loaded
                _onload(that, task);
            } else {
                global.addEventListener("load", function() { _onload(that, task); });
            }
            return;
        }
    }
    task.pass();
}

function _elTestRunner(that, task) {
    if (that._el) {
        if (IN_EL) {
            if (document["readyState"] === "complete") { // already document loaded
                _onload(that, task);
            } else if (global.addEventListener) {
                global.addEventListener("load", function() { _onload(that, task); });
            }
            return;
        }
    }
    task.pass();
}

function _onload(that, task) {
    _testRunner(that, function finishedCallback(err) {
        _finishedLog(that, err);

        var n = that._secondary ? 2 : 1;

        document.title = (err ? GHOST : BEER).repeat(n) + document.title;

      //document.body["style"]["backgroundColor"] = err ? "red" : "lime";
        task.done(err);
    });
}

function _workerTestRunner(that, task) {
    if (that._worker) {
        if (IN_BROWSER) {
            _createWorker(that, task);
            return;
        } else if (IN_WORKER) {
            if (global.unitTest.setting.secondary) {
                _swap(that);
            }
            _testRunner(that, function finishedCallback(err) {
                _finishedLog(that, err);
                if (err) {
                    global.unitTest.message = err.message;
                }
                if (global.unitTest.setting.secondary) {
                    _undo(that);
                }
                task.done(err);
            });
            return;
        }
    }
    task.pass();

    function _createWorker(that, task) {
        var worker = new Worker("worker.js");

        worker.onmessage = function(event) {
            var message = event.data.message;

            if (message) {
                document.body.style.backgroundColor = "red"; // [!] RED screen
                console.error("worker.onmessage: " + message);
                debugger;
            }
            task.done(message ? new Error(message) : null);
        };
        worker.postMessage({
            message: "",
            setting: {
                secondary:  that._secondary,
                baseDir:    location.href.split("/").slice(0, -1).join("/") + "/"
            },
        });
    }
}

function _nodeTestRunner(that, task) {
    if (that._node) {
        if (IN_NODE) {
            _testRunner(that, function finishedCallback(err) {
                _finishedLog(that, err);
                task.done(err);
                if (err) {
                    process.exit(1); // failure ( need Travis-CI )
                }
            });
            return;
        }
    }
    task.pass();
}

function _swap(that) {
    if (that._both) {
        if (!that._secondary) {
            that._secondary = true;
            that._module.forEach(function(moduleName) {
                // swap primary <-> secondary module runtime
                //  [1] keep original runtime to `global.WebModule.moduleName$p$ = primaryModule`
                //  [2] overwrite module runtime
                global["WebModule"][moduleName + "$p$"] = global["WebModule"][moduleName];       // [1]
                global["WebModule"][moduleName]         = global["WebModule"][moduleName + "_"]; // [2]
                if (global["WebModule"]["PUBLISH"]) { // published?
                    global[moduleName]                  = global["WebModule"][moduleName + "_"]; // [2]
                }
            });
        }
    }
}

function _undo(that) {
    if (that._both) {
        if (that._secondary) {
            that._secondary = false;
            that._module.forEach(function(moduleName) {
                // swap secondary <-> primary module runtime
                //  [1] return to original runtime
                global["WebModule"][moduleName] = global["WebModule"][moduleName + "$p$"]; // [1]
                if (global["WebModule"]["PUBLISH"]) { // published?
                    global[moduleName]          = global["WebModule"][moduleName + "$p$"]; // [1]
                }
                delete global["WebModule"][moduleName + "$p$"];
            });
        }
    }
}

function _getConsoleStyle() {
    if (global["console"]) {
        return IN_NODE   ? "node"
             : IN_WORKER ? "worker"
             : IN_NW     ? "nw"
             : IN_EL     ? "el"
             : STYLISH   ? "color" : "browser";
    }
    return "";
}

function _getPassFunction(that, passMessage) { // @ret PassFunction
    var order = that._secondary ? "secondary" : "primary";

    if (typeof console.log !== "function") { // [IE9] console.log is not function.
        return function() { console.log(passMessage); };
    }

    switch ( _getConsoleStyle() ) {
    case "node":    return console.log.bind(console, INFO + "Node(" + order + "): " + CLR + passMessage);
    case "worker":  return console.log.bind(console,      "Worker(" + order + "): " + passMessage);
    case "color":   return console.log.bind(console,   "%cBrowser(" + order + "): " + passMessage + "%c ", "color:#0c0", "");
    case "browser": return console.log.bind(console,     "Browser(" + order + "): " + passMessage);
    case "nw":      return console.log.bind(console,          "nw(" + order + "): " + passMessage);
    case "el":      return console.log.bind(console,    "electron(" + order + "): " + passMessage);
    }
    return null;
}

function _getMissFunction(that, missMessage) { // @ret MissFunction
    var order = that._secondary ? "secondary" : "primary";

    switch ( _getConsoleStyle() ) {
    case "node":    return function() { console.error(ERR +"Node(" + order + "): " + CLR + missMessage);                     return new Error(); };
    case "worker":  return function() { console.error(   "Worker(" + order + "): " + missMessage);                           return new Error(); };
    case "color":   return function() { console.error("%cBrowser(" + order + "): " + missMessage + "%c ", "color:#red", ""); return new Error(); };
    case "browser": return function() { console.error(  "Browser(" + order + "): " + missMessage);                           return new Error(); };
    case "nw":      return function() { console.error(       "nw(" + order + "): " + missMessage);                           return new Error(); };
    case "el":      return function() { console.error( "electron(" + order + "): " + missMessage);                           return new Error(); };
    }
    return null;
}

function _finishedLog(that, err) {
    var n = that._secondary ? 2 : 1;

    if (err) {
        _getMissFunction(that, GHOST.repeat(n) + "  MISS.")();
    } else {
        _getPassFunction(that, BEER.repeat(n)  + "  PASS ALL.")();
    }
}

function _addTestButton(that,
                        testCase,      // @arg TestCaseFunction
                        buttonColor) { // @arg String - button color
    // add <input type="button" onclick="test()" value="test()" /> buttons
    var itemName = _getFunctionName(testCase);
    var safeName = itemName.replace(/\$/, "_"); // "concat$" -> "concat_"

    if (!document.querySelector("#" + safeName)) {
        var inputNode = document.createElement("input");
        var next = "{pass:function(){},miss:function(){},done:function(){}}";
        var pass = "function(){console.log('"   + itemName + " pass')}";
        var miss = "function(){console.error('" + itemName + " miss')}";
        var index = that._testCases.indexOf(testCase);

        inputNode.setAttribute("id", safeName);
        inputNode.setAttribute("type", "button");
        inputNode.setAttribute("style", "color:" + buttonColor);
        inputNode.setAttribute("value", itemName + "()");
        inputNode.setAttribute("onclick", "ModuleTest" + that._module[0] +
                "[" + index + "](" + next + ", " + pass + ", " + miss + ")");

        document.body.appendChild(inputNode);
    }
}

function _getFunctionName(fn) {
    return fn["name"] ||
          (fn + "").split(" ")[1].split("\x28")[0]; // IE
}

if (!String.prototype.repeat) {
    String.prototype.repeat = function(n) {
        n = n | 0;
        return (this.length && n > 0) ? new Array(n + 1).join(this) : "";
    };
}

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Test;
}
global["Test"] = Test;

})(GLOBAL);


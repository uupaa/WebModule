// Test.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var Task = global["Task"];

// --- define / local variables ----------------------------
var _isNodeOrNodeWebKit = !!global.global;
var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

var _stylish = _isConsoleStyleReady();

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";

// --- class / interfaces ----------------------------------
function Test(moduleName, // @arg String|StringArray - target modules.
              param) {    // @arg Object = {} - { disable, browser, worker, node, nw, button, both, ignoreError }
                          // @param.disable Boolean = false - Disable all tests.
                          // @param.browser Boolean = false - Enable the browser test.
                          // @param.worker  Boolean = false - Enable the webWorker test.
                          // @param.node    Boolean = false - Enable the node.js test.
                          // @param.nw      Boolean = false - Enable the node-webkit test.
                          // @param.button  Boolean = false - Show test buttons.
                          // @param.both    Boolean = false - Test the primary and secondary module.
                          // @param.ignoreError Boolean = false - ignore error
    param = param || {};

    this._items   = []; // test items.
    this._swaped  = false;
    this._module  = Array.isArray(moduleName) ? moduleName : [moduleName];

    this._browser = param["browser"] || false;
    this._worker  = param["worker"]  || false;
    this._node    = param["node"]    || false;
    this._nw      = param["nw"]      || false;
    this._button  = param["button"]  || false;
    this._both    = param["both"]    || false;
    this._ignoreError = param["ignoreError"] || false;

    if (param["disable"]) {
        this._browser = false;
        this._worker  = false;
        this._node    = false;
        this._nw      = false;
        this._button  = false;
        this._both    = false;
    }
}

Test["prototype"]["add"]   = Test_add;   // Test#add(items:TestItemFunctionArray):this
Test["prototype"]["run"]   = Test_run;   // Test#run(callback:Function = null):this
Test["prototype"]["clone"] = Test_clone; // Test#clone():TestItemFunctionArray

Test["toHex"]      = Test_toHex;         // Test#toHex(a:TypedArray|Array, fixedDigits:Integer = 0):NumberStringArray
Test["likeArray"]  = Test_likeArray;     // Test#likeArray(a:TypedArray|Array, b:TypedArray|Array, fixedDigits:Integer = 0):Boolean
Test["likeObject"] = Test_likeObject;    // Test#likeObject(a:Object, b:Object):Boolean

// --- implements ------------------------------------------
function Test_add(items) { // @arg TestItemFunctionArray - test items. [fn, ...]
                           // @desc add test item(s).
    this._items = this._items.concat(items);
    return this;
}

function Test_run(callback) { // @arg Function = null - callback(err:Error)
                              // @ret this
    var that = this;
    var plan = "node_1st > browser_1st > worker_1st > nw_1st";

    if (that._both) {
        if (_runOnWorker) {
            plan += " > 1000 > swap > node_2nd > browser_2nd"; // remove worker_2nd
        } else {
            plan += " > 1000 > swap > node_2nd > browser_2nd > worker_2nd";
        }
    }

    Task.run(plan, {
        node_1st: function(task) {      // Node(primary)
            _nodeTestRunner(that, task);
        },
        browser_1st: function(task) {   // Browser(primary)
            _browserTestRunner(that, task);
        },
        worker_1st: function(task) {    // Worker(primary)
            _workerTestRunner(that, task);
        },
        nw_1st: function(task) {        // node-webkit(primary)
            _nwTestRunner(that, task);
        },
        swap: function(task) {
            _swap(that);
            task.pass();
        },
        node_2nd: function(task) {      // Node(secondary)
            _nodeTestRunner(that, task);
        },
        browser_2nd: function(task) {   // Browser(secondary)
            _browserTestRunner(that, task);
        },
        worker_2nd: function(task) {    // Worker(secondary)
            _workerTestRunner(that, task);
        },
//      nw_2st: function(task) {        // node-webkit(secondary)
//          _nwTestRunner(that, task);
//      },
    }, function(err) {
        _undo(that);
        if (callback) {
            callback(err);
        } else if (err) {
            throw err;
        }
    });
    return this;
}

function Test_clone() { // @ret TestItemFunctionArray
    return this._items.slice();
}

function _browserTestRunner(that, task) {
    if (that._browser) {
        if (_runOnBrowser) {
            if (document["readyState"] === "complete") { // already document loaded
                _onload();
            } else {
                global.addEventListener("load", _onload);
            }
            return;
        }
    }
    task.pass();

    function _onload() {
        _testRunner(that, function(err) {
            _finishedLog(that, err);
            document.body["style"]["backgroundColor"] = err ? "red" : "lime";
            if (that._button) {
                _addTestButtons(that, that._items);
            }
            task.done(err);
        });
    }
}

function _workerTestRunner(that, task) {
    if (that._worker) {
        if (_runOnWorker) {
            var isSecondaryModule = false;

            if (global["TEST_DATA"]) {
                isSecondaryModule = global["TEST_DATA"]["SECONDARY"] || false; // from WebWorker
                if (isSecondaryModule) {
                    _swap(that);
                }
            }
            _testRunner(that, function(err) {
                if ("console" in global) { // WebWorkerConsole
                    _finishedLog(that, err);
                }
                if (err) {
                    global["TEST_ERROR_MESSAGE"] = err.message; // [!] set WorkerGlobal.TEST_ERROR_MESSAGE
                }
                if (isSecondaryModule) {
                    _undo(that);
                }
                task.done(err);
            });
            return;
        } else if (_runOnBrowser) {
            _createWorker(that, task);
            return;
        }
    }
    task.pass();
}

function _nodeTestRunner(that, task) {
    if (that._node) {
        if (_runOnNode) {
            _testRunner(that, function(err) {
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

function _nwTestRunner(that, task) {
    if (that._nw) {
        if (_runOnNodeWebKit) {
            if (document["readyState"] === "complete") { // already document loaded
                _onload();
            } else {
                global.addEventListener("load", _onload);
            }
            return;
        }
    }
    task.pass();

    function _onload() {
        _testRunner(that, function(err) {
            _finishedLog(that, err);
            document.body["style"]["backgroundColor"] = err ? "red" : "lime";
            if (that._button) {
                _addTestButtons(that, that._items);
            }
            task.done(err);
        });
    }
}

function _testRunner(that,               // @arg this
                     finishedCallback) { // @arg Function = null
    var items = that._items.slice(); // clone
    var task  = new Task(items.length, _callback, { "tick": _next });

    _next();

    function _next() {
        var fn = items.shift();

        if (fn) {
            var testFunctionName = fn["name"] || (fn + "").split(" ")[1].split("\x28")[0];
            var testFunctionArgumentLength = fn.length;

            if (testFunctionArgumentLength === 0) {
                if ("Help" in global) {
                    global["Help"](fn, testFunctionName);
                }
                throw new Error("Function " + testFunctionName + " has no argument.");
            }
            var flow = _getFlowFunctions(that, testFunctionName + " pass", testFunctionName + " miss");

                if (_runOnNode) {
                    if (!that._ignoreError) {
                        fn(task, flow.pass, flow.miss);
                    } else {
                        try {

                            //  textXxx(test, pass, miss) {
                            //      if (true) {
                            //          test.done(pass());
                            //      } else {
                            //          test.done(miss());
                            //      }
                            //  }

                            fn(task, flow.pass, flow.miss);
                        } catch (o_O) { // [!] catch uncaught exception
                            flow.miss();
                            console.log(ERR + fn + CLR);
                            task.message(ERR + o_O.message + CLR + " in " + testFunctionName + " function").miss();
    //                      throw o_O;
                        }
                    }
                } else if (_runOnBrowser || _runOnNodeWebKit) {
                    if (!that._ignoreError) {
                        fn(task, flow.pass, flow.miss);
                    } else {
                        try {
                            fn(task, flow.pass, flow.miss);
                        } catch (o_O) {
                            flow.miss();
                            global["Help"](fn, testFunctionName);
                            task.message(o_O.message + " in " + testFunctionName + " function").miss();
                        }
                    }
                } else {
                    if (!that._ignoreError) {
                        fn(task, flow.pass, flow.miss);
                    } else {
                        fn(task, flow.pass, flow.miss);
                    }
                }
        }
    }
    function _callback(err) {
        if (finishedCallback) {
            finishedCallback(err);
        }
    }
}

function _createWorker(that, task) {
  //var src = _createObjectURL("#worker"); // "blob:null/...."
    var src = "worker.js";

    if (src) {
        var worker = new Worker(src);

        worker.onmessage = function(event) {
//          if ( /^blob:/.test(src) ) { // src is objectURL?
//              (global["URL"] || global["webkitURL"]).revokeObjectURL(src); // [!] GC
//          }
            var testErrorMessage = event.data.TEST_ERROR_MESSAGE;

            if (testErrorMessage) {
                document.body.style.backgroundColor = "red"; // [!] RED screen
                console.error("worker.onmessage: " + testErrorMessage);
                debugger;
            }
            task.done(testErrorMessage ? new Error(testErrorMessage) : null);
        };

        var baseDir = location.href.split("/").slice(0, -1).join("/") + "/";

        // self.TEST_DATA = event.data;
        worker.postMessage({
            "SECONDARY":    that._swaped,
            "BASE_DIR":     baseDir
        });
    } else {
        task.pass();
    }
}

/*
function _createObjectURL(nodeSelector) {
    var node = document.querySelector(nodeSelector);

    if (node && "Blob" in global) {
        // create Worker from inline <script id="worker" type="javascript/worker"> content
        var blob = new Blob([ node.textContent ], { type: "application/javascript" });

        return (global["URL"] || global["webkitURL"]).createObjectURL(blob);
    }
    return "";
}
 */

function _swap(that) {
    if (that._both) {
        if (!that._swaped) {
            that._swaped = true;
            that._module.forEach(function(moduleName) {
                global["$$$" + moduleName + "$$$"] = global[moduleName];
                global[moduleName] = global[moduleName + "_"]; // swap primary <-> secondary module
            });
        }
    }
}

function _undo(that) {
    if (that._both) {
        if (that._swaped) {
            that._swaped = false;
            that._module.forEach(function(moduleName) {
                global[moduleName] = global["$$$" + moduleName + "$$$"];
                delete global["$$$" + moduleName + "$$$"];
            });
        }
    }
}

function _isConsoleStyleReady() {
    if (global["navigator"]) {
        if ( /Chrome/.test( global["navigator"]["userAgent"] || "" ) ) {
            return true;
        }
    }
    return false;
}

function _getFlowFunctions(that,
                           passMessage,   // @arg String
                           missMessage) { // @arg String
    var order = that._swaped ? "secondary"
                             : "primary";
    var style = "";

    if (global["console"]) {
        style = _runOnNode   ? "node"
              : _runOnWorker ? "worker"
              : _runOnNodeWebKit ? "nw"
              : _stylish     ? "color"
                             : "browser";
    }

    // function testXxx(test, pass, miss) { ... }
    var pass = null;
    var miss = null;

    switch (style) {
    case "node":    pass = console.log.bind(console, INFO + "Node(" + order + "): " + CLR + passMessage); break;
    case "worker":  pass = console.log.bind(console,      "Worker(" + order + "): " + passMessage); break;
    case "color":   pass = console.log.bind(console,   "%cBrowser(" + order + "): " + passMessage + "%c ", "color:#0c0", ""); break;
    case "browser": pass = console.log.bind(console,     "Browser(" + order + "): " + passMessage);
    case "nw":      pass = console.log.bind(console, "node-webkit(" + order + "): " + passMessage);
    }
    switch (style) {
    case "node":    miss = function() { console.error(ERR +"Node(" + order + "): " + CLR + missMessage);                     return new Error(); }; break;
    case "worker":  miss = function() { console.error(   "Worker(" + order + "): " + missMessage);                           return new Error(); }; break;
    case "color":   miss = function() { console.error("%cBrowser(" + order + "): " + missMessage + "%c ", "color:#red", ""); return new Error(); }; break;
    case "browser": miss = function() { console.error(  "Browser(" + order + "): " + missMessage);                           return new Error(); };
    case "nw":      miss = function() { console.error("node-webkit(" + order + "): " + missMessage);                           return new Error(); };
    }
    return { pass: pass, miss: miss };
}

function _finishedLog(that, err) {
    var flow = _getFlowFunctions(that, "ALL PASSED.", "SOME MISSED.");

    if (err) {
        flow.miss();
    } else {
        flow.pass();
    }
}

function _addTestButtons(that, items) { // @arg TestItemFunctionArray
    // add <input type="button" onclick="test()" value="test()" /> buttons
    items.forEach(function(fn, index) {
        var itemName = fn["name"] || (fn + "").split(" ")[1].split("\x28")[0];

        if (!document.querySelector("#" + itemName)) {
            var inputNode = document.createElement("input");
            var next = "{pass:function(){},miss:function(){},done:function(){}}";
            var pass = "function(){console.log('"   + itemName + " pass')}";
            var miss = "function(){console.error('" + itemName + " miss')}";

            inputNode.setAttribute("id", itemName);
            inputNode.setAttribute("type", "button");
            inputNode.setAttribute("value", itemName + "()");
            inputNode.setAttribute("onclick", "ModuleTest" + that._module[0] +
                    "[" + index + "](" + next + ", " + pass + ", " + miss + ")");

            document.body.appendChild(inputNode);
        }
    });
}

function Test_toHex(a,             // @arg TypedArray|Array
                    fixedDigits) { // @arg Integer = 0 - floatingNumber.toFixed(fixedDigits)
                                   // @arg NumberStringArray - ["00", "01"]                  (Uint8Array)
                                   //                          ["0000", "0001", ...]         (Uint16Array)
                                   //                          ["00000000", "00000001", ...] (Uint32Array)
                                   //                          ["12.3", "0.1", ...]          (Float64Array)
    var fix    = fixedDigits || 0;
    var type   = Array.isArray(a) ? "Array" : Object.prototype.toString.call(a);
    var result = [], i = 0, iz = a.length;
    var bytes  = /8/.test(type) ? 2 : /32/.test(type) ? 8 : 4;

    if (/float/.test(type)) {
        for (; i < iz; ++i) {
            result.push( (0x100000000 + a[i]).toString(16).slice(-bytes) );
        }
    } else {
        for (; i < iz; ++i) {
            result.push( fix ? a[i].toFixed(fix) : a[i] );
        }
    }
    return result;
}

function Test_likeArray(a,             // @arg TypedArray|Array
                        b,             // @arg TypedArray|Array
                        fixedDigits) { // @arg Integer = 0 - floatingNumber.toFixed(fixedDigits)
                                       // @ret Boolean
    fixedDigits = fixedDigits || 0;
    if (a.length !== b.length) {
        return false;
    }
    for (var i = 0, iz = a.length; i < iz; ++i) {
        if (fixedDigits) {
            if ( a[i].toFixed(fixedDigits) !== b[i].toFixed(fixedDigits) ) {
                return false;
            }
        } else {
            if ( a[i] !== b[i] ) {
                return false;
            }
        }
    }
    return true;
}

function Test_likeObject(a,   // @arg Object
                         b) { // @arg Object
    return JSON.stringify(a) === JSON.stringify(b);
}

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Test;
}
global["Test"] = Test;

})((this || 0).self || global);


(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var TestTask = global["TestTask"];

// --- define / local variables ----------------------------
var _runOnNode = "process" in global;
var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

var _stylish = _isConsoleStyleReady();
var _testSecondaryModule = !!(global["MESSAGE"] || 0)["SECONDARY"]; // from WebWorker

var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

// --- class / interfaces ----------------------------------
function Test(moduleName, // @arg String - target module.
              param) {    // @arg Object = {} - { disable, browser, worker, node, button, both }
                          // @param.disable Boolean = false - Disable all tests.
                          // @param.browser Boolean = false - Enable the browser test.
                          // @param.worker  Boolean = false - Enable the webWorker test.
                          // @param.node    Boolean = false - Enable the node.js test.
                          // @param.button  Boolean = false - Show test buttons.
                          // @param.both    Boolean = false - Test the primary and secondary module.
    param = param || {};

    this._items   = []; // test items.
    this._swaped  = false;
    this._module  = moduleName;

    this._browser = param["browser"] || false;
    this._worker  = param["worker"]  || false;
    this._node    = param["node"]    || false;
    this._button  = param["button"]  || false;
    this._both    = param["both"]    || false;

    if (param["disable"]) {
        this._browser = false;
        this._worker  = false;
        this._node    = false;
        this._button  = false;
        this._both    = false;
    }
}

Test["prototype"]["add"]   = Test_add;   // Test#add(items:TestItemFunctionArray):this
Test["prototype"]["run"]   = Test_run;   // Test#run(callback:Function = null):this
Test["prototype"]["clone"] = Test_clone; // Test#clone():TestItemFunctionArray

// --- implements ------------------------------------------
function Test_add(items) { // @arg TestItemFunctionArray - test items. [fn, ...]
                           // @desc add test item(s).
    this._items = this._items.concat(items);
    return this;
}

function Test_run(callback) { // @arg Function = null - callback(err:Error)
                              // @ret this
    var that = this;
    var route = "node_1st > browser_1st > worker_1st";

    if (that._both) {
        if (_runOnWorker) {
            route += " > 1000 > swap > node_2nd > browser_2nd";
        } else {
            route += " > 1000 > swap > node_2nd > browser_2nd > worker_2nd";
        }
    }

    TestTask.run(route, {
        node_1st:    function(task) {    _nodeTestRunner(that, task); },
        browser_1st: function(task) { _browserTestRunner(that, task); },
        worker_1st:  function(task) {  _workerTestRunner(that, task); },
        swap:        function(task) {
            _swap(that);
            task.pass();
        },
        node_2nd:    function(task) {    _nodeTestRunner(that, task); },
        browser_2nd: function(task) { _browserTestRunner(that, task); },
        worker_2nd:  function(task) {  _workerTestRunner(that, task); }
    }, function(err) {
        _undo(that);
        if (callback) {
            callback(err);
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
            if (_testSecondaryModule) {
                _swap(that);
            }
            _testRunner(that, function(err) {
                if ("console" in global) { // WebWorker console impl?
                    _finishedLog(that, err);
                }
                if (err) {
                    global["errorMessage"] = err.message; // [!] set WorkerGlobal.errorMessage
                }
                if (_testSecondaryModule) {
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

function _testRunner(that,               // @arg this
                     finishedCallback) { // @arg Function = null
    var items = that._items.slice(); // clone
    var task  = new TestTask(items.length, _callback, { "tick": _next });

    _next();

    function _next() {
        var fn = items.shift();

        if (fn) {
            var itemName = fn["name"] || (fn + "").split(" ")[1].split("\x28")[0];
            var length = fn.length;

            if (length === 0) {
                if ("Help" in global) {
                    global["Help"](fn, itemName);
                }
                throw new Error("Function " + itemName + " has no argument.");
            }
            var flow = _flow(_order(that), itemName + " pass", itemName + " miss");

                if (_runOnNode) {
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
                        task.message("Catch " + o_O.message + " in " + itemName).miss();
                        throw o_O;
                    }
                } else {
                    fn(task, flow.pass, flow.miss);
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
    var src = _createObjectURL("#worker"); // "blob:null/...."

    if (src) {
        var worker = new Worker(src);

        worker.onmessage = function(event) {
            if ( /^blob:/.test(src) ) { // src is objectURL?
                (global["URL"] || global["webkitURL"]).revokeObjectURL(src); // [!] GC
            }
            var errorMessage = event.data.error;

            if (errorMessage) {
                document.body.style.backgroundColor = "red"; // [!] RED screen
            }
            task.done(errorMessage ? new Error(errorMessage) : null);
        };

        var baseDir = location.href.split("/").slice(0, -1).join("/") + "/";

        worker.postMessage({
            "WORKER_ID":    1,
            "REQUEST_ID":   1,
            "INIT":         true,
            "ORIGIN":       location.href,
            "SCRIPT":       [],
            "BASE_DIR":     baseDir,
            "SECONDARY":    that._swaped
        });
    } else {
        task.pass();
    }
}

function _createObjectURL(nodeSelector) {
    var node = document.querySelector(nodeSelector);

    if (node && "Blob" in global) {
        // create Worker from inline <script id="worker" type="javascript/worker"> content
        var blob = new Blob([ node.textContent ], { type: "application/javascript" });

        return (global["URL"] || global["webkitURL"]).createObjectURL(blob);
    }
    return "";
}

function _swap(that) {
    if (that._both) {
        var moduleName = that._module;

        if (!that._swaped) {
            that._swaped = true;
            global["$$$" + moduleName + "$$$"] = global[moduleName];
            global[moduleName] = global[moduleName + "_"]; // swap primary <-> secondary module
        }
    }
}

function _undo(that) {
    if (that._both) {
        var moduleName = that._module;

        if (that._swaped) {
            that._swaped = false;
            global[moduleName] = global["$$$" + moduleName + "$$$"];
            delete global["$$$" + moduleName + "$$$"];
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

function _order(that) {
    return that._swaped ? "secondary" : "primary";
}

function _flow(order,       // @arg String - "primary" or "secondary"
               passMessage, // @arg String
               missMessage, // @arg String
               style) {     // @arg String = "" - "node" or "worker" or "color " or "browser"
    if (global["console"]) {
        style = _runOnNode   ? "node"
              : _runOnWorker ? "worker"
              : _stylish     ? "color"
                             : "browser";
    }

    var pass = null;
    var miss = null;

    switch (style) {
    case "node":    pass = console.log.bind(console, CONSOLE_COLOR.GREEN +
                                                            "Node(" + order + "): " + CONSOLE_COLOR.CLEAR + passMessage); break;
    case "worker":  pass = console.log.bind(console,      "Worker(" + order + "): " + passMessage); break;
    case "color":   pass = console.log.bind(console,   "%cBrowser(" + order + "): " + passMessage + "%c ", "color:#0c0", ""); break;
    case "browser": pass = console.log.bind(console,     "Browser(" + order + "): " + passMessage);
    }

    switch (style) {
    case "node":    miss = console.error.bind(console, CONSOLE_COLOR.RED +
                                                            "Node(" + order + "): " + CONSOLE_COLOR.CLEAR + missMessage); break;
    case "worker":  miss = console.error.bind(console,    "Worker(" + order + "): " + missMessage); break;
    case "color":   miss = console.error.bind(console, "%cBrowser(" + order + "): " + missMessage + "%c ", "color:#red", ""); break;
    case "browser": miss = console.error.bind(console,   "Browser(" + order + "): " + missMessage);
    }
    return {
        pass: pass,
        miss: function() {
            miss.apply(console, [].slice.call(arguments, 0, arguments.length));
            return new Error();
        }
    };
}

function _finishedLog(that, err) {
    var flow = _flow(_order(that), "ALL PASSED.", "SOME MISSED.");

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
            inputNode.setAttribute("onclick", "ModuleTest" + that._module +
                    "[" + index + "](" + next + ", " + pass + ", " + miss + ")");

            document.body.appendChild(inputNode);
        }
    });
}

// --- exports ---------------------------------------------
if ("process" in global) {
    module["exports"] = Test;
}
global["Test"] = Test;

})((this || 0).self || global);


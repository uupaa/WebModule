(function(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _isNodeOrNodeWebKit = !!global.global;
//var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
//var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
//var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
//var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

// --- class / interfaces ----------------------------------
function REPOSITORY_NAME(value) { // @arg String = "" - comment
//{@dev
  //$args(REPOSITORY_NAME, arguments);
  //$valid($type(value, "String|omit"), REPOSITORY_NAME, "value");
//}@dev

    this._value = value || "";
}

//{@dev
REPOSITORY_NAME["repository"] = "https://github.com/GITHUB_USER_NAME/REPOSITORY_NAME.js"; // GitHub repository URL. http://git.io/Help
//}@dev

REPOSITORY_NAME["prototype"] = Object.create(REPOSITORY_NAME, {
    "constructor":  { "value": REPOSITORY_NAME          },  // new REPOSITORY_NAME(value:String = ""):REPOSITORY_NAME
    // property accessor
    "value": {                                              // REPOSITORY_NAME#value:String
        "set": function(v) { this._value = v; },
        "get": function()  { return this._value; }
    },
    // methods
    "concat":       { "value": REPOSITORY_NAME_concat   },  // REPOSITORY_NAME#concat(a:String):String
    "concat$":      { "value": REPOSITORY_NAME_concat$  },  // REPOSITORY_NAME#concat$(a:String):this
});

// This example is the ES6::Class extend syntax, were simulated in ES5::Object.create.
// class SubClass extends REPOSITORY_NAME { ... }
/*
function SubClass() {
    REPOSITORY_NAME.apply(this, arguments);
}
SubClass["prototype"] = Object.create(REPOSITORY_NAME.prototype, {
    "constructor":  { "value": SubClass },
    "concat":       { "value": SubClass_concat },
    "concat$":      { "value": SubClass_concat$ },
});
 */

// --- implements ------------------------------------------
function REPOSITORY_NAME_concat(a) { // @arg String
                                     // @ret String
    return this._value + a;
}

function REPOSITORY_NAME_concat$(a) { // @arg String
                                      // @ret this
    this._value += a;
    return this;
}

// --- validate / assertions -------------------------------
//{@dev
//function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
//function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = REPOSITORY_NAME;
}
global["REPOSITORY_NAME" in global ? "REPOSITORY_NAME_" : "REPOSITORY_NAME"] = REPOSITORY_NAME; // switch module. http://git.io/Minify

})(WEBMODULE_IDIOM); // WebModule idiom. http://git.io/WebModule


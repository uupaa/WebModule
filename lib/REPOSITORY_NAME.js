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
function REPOSITORY_NAME(value) { // @arg Number|Integer = 0 comment
//{@dev
  //$args(REPOSITORY_NAME, arguments);
  //$valid($type(value, "Number|Integer|omit"), REPOSITORY_NAME, "value");
//}@dev

    this._value = value || 0;
}

//{@dev
REPOSITORY_NAME["repository"] = "https://github.com/GITHUB_USER_NAME/REPOSITORY_NAME.js"; // GitHub repository URL. http://git.io/Help
//}@dev

REPOSITORY_NAME["prototype"] = {
    "constructor":  REPOSITORY_NAME,           // new REPOSITORY_NAME(value:Number|Integer):REPOSITORY_NAME
    "value":        REPOSITORY_NAME_value,     // REPOSITORY_NAME#value():Number|Integer
    "isNumber":     REPOSITORY_NAME_isNumber,  // REPOSITORY_NAME#isNumber():Boolean
    "isInteger":    REPOSITORY_NAME_isInteger  // REPOSITORY_NAME#isInteger():Boolean
};

/*
class Xyz extends REPOSITORY_NAME { ... }

Xyz["prototype"] = Object.create(REPOSITORY_NAME.prototype, {
    "constructor":  { "value": Xyz },
    "value":        { "value": Xyz_value },
    "isNumber":     { "value": Xyz_isNumber },
    "isInteger":    { "value": Xyz_isInteger },
});
 */

// --- implements ------------------------------------------
function REPOSITORY_NAME_value() { // @ret Number|Integer comment
    return this._value;
}

function REPOSITORY_NAME_isNumber() { // @ret Boolean comment
    return typeof this._value === "number";
}

function REPOSITORY_NAME_isInteger() { // @ret Boolean comment
    return typeof this._value === "number" &&
           Math.ceil(this._value) === this._value;
}

// --- validate / assertions -------------------------------
//{@dev
function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
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


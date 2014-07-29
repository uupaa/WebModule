(function(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

// --- class / interfaces ----------------------------------
function Zzz(value) { // @arg Number|Integer = 0 comment
//{@dev
  //$args(Zzz, arguments);
  //$valid($type(value, "Number|Integer|omit"), Zzz, "value");
//}@dev

    this._value = value || 0;
}

//{@dev
Zzz["repository"] = "https://github.com/uupaa/Zzz.js"; // GitHub repository URL. http://git.io/Help
//}@dev

Zzz["prototype"]["value"]     = Zzz_value;     // Zzz#value():Number|Integer = 0
Zzz["prototype"]["isNumber"]  = Zzz_isNumber;  // Zzz#isNumber():Boolean
Zzz["prototype"]["isInteger"] = Zzz_isInteger; // Zzz#isInteger():Boolean
/* or
Zzz["prototype"] = {
    "constructor":  Zzz,           // new Zzz(value:Number|Integer):Zzz
    "value":        Zzz_value,     // Zzz#value():Number/Integer
    "isNumber":     Zzz_isNumber,  // Zzz#isNumber():Boolean
    "isInteger":    Zzz_isInteger  // Zzz#isInteger():Boolean
};
 */

// --- implements ------------------------------------------
function Zzz_value() { // @ret Number|Integer comment
    return this._value;
}

function Zzz_isNumber() { // @ret Boolean comment
    return typeof this._value === "number";
}

function Zzz_isInteger() { // @ret Boolean comment
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
if ("process" in global) {
    module["exports"] = Zzz;
}
global["Zzz" in global ? "Zzz_" : "Zzz"] = Zzz; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule


(function(global) {
"use strict";

// --- dependency module -----------------------------------
//{@dev --- This code block will be removed in release build.( http://git.io/Minify )
var Valid = global["Valid"] || require("uupaa.valid.js"); // http://git.io/Valid
//}@dev

// --- local variable --------------------------------------
var _inNode = "process" in global;
var _inWorker = "WorkerLocation" in global;
var _inBrowser = "document" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function Zzz(value) { // @arg Number|Integer # the value.
//{@dev
    Valid.args(Zzz, arguments); // http://git.io/Valid
//}@dev

    this._value = value;
}

Zzz["repository"] = "https://github.com/uupaa/Zzz.js"; // GitHub repository URL. ( http://git.io/Help )

Zzz["prototype"]["value"]     = Zzz_value;     // Zzz#value():Number|Integer
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

// --- implement -------------------------------------------
function Zzz_value() { // @ret Number|Integer # get value.
    return this._value;
}

function Zzz_isNumber() { // @ret Boolean # valie is Number
    return typeof this._value === "number";
}

function Zzz_isInteger() { // @ret Boolean # valie is Integer
    return typeof this._value === "number" &&
           Math.ceil(this._value) === this._value;
}

//{@assert
function _if(value, fn, hint) {
    if (value) {
        throw new Error(fn.name + " " + hint);
    }
}
//}@assert
// --- export ----------------------------------------------
if (_inNode) {
    module["exports"] = Zzz;
}
if (global["Zzz"]) {
    global["Zzz_"] = Zzz; // secondary module ( http://git.io/Minify )
} else {
    global["Zzz"]  = Zzz;
}

})((this || 0).self || global); // WebModule idiom ( http://git.io/WebModule )


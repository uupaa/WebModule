(function(global) {
"use strict";

// --- dependency module -----------------------------------
//{@dev
//  This code block will be removed in `$ npm run build-release`. http://git.io/Minify
var Valid = global["Valid"] || require("uupaa.valid.js"); // http://git.io/Valid
//}@dev

// --- local variable --------------------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function Zzz(value) { // @arg Number|Integer = 0 comment
//{@dev
  //Valid(Valid.type(value, "Number|Integer|omit"), Zzz, "value");
    Valid.args(Zzz, arguments);
//}@dev

    this._value = value || 0;
}

Zzz["repository"] = "https://github.com/uupaa/Zzz.js"; // GitHub repository URL. http://git.io/Help

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

// --- implement -------------------------------------------
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

// --- export ----------------------------------------------
if ("process" in global) {
    module["exports"] = Zzz;
}
global["Zzz" in global ? "Zzz_" : "Zzz"] = Zzz; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule


// @name: Zzz.js
// @require: Valid.js
// @cutoff: @assert @node

(function(global) {
//"use strict";

// --- variable --------------------------------------------
//{@assert
var Valid = global["Valid"] || require("uupaa.valid.js");
//}@assert

var _inNode = "process" in global;
var _inWorker = "WorkerLocation" in global;
var _inBrowser = "document" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function Zzz(value) { // @arg Number/Integer: the value.
                      // @help: Zzz
//{@assert
    _if(!Valid.type(value, "Number/Integer"), Zzz, "value");
//}@assert

    this._value = value;
}

Zzz["repository"] = "https://github.com/uupaa/Zzz.js";

Zzz["prototype"]["value"]     = Zzz_value;     // Zzz#value():Number/Integer
Zzz["prototype"]["isNumber"]  = Zzz_isNumber;  // Zzz#isNumber():Boolean
Zzz["prototype"]["isInteger"] = Zzz_isInteger; // Zzz#isInteger():Boolean
/* or
Zzz["prototype"] = {
    "constructor":  Zzz,           // new Zzz(value:Number/Integer):Zzz
    "value":        Zzz_value,     // Zzz#value():Number/Integer
    "isNumber":     Zzz_isNumber,  // Zzz#isNumber():Boolean
    "isInteger":    Zzz_isInteger  // Zzz#isInteger():Boolean
};
 */

// --- implement -------------------------------------------
function Zzz_value() { // @ret Number/Integer: get value.
                       // @help: Zzz#value
    return this._value;
}

function Zzz_isNumber() { // @ret Boolean: valie is Number
                          // @help: Zzz#isNumber
    return typeof this._value === "number";
}

function Zzz_isInteger() { // @ret Boolean: valie is Integer
                           // @help: Zzz#isInteger
    return typeof this._value === "number" &&
           Math.ceil(this._value) === this._value;
}

//{@assert
function _if(value, fn, hint) {
    if (value) {
        var msg = fn.name + " " + hint;

        console.error(Valid.stack(msg));
        if (global["Help"]) {
            global["Help"](fn, hint);
        }
        throw new Error(msg);
    }
}
//}@assert

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = Zzz;
}
//}@node
if (global["Zzz"]) {
    global["Zzz_"] = Zzz; // already exsists
} else {
    global["Zzz"]  = Zzz;
}

})((this || 0).self || global);


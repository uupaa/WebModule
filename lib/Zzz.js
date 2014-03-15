// @name: Zzz.js
// @require: Valid.js

(function(global) {
"use strict";

// --- variable --------------------------------------------
//{@assert
var Valid = global["Valid"] || require("uupaa.valid.js");
//}@assert

var _inNode = "process" in global;
var _inWorker = "WorkerLocation" in global;
var _inBrowser = "self" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function Zzz() { // @help: Zzz
}
Zzz["name"] = "Zzz";
Zzz["repository"] = "https://github.com/uupaa/Zzz.js";

// --- implement -------------------------------------------

//{@assert
function _if(value, msg) {
    if (value) {
        console.error(Valid.stack(msg));
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


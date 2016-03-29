// Help.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var Reflection = global["Reflection"];
var Console    = global["Console"];

// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
function Help(target,      // @arg Function|String - function or function-path or search keyword.
              highlight,   // @arg String = "" - code highlight.
              options) {   // @arg Object = {} - { nolink }
                           // @options.nolink Boolean = false
                           // @desc quick online help.
    if (typeof target === "object" && target["repository"]) {
        // var Class = { function, ... } object
        console.info(target);
        return;
    }
    _if(!/string|function/.test(typeof target),     Help, "target");
    _if(!/string|undefined/.test(typeof highlight), Help, "highlight");
    options = options || {};

    var resolved  = Reflection["resolve"](target);
    var search    = Reflection["getSearchLink"](resolved["path"]);
    var reference = Reflection["getReferenceLink"](resolved["path"]);

    var fn = resolved["fn"];
    var code = "";

    switch (typeof fn) {
    case "function": code = fn + ""; break;
    case "object": code = JSON.stringify(fn, null, 2);
    }
    _syntaxHighlight(code, highlight);
    if (!options.noLink) {
        Console["link"](search["url"], search["title"]);
        if (reference) {
            Console["link"](reference["url"], reference["title"]);
        }
    }
}

Help["repository"] = "https://github.com/uupaa/Help.js";

_defineGetter();

// --- implements ------------------------------------------
function _syntaxHighlight(code,   // @arg String
                          hint) { // @arg String = ""
    if ( Console["isEnabledStyle"]() ) {
        console.log.apply(console, Reflection["syntaxHighlight"](code, hint));
    } else {
        console.log(code);
    }
}

function _defineGetter() {
    Object.defineProperty(Function["prototype"], "help", {
        get: function() { Help(this); },
        configurable: true
    });
    Object.defineProperty(String["prototype"], "help", {
        get: function() { Help(this); },
        configurable: true
    });
}

/*
function _deleteGetter() {
    delete Function.prototype.help;
    delete String.prototype.help;
}
 */

// --- validate / assertions -------------------------------
//{@dev
function _if(value, fn, hint) {
    if (value) {
        throw new Error(fn.name + " " + hint);
    }
}
//}@dev

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Help;
}
global["Help"] = Help;

})(GLOBAL);



// --- WebModule idiom v2 - http://git.io/WebModule --------

(function moduleExporter(moduleName, moduleBody) {
   "use strict";

    var alias  = moduleName in GLOBAL ? (moduleName + "_") : moduleName; // switch module. http://git.io/Minify
    var entity = moduleBody();

    if (typeof modules !== "undefined") {
        GLOBAL["modules"]["register"](alias, moduleBody, entity["repository"]);
    }
    if (typeof exports !== "undefined") {
        module["exports"] = entity;
    }
    GLOBAL[alias] = entity;

})("REPOSITORY_NAME", function moduleBody() {

"use strict";

// --- dependency modules (optional) -----------------------
// --- define / local variables (optional) -----------------
// --- class / interfaces ----------------------------------
function REPOSITORY_NAME(value) { // @arg String = "" - comment
//{@dev
  //$args(REPOSITORY_NAME, arguments);
  //$valid($type(value, "String|omit"), REPOSITORY_NAME, "value");
//}@dev

    this._value = value || "";
}

REPOSITORY_NAME["repository"] = "https://github.com/GITHUB_USER_NAME/REPOSITORY_NAME.js"; // GitHub repository URL. http://git.io/Help
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

return REPOSITORY_NAME; // return ModuleEntity

});


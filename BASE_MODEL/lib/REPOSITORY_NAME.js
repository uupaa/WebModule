(function moduleExporter(moduleName, moduleClosure) { // http://git.io/WebModule
   "use strict";

    var moduleEntity = moduleClosure(GLOBAL);

    if (typeof webModule !== "undefined") {
        GLOBAL["webModule"]["exports"](moduleEntity, moduleName, moduleClosure);
    }
    if (typeof exports !== "undefined") {
        module["exports"] = moduleEntity;
    }
})("<<REPOSITORY_NAME>>", function moduleClosure(global) {

"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
function <<REPOSITORY_NAME>>(value) { // @arg String = "" - comment
//{@dev
    $valid($type(value, "String|omit"), <<REPOSITORY_NAME>>, "value");
//}@dev

    this._value = value || "";
}

<<REPOSITORY_NAME>>["repository"] = "https://github.com/<<GITHUB_USER_NAME>>/<<REPOSITORY_NAME>>.js"; // GitHub repository URL.
<<REPOSITORY_NAME>>["prototype"] = Object.create(<<REPOSITORY_NAME>>, {
    "constructor":  { "value": <<REPOSITORY_NAME>>                  }, // new <<REPOSITORY_NAME>>(value:String = ""):<<REPOSITORY_NAME>>
    // methods
    "concat":       { "value": <<REPOSITORY_NAME>>_concat           }, // <<REPOSITORY_NAME>>#concat(a:String):String
    // property accessors
    "value": {                                         // <<REPOSITORY_NAME>>#value:String
        "set": function(v) { this._value = v;       },
        "get": function()  { return this._value;    }
    },
});

// --- implements ------------------------------------------
function <<REPOSITORY_NAME>>_concat(a) { // @arg String
         __REPOSITORY_NAME__             // @ret String
//{@dev
    $valid($type(a, "String"), <<REPOSITORY_NAME>>, "a");
//}@dev

    return this._value + a;
}

// --- validate and assert functions -----------------------
//{@dev https://github.com/uupaa/WebModule/wiki/Validate
//function $type(value, types)                  { return GLOBAL["Valid"] ? GLOBAL["Valid"].type(value, types) : true; }
//function $keys(value, keys)                   { return GLOBAL["Valid"] ? GLOBAL["Valid"].keys(value, keys)  : true; }
//function $some(value, candidate, ignoreCase)  { return GLOBAL["Valid"] ? GLOBAL["Valid"].some(value, candidate, ignoreCase) : true; }
//function $args(api, args)                     { if (GLOBAL["Valid"]) { GLOBAL["Valid"].args(api, args); } }
//function $valid(value, api, highlihgt)        { if (GLOBAL["Valid"]) { GLOBAL["Valid"](value, api, highlihgt); } }
//}@dev

return <<REPOSITORY_NAME>>; // return entity

});


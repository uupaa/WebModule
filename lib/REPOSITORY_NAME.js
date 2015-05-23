(function moduleExporter(moduleName, moduleBody) { // http://git.io/WebModule
   "use strict";

    var alias  = moduleName in GLOBAL ? (moduleName + "_") : moduleName; // switch
    var entity = moduleBody(GLOBAL);

    if (typeof modules !== "undefined") {
        GLOBAL["modules"]["register"](alias, moduleBody, entity["repository"]);
    }
    if (typeof exports !== "undefined") {
        module["exports"] = entity;
    }
    GLOBAL[alias] = entity;

})("<<REPOSITORY_NAME>>", function moduleBody(global) {

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
//{@dev
//function $type(obj, type)      { return GLOBAL["Valid"] ? GLOBAL["Valid"].type(obj, type)    : true; }
//function $keys(obj, str)       { return GLOBAL["Valid"] ? GLOBAL["Valid"].keys(obj, str)     : true; }
//function $some(val, str, ig)   { return GLOBAL["Valid"] ? GLOBAL["Valid"].some(val, str, ig) : true; }
//function $args(fn, args)       { if (GLOBAL["Valid"]) { GLOBAL["Valid"].args(fn, args); } }
//function $valid(val, fn, hint) { if (GLOBAL["Valid"]) { GLOBAL["Valid"](val, fn, hint); } }
//}@dev

return <<REPOSITORY_NAME>>; // return entity

});


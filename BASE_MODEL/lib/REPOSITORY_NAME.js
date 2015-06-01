//export var <<REPOSITORY_NAME>> =
(function moduleExporter(moduleName, moduleClosure) { // http://git.io/WebModule
   "use strict";

    var moduleEntity = moduleClosure(GLOBAL);

    if (typeof webModule !== "undefined") {
        GLOBAL["webModule"]["exports"](moduleEntity, moduleName, moduleClosure);
    }
    if (typeof exports !== "undefined") {
        module["exports"] = moduleEntity;
    }
    return moduleEntity;

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
    $valid($type(a, "String"), <<REPOSITORY_NAME>>_concat, "a");
//}@dev

    return this._value + a;
}

return <<REPOSITORY_NAME>>; // return entity

});


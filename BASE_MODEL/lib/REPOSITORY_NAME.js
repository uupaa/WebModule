(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("<<REPOSITORY_NAME>>", function moduleClosure(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
var VERIFY  = global["WebModule"]["verify"]  || false;
var VERBOSE = global["WebModule"]["verbose"] || false;

// --- class / interfaces ----------------------------------
function <<REPOSITORY_NAME>>() {
    this._value = "";
}

<<REPOSITORY_NAME>>["repository"] = "https://github.com/<<GITHUB_USER_NAME>>/<<REPOSITORY_NAME>>.js";
<<REPOSITORY_NAME>>["prototype"] = Object.create(<<REPOSITORY_NAME>>, {
    "constructor": {
        "value": <<REPOSITORY_NAME>> // new <<REPOSITORY_NAME>>():<<REPOSITORY_NAME>>
    },
    // --- methods ---
    "method": {
        "value": <<REPOSITORY_NAME>>_method // <<REPOSITORY_NAME>>#method(a:String, b:String):String
    },
    // --- accessor ---
    "value": {
        "set": function(v) { this._value = v;    },
        "get": function()  { return this._value; }
    },
});

// --- implements ------------------------------------------
function <<REPOSITORY_NAME>>_method(a,   // @arg String
         __19_SPACE_________        b) { // @arg String
         __19_SPACE_________             // @ret String - a + b
//{@dev
    if (VERIFY) {
        $valid($type(a, "String"), <<REPOSITORY_NAME>>_method, "a");
        $valid($type(b, "String"), <<REPOSITORY_NAME>>_method, "b");
    }
//}@dev

    return a + b;
}

return <<REPOSITORY_NAME>>; // return entity

});


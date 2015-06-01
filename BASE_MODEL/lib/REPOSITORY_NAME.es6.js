export var <<REPOSITORY_NAME>> =
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
class <<REPOSITORY_NAME>> {
    constructor(value) { // @arg String = "" - comment
//{@dev
        $valid($type(value, "String|omit"), <<REPOSITORY_NAME>>, "value");
//}@dev
        this._value = value || "";
    }
    concat(a) { // @arg String
                // @ret String
//{@dev
        $valid($type(a, "String"), <<REPOSITORY_NAME>>_concat, "a");
//}@dev
        return this._value + a;
    }
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = v;
    }
}

<<REPOSITORY_NAME>>["repository"] = "https://github.com/<<GITHUB_USER_NAME>>/<<REPOSITORY_NAME>>.js"; // GitHub repository URL.

return <<REPOSITORY_NAME>>; // return entity

});


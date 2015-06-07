// http://git.io/WebModule

// --- global variables ------------------------------------
// https://github.com/uupaa/WebModule/wiki/WebModuleIdiom
var GLOBAL = GLOBAL || (this || 0).self || global;

// --- environment detection -------------------------------
GLOBAL["IN_NODE_OR_NW"] = !!GLOBAL.global;
GLOBAL["IN_BROWSER"]    = !GLOBAL["IN_NODE_OR_NW"] && "document" in GLOBAL;
GLOBAL["IN_WORKER"]     = !GLOBAL["IN_NODE_OR_NW"] && "WorkerLocation" in GLOBAL;
GLOBAL["IN_NODE"]       =  GLOBAL["IN_NODE_OR_NW"] && !/native/.test(setTimeout);
GLOBAL["IN_NW"]         =  GLOBAL["IN_NODE_OR_NW"] &&  /native/.test(setTimeout);

// --- validate and assert functions -----------------------
//{@dev https://github.com/uupaa/WebModule/wiki/Validate
GLOBAL["$type"]  = function(value, types)                 { return GLOBAL["Valid"] ? GLOBAL["Valid"].type(value, types) : true; };
GLOBAL["$keys"]  = function(value, keys)                  { return GLOBAL["Valid"] ? GLOBAL["Valid"].keys(value, keys)  : true; };
GLOBAL["$some"]  = function(value, candidate, ignoreCase) { return GLOBAL["Valid"] ? GLOBAL["Valid"].some(value, candidate, ignoreCase) : true; };
GLOBAL["$args"]  = function(api, args)                    { if (GLOBAL["Valid"]) { GLOBAL["Valid"].args(api, args); } };
GLOBAL["$valid"] = function(value, api, highlihgt)        { if (GLOBAL["Valid"]) { GLOBAL["Valid"](value, api, highlihgt); } };
//}@dev

// --- WebModule ------------------------------------------
GLOBAL.WebModule = {
    exports: function(name, closure) {
        var alias = name in GLOBAL["WebModule"] ? (name + "_") : name;

        return alias in this ? this[alias]
                             : this[alias] = closure(GLOBAL);
    }
};


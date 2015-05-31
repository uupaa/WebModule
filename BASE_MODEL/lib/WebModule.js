// http://git.io/WebModule

// --- global variables ------------------------------------
var GLOBAL = GLOBAL || (this || 0).self || global;

// --- environment detection -------------------------------
GLOBAL.IN_NODE_OR_NW = !!GLOBAL.global;
GLOBAL.IN_BROWSER    = !GLOBAL.IN_NODE_OR_NW && "document" in GLOBAL;
GLOBAL.IN_WORKER     = !GLOBAL.IN_NODE_OR_NW && "WorkerLocation" in GLOBAL;
GLOBAL.IN_NODE       =  GLOBAL.IN_NODE_OR_NW && !/native/.test(setTimeout);
GLOBAL.IN_NW         =  GLOBAL.IN_NODE_OR_NW &&  /native/.test(setTimeout);

// --- validate and assert functions -----------------------
//{@dev https://github.com/uupaa/WebModule/wiki/Validate
GLOBAL["$type"]  = function(value, types)                 { return GLOBAL["Valid"] ? GLOBAL["Valid"].type(value, types) : true; };
GLOBAL["$keys"]  = function(value, keys)                  { return GLOBAL["Valid"] ? GLOBAL["Valid"].keys(value, keys)  : true; };
GLOBAL["$some"]  = function(value, candidate, ignoreCase) { return GLOBAL["Valid"] ? GLOBAL["Valid"].some(value, candidate, ignoreCase) : true; };
GLOBAL["$args"]  = function(api, args)                    { if (GLOBAL["Valid"]) { GLOBAL["Valid"].args(api, args); } };
GLOBAL["$valid"] = function(value, api, highlihgt)        { if (GLOBAL["Valid"]) { GLOBAL["Valid"](value, api, highlihgt); } };
//}@dev

// --- WebModule ------------------------------------------
function WebModule() {
    this._modules = {}; // { name: { code, size, hash, loaded, elapsed, repo }, ... }
    this._totalSize = 0;
    this._totalElapsed = 0;
}

WebModule["HASH"] = true;
WebModule["VERBOSE"] = false;
WebModule.prototype.exports = function(entity, // @arg Function - module entity
                                       name,   // @arg String   - module name
                                       body) { // @arg Function - module body
    // --- export to global ---
    var alias = name in GLOBAL ? (name + "_") : name; // switch module name.

    GLOBAL[alias] = entity;

    if (name in this._modules) { return; } // already registered.

    // --- register ---
    var perf  = GLOBAL["performance"] ? GLOBAL["performance"] : Date;
    var time1 = perf["now"]();
    var time2 = time1;
    var code  = body + ""; // to string
    var hash  = 0;

    if (WebModule["HASH"] && GLOBAL["Hash"]) {
        hash  = GLOBAL["Hash"]["SourceCode"](code);
        time2 = perf["now"]();
    }
    if (WebModule["VERBOSE"]) {
        console.log("WebModule#register: " + name + ", time: " + (time2 - time1));
    }
    this._totalSize    += code.length;
    this._totalElapsed += time2 - time1;
    this._modules[name] = {
        "code":         code,
        "size":         code.length,
        "hash":         hash,               // hash("code")
        "repo":         entity["repository"] || "",
        "loaded":       time1,              // module loaded timeStamp
        "elapsed":      time2 - time1,      // hash("code") elapsed time
    };
};

WebModule.prototype.dump = function() {
    var json = JSON.parse(JSON.stringify(this._modules));

    json["total"] = {
        "size":     (this._totalSize / 1024).toFixed(2) + " KB",
        "elapsed":  (this._totalElapsed.toFixed(2)) + " ms",
    };

    console.table(json, ["loaded", "elapsed", "size", "hash", "repo"]);
};

GLOBAL.webModule = new WebModule();


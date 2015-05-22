// --- WebModule idiom v2 - http://git.io/WebModule --------
// --- environment detection -------------------------------
var GLOBAL          = GLOBAL || (this || 0).self || global;
var IN_NODE_OR_NW   = !!GLOBAL.global;
var IN_BROWSER      = !IN_NODE_OR_NW && "document" in GLOBAL;
var IN_WORKER       = !IN_NODE_OR_NW && "WorkerLocation" in GLOBAL;
var IN_NODE         =  IN_NODE_OR_NW && !/native/.test(setTimeout);
var IN_NW           =  IN_NODE_OR_NW &&  /native/.test(setTimeout);

// --- validate and assert functions (optional) ------------
function $type(obj, type)      { return GLOBAL["Valid"] ? GLOBAL["Valid"].type(obj, type)    : true; }
function $keys(obj, str)       { return GLOBAL["Valid"] ? GLOBAL["Valid"].keys(obj, str)     : true; }
function $some(val, str, ig)   { return GLOBAL["Valid"] ? GLOBAL["Valid"].some(val, str, ig) : true; }
function $args(fn, args)       { if (GLOBAL["Valid"]) { GLOBAL["Valid"].args(fn, args); } }
function $valid(val, fn, hint) { if (GLOBAL["Valid"]) { GLOBAL["Valid"](val, fn, hint); } }

// --- WebModules ------------------------------------------
function WebModules() {
    this._modules = {}; // { name: { body, hash, repository, size }, ... }
}

WebModules["VERBOSE"] = false;
WebModules.prototype.register = function(name,         // @arg ModuleNameString
                                         body,         // @arg Function|String
                                         repository) { // @arg String = ""
    var moduleBody = typeof body === "function" ? body + "" : body;
    var hash = 0;

    if (typeof Hash !== "undefined") {
        hash = GLOBAL["Hash"]["XXHash"](moduleBody);
    }
    if ( !(name in this._modules) ) {
        if (WebModules["VERBOSE"]) {
            console.log("WebModules#register: " + name);
        }

        this._modules[name] = {
            "body": moduleBody,
            "size": moduleBody.length,
            "hash": hash,
            "repository": repository || ""
        };
    }
};

WebModules.prototype.dump = function() {
    for (var name in this._modules) {
        console.log(name, this._modules[name]["hash"]);
    }
};

var modules = new WebModules();



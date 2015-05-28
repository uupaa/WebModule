// http://git.io/WebModule

// --- global variables ------------------------------------
var GLOBAL = GLOBAL || (this || 0).self || global;

// --- environment detection -------------------------------
GLOBAL.IN_NODE_OR_NW = !!GLOBAL.global;
GLOBAL.IN_BROWSER    = !IN_NODE_OR_NW && "document" in GLOBAL;
GLOBAL.IN_WORKER     = !IN_NODE_OR_NW && "WorkerLocation" in GLOBAL;
GLOBAL.IN_NODE       =  IN_NODE_OR_NW && !/native/.test(setTimeout);
GLOBAL.IN_NW         =  IN_NODE_OR_NW &&  /native/.test(setTimeout);

// --- WebModules ------------------------------------------
function WebModules() {
    this._modules = {}; // { name: { code, size, hash, loaded, elapsed, repository }, ... }
    this._totalSize = 0;
    this._totalElapsed = 0;
}

WebModules["VERBOSE"] = false;
WebModules["HASH"] = true;
WebModules.prototype.register = function(name,         // @arg ModuleNameString
                                         body,         // @arg Function|String
                                         repository) { // @arg String = ""
    if (name in this._modules) { return; } // already registered.

    var perf  = GLOBAL["performance"] ? performance : Date;
    var time1 = perf.now();
    var time2 = time1;
    var code  = body + ""; // to string
    var hash  = 0;

    if (WebModules["HASH"] && typeof Hash !== "undefined") {
        hash  = GLOBAL["Hash"]["SourceCode"](code);
        time2 = perf.now();
    }
    if (WebModules["VERBOSE"]) {
        console.log("WebModules#register: " + name + ", time: " (time2 - time1));
    }
    this._totalSize    += code.length;
    this._totalElapsed += time2 - time1;
    this._modules[name] = {
        "code":         code,
        "size":         code.length,
        "hash":         hash,               // hash("code")
        "loaded":       time1,              // module loaded timeStamp
        "elapsed":      time2 - time1,      // hash("code") elapsed time
        "repository":   repository || ""
    };
};

WebModules.prototype.dump = function() {
    var json = JSON.parse(JSON.stringify(this._modules));

    json["total"] = {
        "size":     (this._totalSize / 1024).toFixed(2) + " KB",
        "elapsed":  (this._totalElapsed.toFixed(2)) + " ms",
    };

    console.table(json, ["loaded", "elapsed", "size", "hash", "repository"]);
};

GLOBAL.modules = new WebModules();


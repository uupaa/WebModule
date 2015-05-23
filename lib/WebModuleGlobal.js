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

GLOBAL.modules = new WebModules();


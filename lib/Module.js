(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var fs = require("fs");

// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

// --- class / interfaces ----------------------------------
function Module() {
}

Module.getDependencies = Module_getDependencies;
Module.collectPackageFiles = Module_collectPackageFiles;
Module.sortModuleListByDependencyOrder = Module_sortModuleListByDependencyOrder;
Module.getFileList = Module_getFileList;
Module.toUniqueArray = Module_toUniqueArray;
Module.collectBuildTarget = Module_collectBuildTarget;
Module.upgradePackageJSON = Module_upgradePackageJSON; // Module.upgradePackageJSON(pkg:JSONObject):JSONObject
Module.prettyPrint = Module_prettyPrint; // Module.prettyPrint(str:JSONString):JSONString

// --- implements ------------------------------------------
function Module_getDependencies(releaseBuild) { // @arg Boolean = false
                                                // @ret Object - { node:PathStringArray, worker:PathStringArray, browser:PathStringArray, label:StringArray }
    releaseBuild = releaseBuild || false;

    var packages = {}; // cached package.json { module: JSON.parse("package.json"), ...}
    var tree     = {}; // dependency tree { "module1": { "module2": { ... }, ... } };
    var modules  = []; // [module, ...]

    Module_collectPackageFiles(packages, tree, modules, releaseBuild);
    Module_sortModuleListByDependencyOrder(tree, modules);

    var files = Module_getFileList(packages, tree, modules, releaseBuild); // { node, worker, browser, label }

    return { "packages": packages, "tree": tree, "modules": modules, "files": files };
}

function Module_collectPackageFiles(packages, tree, modules, releaseBuild) {
    _recursiveCollectPackageFiles("", packages, tree, modules, 0);

    function _recursiveCollectPackageFiles(dir, packages, tree, modules, nest) {
        var path = dir + "package.json";

        if ( fs["existsSync"](path) ) {
            var orgpkg = JSON.parse( fs["readFileSync"](path, "UTF-8") );

            var pkg = Module_upgradePackageJSON(orgpkg);

            if (JSON.stringify(pkg) !== JSON.stringify(orgpkg)) {
                fs["writeFileSync"](path, Module_prettyPrint(JSON.stringify(pkg, null, 2)));
                console.log("  upgrade " + path);
            }
            if ("webmodule" in pkg) { // has webmodule property
                if ( !(pkg["name"] in packages) ) {
                    packages[pkg["name"]] = {
                        "dir": dir,
                        "webmodule": pkg["webmodule"],
                        "dependencies": pkg["dependencies"],
                        "devDependencies": pkg["devDependencies"]
                    };
                }
                // devDependencies の情報を収集するのは、最初の階層(nest === 0)のみ
                // releaseBuild が true の場合も収集しない
                if (nest === 0 && releaseBuild === false) {
                    Object.keys(pkg["devDependencies"]).forEach(_drillDown);
                }
                Object.keys(pkg["dependencies"]).forEach(_drillDown);
            }
        }

        function _drillDown(module) {
            if (modules.indexOf(module) < 0) {
                modules.push(module);
            }
            tree[module] = {};
            _recursiveCollectPackageFiles(dir + "node_modules/" + module + "/",
                                          packages, tree[module], modules, nest + 1);
        }
    }
}

function Module_sortModuleListByDependencyOrder(tree, modules) {
    // https://gist.github.com/uupaa/ad495d35af90a4859e2c
    var pathList = _makePathList([], "", tree);

    for (var i = 0, iz = pathList.length; i < iz; ++i) {
        var path = pathList[i];
        var array = path.split("/").slice(1); // "/a/b" -> ["a", "b"]

        for (var j = 0, jz = array.length - 1; j < jz; ++j) {
            var moduleA = array[j];
            var moduleB = array[j + 1];
            var posA = modules.indexOf(moduleA);
            var posB = modules.indexOf(moduleB);

            if (posA >= 0 && posB >= 0) {
                if (posA < posB) { // moduleA need moduleB.
                    // move the mobuleB to before mobuleA.
                    modules.splice(posB, 1); // Remove the moduleB,
                    modules.splice(posA, 0, moduleB); // and injecting it to before moduleA.
                }
            }
        }
    }
}

function _makePathList(result, dir, subtree) {
    for (var key in subtree) {
        var path = dir + "/" + key;

        result.push(path);
        _makePathList(result, path, subtree[key]);
    }
    return result;
}

function Module_getFileList(packages,
                            tree,
                            modules,
                            releaseBuild) { // @ret Object - { node, worker, browser, label }
                                            // @return.node    PathStringArray - Node.js files.
                                            // @return.worker  PathStringArray - Worker files.
                                            // @return.browser PathStringArray - Browser files.
                                            // @return.label   StringArray     - label.
    var node = [], worker = [], browser = [], label = [];

    modules.forEach(function(name) {
        if (name in packages) {
            var config = packages[name]["webmodule"];

            if (config) {
                if (releaseBuild && config["develop"]) { // skip
                    return;
                }
                var dir = packages[name]["dir"];

                if (1) { // [DEPRECATED FORMAT]
                    var target = config["target"];
                    if (target) {
                        console.log(name + " package.json is deprecated format. you need do `npm run sync` command");
                    }
                }

                // collect labels.
                Array.prototype.push.apply(label, config["label"]);

                if ("browser" in config) {
                    config["browser"]["source"].forEach(function(file) {
                        var path = dir + file;
                        if (browser.indexOf(path) < 0) { browser.push(path); }
                    });
                }
                if ("worker" in config) {
                    config["worker"]["source"].forEach(function(file) {
                        var path = dir + file;
                        if (worker.indexOf(path) < 0) { worker.push(path); }
                    });
                }
                if ("node" in config) {
                    config["node"]["source"].forEach(function(file) {
                        var path = dir + file;
                        if (node.indexOf(path) < 0) { node.push(path); }
                    });
                }
            }
        }
    });
    return {
        "node":    node,
        "worker":  worker,
        "browser": browser,
        "label":   Module_toUniqueArray(label) // ["@dev", "@debug", ...]
    };
}

function Module_toUniqueArray(source) {
    return source.reduce(function(result, value) {
            if (result.indexOf(value) < 0) { result.push(value); }
            return result;
        }, []);
}

function Module_collectBuildTarget(json) { // @arg Object - package.json
                                           // @ret Object - { browser, worker, node, sources, workDir }
    var wm = json.webmodule;

    // --- collect source ---
    var browserSource = [];
    var workerSource = [];
    var nodeSource = [];
    // --- collect output ---
    var browserOutput = "";
    var workerOutput = "";
    var nodeOutput = "";

    if (wm.browser) {
        browserSource = wm.browser.source;
        browserOutput = wm.browser.output;
    }
    if (wm.worker) {
        workerSource  = wm.worker.source;
        workerOutput  = wm.worker.output;
    }
    if (wm.node) {
        nodeSource    = wm.node.source;
        nodeOutput    = wm.node.output;
    }
    var sources = Module_toUniqueArray([].concat(browserSource, workerSource, nodeSource));
    var workDir = "";
    var output = browserOutput || workerOutput || nodeOutput || "";

    if (output.indexOf("/") > 0) {
        workDir = output.split("/").slice(0, -1).join("/") + "/";
    }

    return {
        browser: {
            source: browserSource,
            output: browserOutput
        },
        worker: {
            source: workerSource,
            output: workerOutput
        },
        node: {
            source: nodeSource,
            output: nodeOutput
        },
        sources: sources,
        workDir: workDir
    };
}

function Module_upgradePackageJSON(pkg) {
    pkg = _upgradeXBuild(pkg);
    pkg = _upgradeBuileTarget(pkg);
    return pkg;
}

function _upgradeXBuild(pkg) {
    if (!("x-build" in pkg)) { return pkg; }

//  console.log("  upgrade x-build {...} to webmodule {...}");

    var build = pkg["x-build"];

    pkg.webmodule = {
        label:  build.label,
        target: build.target,
        source: build.source,
        output: build.output
    };
    delete pkg["x-build"];
    return pkg;
}

function _upgradeBuileTarget(pkg) {
// Before
//      "webmodule": {
//        "develop":      false,
//        "label":        ["@dev"],
//        "target":       ["all"],                          <- remove this
//        "source":       ["lib/REPOSITORY_NAME.js"],       <- sprit this
//        "output":       "release/REPOSITORY_NAME.min.js"  <- sprit this
//      },
//
// After
//      "webmodule": {
//        "develop":      false,                            <- stay
//        "label":        ["@dev"],                         <- stay
//        "browser": {                                      <- add if target.has.browser
//          "source":     ["lib/REPOSITORY_NAME.js"],
//          "output":     "release/REPOSITORY_NAME.b.min.js",
//        },
//        "worker": {                                       <- add if target.has.worker
//          "source":     ["lib/REPOSITORY_NAME.js"],
//          "output":     "release/REPOSITORY_NAME.w.min.js",
//        },
//        "node": {                                         <- add if target.has.node
//          "source":     ["lib/REPOSITORY_NAME.js"],
//          "output":     "release/REPOSITORY_NAME.b.min.js",
//        }
//      },
//
    if (!("webmodule" in pkg) || !("target" in pkg["webmodule"])) { return pkg; }
    var wm = pkg["webmodule"];

//  console.log("  upgrade webmodule.target to webmodule{browser|worker|node}");

    var result = JSON.parse(JSON.stringify(pkg));

    result.webmodule = {
        develop: pkg.webmodule.develop || false,
        label:   pkg.webmodule.label   || ["@dev"]
    };

    var target = pkg.webmodule.target.join("");

    if ( /(all|browser)/i.test(target) ) {
        result.webmodule.browser = {
            source: pkg.webmodule.source,
            output: pkg.webmodule.output.replace(/min.js$/, "b.min.js")
        };
    }
    if ( /(all|worker)/i.test(target) ) {
        result.webmodule.worker = {
            source: pkg.webmodule.source,
            output: pkg.webmodule.output.replace(/min.js$/, "w.min.js")
        };
    }
    if ( /(all|node)/i.test(target) ) {
        result.webmodule.node = {
            source: pkg.webmodule.source,
            output: pkg.webmodule.output.replace(/min.js$/, "n.min.js")
        };
    }
    return result;
}

function Module_prettyPrint(str) { // @arg JSONString
                                   // @ret JSONString
    return str.replace(/: \[([^\]]*)\],/g, function(_, items) {
        return ': [' + items.trim().replace(/\s*\n+\s*/g, " ") + '],';
    });
}

// --- exports ---------------------------------------------
if ("process" in global) {
    module["exports"] = Module;
}
global["Module"] = Module;

})((this || 0).self || global);


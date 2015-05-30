// Module.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var fs = require("fs");

// --- define / local variables ----------------------------
// --- class / interfaces ----------------------------------
var ModuleSystem = {
        getDependencies:        ModuleSystem_getDependencies,
        collectPackageFiles:    ModuleSystem_collectPackageFiles,
        sortModuleListByDependencyOrder:
                                ModuleSystem_sortModuleListByDependencyOrder,
        getFileList:            ModuleSystem_getFileList,
        toUniqueArray:          ModuleSystem_toUniqueArray,
        collectBuildTarget:     ModuleSystem_collectBuildTarget,
        upgradePackageJSON:     ModuleSystem_upgradePackageJSON,  // ModuleSystem.upgradePackageJSON(pkg:JSONObject):JSONObject
        prettyPrint:            ModuleSystem_prettyPrint          // ModuleSystem.prettyPrint(str:JSONString):JSONString
    };

// --- implements ------------------------------------------
function ModuleSystem_getDependencies(releaseBuild) { // @arg Boolean = false
                                                      // @ret Object - { nw:PathStringArray, node:PathStringArray, worker:PathStringArray, browser:PathStringArray, label:StringArray }
    releaseBuild = releaseBuild || false;

    var packages = {}; // cached package.json { module: JSON.parse("package.json"), ...}
    var tree     = {}; // dependency tree { "module1": { "module2": { ... }, ... } };
    var modules  = []; // [module, ...]

    ModuleSystem_collectPackageFiles(packages, tree, modules, releaseBuild);
    ModuleSystem_sortModuleListByDependencyOrder(tree, modules);

    var files = ModuleSystem_getFileList(packages, tree, modules, releaseBuild); // { nw, node, worker, browser, label }

    return { "packages": packages, "tree": tree, "modules": modules, "files": files };
}

function ModuleSystem_collectPackageFiles(packages, tree, modules, releaseBuild) {
    _recursiveCollectPackageFiles("", packages, tree, modules, 0);

    function _recursiveCollectPackageFiles(dir, packages, tree, modules, nest) {
        var path = dir + "package.json";

        if ( fs["existsSync"](path) ) {
            var orgpkg = JSON.parse( fs["readFileSync"](path, "UTF-8") );

            var pkg = ModuleSystem_upgradePackageJSON(orgpkg);

            if (JSON.stringify(pkg) !== JSON.stringify(orgpkg)) {
                fs["writeFileSync"](path, ModuleSystem_prettyPrint(JSON.stringify(pkg, null, 2)));
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

function ModuleSystem_sortModuleListByDependencyOrder(tree, modules) {
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

function ModuleSystem_getFileList(packages,
                                  tree,
                                  modules,
                                  releaseBuild) { // @ret Object - { nw, node, worker, browser, label }
                                                  // @return.nw      PathStringArray - node-webkit files.
                                                  // @return.node    PathStringArray - Node.js files.
                                                  // @return.worker  PathStringArray - Worker files.
                                                  // @return.browser PathStringArray - Browser files.
                                                  // @return.label   StringArray     - label.
    var nw = [], node = [], worker = [], browser = [], label = [];

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
                if ("nw" in config) {
                    config["nw"]["source"].forEach(function(file) {
                        var path = dir + file;
                        if (nw.indexOf(path) < 0) { nw.push(path); }
                    });
                }
            }
        }
    });
    return {
        "nw":      nw,
        "node":    node,
        "worker":  worker,
        "browser": browser,
        "label":   ModuleSystem_toUniqueArray(label) // ["@dev", "@debug", ...]
    };
}

function ModuleSystem_toUniqueArray(source) {
    return source.reduce(function(result, value) {
            if (result.indexOf(value) < 0) { result.push(value); }
            return result;
        }, []);
}

function ModuleSystem_collectBuildTarget(json) { // @arg Object - package.json
                                                 // @ret Object - { browser, worker, node, sources, workDir }
    var wm = json.webmodule || {};

    // --- collect source ---
    var browserSource = [];
    var workerSource = [];
    var nodeSource = [];
    var nwSource = [];
    // --- collect output ---
    var browserOutput = "";
    var workerOutput = "";
    var nodeOutput = "";
    var nwOutput = "";

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
    if (wm.nw) {
        nwSource      = wm.nw.source;
        nwOutput      = wm.nw.output;
    }
    var sources = ModuleSystem_toUniqueArray([].concat(browserSource, workerSource, nodeSource, nwSource));
    var workDir = "";
    var output = browserOutput || workerOutput || nodeOutput || nwOutput || "";

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
        nw: {
            source: nwSource,
            output: nwOutput
        },
        sources: sources,
        workDir: workDir
    };
}

function ModuleSystem_upgradePackageJSON(pkg) {
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
//        },
//        "nw": {                                           <- add if target.has.node && target.has.browser
//          "source":     ["lib/REPOSITORY_NAME.js"],
//          "output":     "release/REPOSITORY_NAME.nw.min.js",
//        }
//      },
//
    if (!("webmodule" in pkg) || !("target" in pkg["webmodule"])) { return pkg; }
//  var wm = pkg["webmodule"];

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
    if ( /(all)/i.test(target) || (/(browser)/i.test(target) && /(node)/i.test(target)) ) {
        result.webmodule.nw = {
            source: pkg.webmodule.source,
            output: pkg.webmodule.output.replace(/min.js$/, "nw.min.js")
        };
    }
    return result;
}

function ModuleSystem_prettyPrint(str) { // @arg JSONString
                                         // @ret JSONString
    return str.replace(/: \[([^\]]*)\],/g, function(_, items) {
        return ': [' + items.trim().replace(/\s*\n+\s*/g, " ") + '],';
    });
}

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = ModuleSystem;
}
global["ModuleSystem"] = ModuleSystem;

})(GLOBAL);


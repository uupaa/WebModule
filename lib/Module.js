(function(global) {

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

// --- implements ------------------------------------------
function Module_getDependencies(releaseBuild) {
    releaseBuild = releaseBuild || false;

    var packages = {}; // cached package.json { module: JSON.parse("package.json"), ...}
    var tree     = {}; // dependency tree { "module1": { "module2": { ... }, ... } };
    var modules  = []; // [module, ...]

    Module_collectPackageFiles(packages, tree, modules, releaseBuild);
    Module_sortModuleListByDependencyOrder(tree, modules);

    var files = Module_getFileList(packages, tree, modules, releaseBuild); // { all, node, worker, browser, label }

    return { "packages": packages, "tree": tree, "modules": modules, "files": files };
}

function Module_collectPackageFiles(packages, tree, modules, releaseBuild) {
    _recursiveCollectPackageFiles("", packages, tree, modules, 0);

    function _recursiveCollectPackageFiles(dir, packages, tree, modules, nest) {
        var path = dir + "package.json";

        if ( fs["existsSync"](path) ) {
            var pkg = JSON.parse( fs["readFileSync"](path) );

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
        var modules = path.split("/").slice(1); // "/a/b" -> ["a", "b"]

        for (var j = 0, jz = modules.length - 1; j < jz; ++j) {
            var moduleA = modules[j];
            var moduleB = modules[j + 1];
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
                            releaseBuild) { // @ret Object - { all, node, worker, browser, label }
                                            // @return.all PathStringArray     - all files.
                                            // @return.node PathStringArray    - Node.js files.
                                            // @return.worker PathStringArray  - Worker files.
                                            // @return.browser PathStringArray - Browser files.
                                            // @return.label PathStringArray   - label.
    var all = [], node = [], worker = [], browser = [], label = [];

    modules.forEach(function(name) {
        if (name in packages) {
            var config = packages[name]["webmodule"];

            if (config) {
                if (releaseBuild && config["develop"]) { // skip
                    return;
                }
                var dir       = packages[name]["dir"];
                var target    = config["target"]; // ["all", "browser", "worker", "node"]
                var toNode    = /(all|node)/i.test(target);
                var toWorker  = /(all|worker)/i.test(target);
                var toBrowser = /(all|browser)/i.test(target);

                // collect labels.
                Array.prototype.push.apply(label, config["label"]);

                config["source"].forEach(function(file) {
                    var path = dir + file;

                    if (all.indexOf(path) < 0) { all.push(path); }
                    if (toNode && node.indexOf(path) < 0) { node.push(path); }
                    if (toWorker && worker.indexOf(path) < 0) { worker.push(path); }
                    if (toBrowser && browser.indexOf(path) < 0) { browser.push(path); }
                });
            }
        }
    });
    return { "all": all,
             "node": node, "worker": worker, "browser": browser,
             "label": Module_toUniqueArray(label) };
}

function Module_toUniqueArray(source) {
    return source.reduce(function(result, value) {
            if (result.indexOf(value) < 0) { result.push(value); }
            return result;
        }, []);
}

// --- exports ---------------------------------------------
if ("process" in global) {
    module["exports"] = Module;
}
global["Module"] = Module;

})((this || 0).self || global);


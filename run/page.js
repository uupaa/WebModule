#!/usr/bin/env node

// page --verbose

var NODE_TEST_PAGE = _multiline(function() {/*
__SCRIPT__

*/});

var BROWSER_TEST_PAGE = _multiline(function() {/*
<!DOCTYPE html><html><head><title>test</title>
<meta name="viewport" content="width=device-width, user-scalable=no">
<meta charset="utf-8"></head><body>

__SCRIPT__

</body></html>

*/});

var WORKER_TEST_PAGE = _multiline(function() {/*
onmessage = function(event) {
    self.TEST_DATA = event.data; // WebModule/lib/Test.js
    self.TEST_ERROR_MESSAGE = "";

    if (!self.console) {
        self.console = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
    }

    __IMPORT_SCRIPTS__

    self.postMessage({ TEST_ERROR_MESSAGE: self.TEST_ERROR_MESSAGE || "" });
};

*/});


var fs = require("fs");
var wmlib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod = require(wmlib + "Module.js");
var argv = process.argv.slice(2);
var verbose = argv[0] === "--verbose" || argv[0] === "-v";

put();

function put() {
    var releaseBuild = false;
    var deps = mod.getDependencies(releaseBuild);

    ["lib/Reflection.js",
     "lib/Console.js",
     "lib/Valid.js",
     "lib/Help.js",
     "lib/Task.js",
     "lib/Test.js"].forEach(function(js) {
        deps.files.browser.push("../WebModule/" + js);
        deps.files.worker.push("../WebModule/" + js);
        deps.files.node.push("../WebModule/" + js);
    });

    if (verbose) {
//      console.log("\u001b[31m" + "packages: " + JSON.stringify(deps.packages, null, 2) + "\u001b[0m");
        console.log("\u001b[32m" + "tree: "     + JSON.stringify(deps.tree,     null, 2) + "\u001b[0m");
        console.log("\u001b[33m" + "modules: "  + JSON.stringify(deps.modules,  null, 2) + "\u001b[0m");
        console.log("files: "                   + JSON.stringify(deps.files,    null, 2));
    }
    var currentPackageJSON = JSON.parse(fs.readFileSync("package.json"));
    var pages = _createTestPage(deps.files, currentPackageJSON); // { browser, node }

    if ( !fs["existsSync"]("test") ) {
        console.error("\u001b[31m" + "ERROR. test/ directory not found." + "\u001b[0m");
    } else {
        if (verbose) {
            console.log( "update test/index.html: \n    " + pages.browser.replace(/\n/g, "\n    " ) );
            console.log( "update test/worker.js: \n    "  + pages.worker.replace(/\n/g, "\n    " ) );
            console.log( "update test/node.js: \n    "    + pages.node.replace(/\n/g, "\n    " ) );
        }
        fs.writeFileSync("test/index.html", pages.browser);
        fs.writeFileSync("test/worker.js", pages.worker);
        fs.writeFileSync("test/node.js", pages.node);
    }
}

function _createTestPage(files,         // @arg Object - { node, worker, browser, label }
                         packagejson) { // @arg Object - package.json
                                        // @ret Object - { browser:String, worker:String, node:String }
    var target = mod.collectBuildTarget(packagejson);
    var wm = packagejson["webmodule"];

    var scriptFiles       = mod.toUniqueArray(files.browser.concat(target.browser.source).map(_script));
    var importScriptFiles = mod.toUniqueArray(files.worker.concat(target.worker.source).map(_import));
    var requireFiles      = mod.toUniqueArray(files.node.concat(target.node.source).map(_require));

    var browserPage = BROWSER_TEST_PAGE;
    var workerPage = WORKER_TEST_PAGE;
    var nodePage = NODE_TEST_PAGE;

    // package.json に webmodule{browser|worker|node} が無い場合でも、
    // テスト用のページをそれぞれ生成します。
    if (wm.worker) {
        importScriptFiles.push('importScripts("../' + target.worker.output + '");');
        importScriptFiles.push('importScripts("./testcase.js");');
        workerPage = workerPage.replace("__IMPORT_SCRIPTS__", importScriptFiles.join("\n    "));
    } else {
        workerPage = workerPage.replace("__IMPORT_SCRIPTS__", "");
    }

    if (wm.browser) {
        scriptFiles.push('<script src="../' + target.browser.output + '"></script>');
        scriptFiles.push('<script src="./testcase.js"></script>');
        browserPage = browserPage.replace("__SCRIPT__", scriptFiles.join("\n"));
    } else {
        browserPage = browserPage.replace("__SCRIPT__", "");
    }

    if (wm.node) {
        requireFiles.push('require("../' + target.node.output + '");');
        requireFiles.push('require("./testcase.js");');
        nodePage = NODE_TEST_PAGE.replace("__SCRIPT__", requireFiles.join("\n"));
    } else {
        nodePage = NODE_TEST_PAGE.replace("__SCRIPT__", "");
    }

    return { browser: browserPage, worker: workerPage, node: nodePage };

    function _require(file) { return 'require("../' + file + '");'; }
    function _import(file)  { return 'importScripts("../' + file + '");'; }
    function _script(file)  { return '<script src="../' + file + '"></script>'; }
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}


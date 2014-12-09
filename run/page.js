#!/usr/bin/env node


var NODE_TEST_PAGE = _multiline(function() {/*
__SCRIPT__

*/});

var BROWSER_TEST_PAGE = _multiline(function() {/*
<!DOCTYPE html><html><head><title>test</title>
<meta name="viewport" content="width=device-width, user-scalable=no">
<meta charset="utf-8"></head><body>

<script id="worker" type="javascript/worker">
onmessage = function(event) {

    if (!self.console) {
        self.console = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
    }

    self.MESSAGE = event.data;

    __IMPORT_SCRIPTS__

    self.postMessage({ error: self.errorMessage || "" });
};
</script>

__SCRIPT__

</body></html>

*/});


var fs   = require("fs");
var argv = process.argv.slice(2);
var WebModuleLib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var Module = require(WebModuleLib + "Module.js");

put();

function put() {
    var verbose = true;
    var releaseBuild = false;
    var deps = Module.getDependencies(releaseBuild);

    deps.files.node.push("../WebModule/lib/Console.js");
    deps.files.browser.push("../WebModule/lib/Console.js");
    deps.files.worker.push("../WebModule/lib/Console.js");

    deps.files.node.push("../WebModule/lib/Help.js");
    deps.files.browser.push("../WebModule/lib/Help.js");
    deps.files.worker.push("../WebModule/lib/Help.js");

    deps.files.node.push("../WebModule/lib/Valid.js");
    deps.files.browser.push("../WebModule/lib/Valid.js");
    deps.files.worker.push("../WebModule/lib/Valid.js");

    deps.files.node.push("../WebModule/lib/TestTask.js");
    deps.files.browser.push("../WebModule/lib/TestTask.js");
    deps.files.worker.push("../WebModule/lib/TestTask.js");

    deps.files.node.push("../WebModule/lib/Test.js");
    deps.files.browser.push("../WebModule/lib/Test.js");
    deps.files.worker.push("../WebModule/lib/Test.js");

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
            console.log( "update test/index.html: \n    "    + pages.browser.replace(/\n/g, "\n    " ) );
            console.log( "update test/index.node.js: \n    " + pages.node.replace(/\n/g, "\n    " ) );
        }
        fs.writeFileSync("test/index.html", pages.browser);
        fs.writeFileSync("test/index.node.js", pages.node);
    }
}

function _createTestPage(files,         // @arg Object - { all, node, worker, browser, label }
                         packagejson) { // @arg Object - package.json
                                        // @ret String

    var webmodule = packagejson["webmodule"];
    var requireFiles      = _toUniqueArray(files.node.concat(webmodule["source"]).map(_require));
    var scriptFiles       = _toUniqueArray(files.browser.concat(webmodule["source"]).map(_script));
    var importScriptFiles = _toUniqueArray(files.worker.concat(webmodule["source"]).map(_import));

    var browserPage = BROWSER_TEST_PAGE;
    var nodePage = NODE_TEST_PAGE;

    if ( /(all|worker)/i.test( webmodule.target.join(" ") ) ) {
        importScriptFiles.push('importScripts(MESSAGE.BASE_DIR + "../' + webmodule.output + '");');
        importScriptFiles.push('importScripts(MESSAGE.BASE_DIR + "./testcase.js");');
        browserPage = browserPage.replace("__IMPORT_SCRIPTS__", importScriptFiles.join("\n    "));
    } else {
        browserPage = browserPage.replace("__IMPORT_SCRIPTS__", "");
    }
    if ( /(all|browser)/i.test( webmodule.target.join(" ") ) ) { // browser ready module
        scriptFiles.push('<script src="../' + webmodule.output + '"></script>');
        scriptFiles.push('<script src="./testcase.js"></script>');
        browserPage = browserPage.replace("__SCRIPT__", scriptFiles.join("\n"));
    } else {
        browserPage = browserPage.replace("__SCRIPT__", "");
    }
    if ( /(all|node)/i.test( webmodule.target.join(" ") ) ) { // node ready module
        requireFiles.push('require("../' + webmodule.output + '");');
        requireFiles.push('require("./testcase.js");');
        nodePage = NODE_TEST_PAGE.replace("__SCRIPT__", requireFiles.join("\n"));
    } else {
        nodePage = NODE_TEST_PAGE.replace("__SCRIPT__", "");
    }
    return { browser: browserPage, node: nodePage };

    function _require(file) { return 'require("../' + file + '");'; }
    function _import(file)  { return 'importScripts(MESSAGE.BASE_DIR + "../' + file + '");'; }
    function _script(file)  { return '<script src="../' + file + '"></script>'; }
}

function _toUniqueArray(source) {
    return source.reduce(function(result, value) {
            if (result.indexOf(value) < 0) { result.push(value); }
            return result;
        }, []);
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}


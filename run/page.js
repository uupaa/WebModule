#!/usr/bin/env node

// page --verbose
(function(global) {

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";

var fs    = require("fs");
var wmlib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod   = require(wmlib + "ModuleSystem.js");
var argv  = process.argv.slice(2);
var pkg   = JSON.parse(fs.readFileSync("package.json", "utf8"));
var verbose = argv[0] === "--verbose" || argv[0] === "-v";

_createTestPages();

function _createTestPages() {
    var releaseBuild = false;
    var deps = mod.getDependencies(releaseBuild);

    if (verbose) {
//      console.log("\u001b[31m" + "packages: " + JSON.stringify(deps.packages, null, 2) + "\u001b[0m");
        console.log("\u001b[32m" + "tree: "     + JSON.stringify(deps.tree,     null, 2) + "\u001b[0m");
        console.log("\u001b[33m" + "modules: "  + JSON.stringify(deps.modules,  null, 2) + "\u001b[0m");
        console.log("files: "                   + JSON.stringify(deps.files,    null, 2));
    }
    if ( !fs["existsSync"]("test") ) {
        console.error(ERR + "ERROR. test/ directory was not found." + CLR);
    } else if ( !fs["existsSync"]("test/template") ) {
        console.error(ERR + "ERROR. test/template directory was not found." + CLR);
    }
    var files = _convertTemplateFiles(deps.files, pkg); // { browser, worker, node, nw }

    if (verbose) {
        console.log( "update test/index.html: \n    " + files.browser.replace(/\n/g, "\n    " ) );
        console.log( "update test/worker.js: \n    "  + files.worker.replace(/\n/g, "\n    " ) );
        console.log( "update test/node.js: \n    "    + files.node.replace(/\n/g, "\n    " ) );
        console.log( "update test/nw.html: \n    "    + files.nw.replace(/\n/g, "\n    " ) );
    }
    // package.json に webmodule{browser|worker|node|nw} プロパティが無い場合でも、
    // テスト用のページはそれぞれ生成します。
    fs.writeFileSync("test/index.html", files.browser);
    fs.writeFileSync("test/worker.js",  files.worker);
    fs.writeFileSync("test/node.js",    files.node);
    fs.writeFileSync("test/nw.html",    files.nw);

    // copy test/template/nw.package.json to test/package.json
    var nwpkg = fs.readFileSync("test/template/nw.package.json", "utf8");

    fs.writeFileSync("test/package.json", nwpkg);
}

function _convertTemplateFiles(files,         // @arg Object - { node, worker, browser, nw, label }
                               packagejson) { // @arg Object - module package.json
                                              // @ret Object - { browser:String, worker:String, node:String, nw:String }
    var target = mod.collectBuildTarget(packagejson);
    var wm = packagejson["webmodule"];

    var browser = {
            template:       fs.readFileSync("test/template/browser.html", "utf8"),
            enable:         wm.browser,
            __MODULES__:    files.browser.map(_script_updir).join("\n"),
            __WMTOOLS__:    _script("wmtools.js"),
            __SOURCES__:    target.browser.source.map(_script_updir).join("\n"),
            __OUTPUT__:     _script_updir(target.browser.output),
            __TEST_CASE__:  _script("testcase.js"),
        };
    var worker = {
            template:       fs.readFileSync("test/template/worker.js", "utf8"),
            enable:         wm.worker,
            __MODULES__:    files.worker.map(_import_updir).join("\n    "),
            __WMTOOLS__:    _import("wmtools.js"),
            __SOURCES__:    target.worker.source.map(_import_updir).join("\n    "),
            __OUTPUT__:     _import_updir(target.worker.output),
            __TEST_CASE__:  _import("testcase.js"),
        };
    var node = {
            template:       fs.readFileSync("test/template/node.js", "utf8"),
            enable:         wm.node,
            __MODULES__:    files.node.map(_require_updir).join("\n"),
            __WMTOOLS__:    _require("./wmtools.js"),  // node.js require spec. add "./"
            __SOURCES__:    target.node.source.map(_require_updir).join("\n"),
            __OUTPUT__:     _require_updir(target.node.output),
            __TEST_CASE__:  _require("./testcase.js"), // node.js require spec. add "./"
        };
    var nw = {
            template:       fs.readFileSync("test/template/nw.html", "utf8"),
            enable:         wm.nw,
            __MODULES__:    files.nw.map(_script_updir).join("\n"),
            __WMTOOLS__:    _script("wmtools.js"),
            __SOURCES__:    target.nw.source.map(_script_updir).join("\n"),
            __OUTPUT__:     _script_updir(target.nw.output),
            __TEST_CASE__:  _script("testcase.js"),
        };

    browser.template = _mapping(browser, _ignoreNotationVariability(_migration(browser.template)));
    worker.template  = _mapping(worker,  _ignoreNotationVariability(_migration(worker.template)));
    node.template    = _mapping(node,    _ignoreNotationVariability(_migration(node.template)));
    nw.template      = _mapping(nw,      _ignoreNotationVariability(_migration(nw.template)));

    return { browser: browser.template, worker: worker.template, node: node.template, nw: nw.template };

    function _script(file)        { return '<script src="'      + file + '"></script>'; }
    function _script_updir(file)  { return '<script src="../'   + file + '"></script>'; }
    function _import(file)        { return 'importScripts("'    + file + '");'; }
    function _import_updir(file)  { return 'importScripts("../' + file + '");'; }
    function _require(file)       { return 'require("'          + file + '");'; }
    function _require_updir(file) { return 'require("../'       + file + '");'; }
}

function _mapping(res, template) {
    var enable    = res.enable;
    return template.replace("__MODULES__",   enable ? res.__MODULES__   : "").
                    replace("__WMTOOLS__",   enable ? res.__WMTOOLS__   : "").
                    replace("__SOURCES__",   enable ? res.__SOURCES__   : "").
                    replace("__OUTPUT__",    enable ? res.__OUTPUT__    : "").
                    replace("__TEST_CASE__", enable ? res.__TEST_CASE__ : "");
}

function _ignoreNotationVariability(template) { // ( fix typo :)
    return template.replace("__MODULE__",   "__MODULES__").
                    replace("__WMTOOL__",   "__WMTOOLS__").
                    replace("__SOURCE__",   "__SOURCES__").
                    replace("__OUTPUTS__",  "__OUTPUT__").
                    replace("__TESTCASE__", "__TEST_CASE__");
}

function _migration(template) {
    return template.replace("__SCRIPT__", "__MODULES__\n__WMTOOLS__\n__SOURCES__\n__OUTPUT__\n__TEST_CASE__");
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}

})(GLOBAL);


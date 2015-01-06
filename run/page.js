#!/usr/bin/env node

// page --verbose

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";

var fs    = require("fs");
var wmlib = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod   = require(wmlib + "Module.js");
var argv  = process.argv.slice(2);
var pkg   = JSON.parse(fs.readFileSync("package.json", "utf8"));
var verbose = argv[0] === "--verbose" || argv[0] === "-v";

_createTestPages();

function _createTestPages() {
    var releaseBuild = false;
    var deps = mod.getDependencies(releaseBuild);

    ["./test/wmtools.js"].forEach(function(js) {
        deps.files.browser.push(js);
        deps.files.worker.push(js);
        deps.files.node.push(js);
        deps.files.nw.push(js);
    });

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

    var browserScripts  = mod.toUniqueArray(files.browser.concat(target.browser.source).map(_script));
    var workerScripts   = mod.toUniqueArray(files.worker.concat(target.worker.source).map(_import));
    var nodeScripts     = mod.toUniqueArray(files.node.concat(target.node.source).map(_require));
    var nwScripts       = mod.toUniqueArray(files.nw.concat(target.nw.source).map(_script));

    browserScripts.push('<script src="../' + target.browser.output + '"></script>');
    browserScripts.push('<script src="./testcase.js"></script>');
    workerScripts.push('importScripts("../' + target.worker.output + '");');
    workerScripts.push('importScripts("./testcase.js");');
    nodeScripts.push('require("../' + target.node.output + '");');
    nodeScripts.push('require("./testcase.js");');
    nwScripts.push('<script src="../' + target.nw.output + '"></script>');
    nwScripts.push('<script src="./testcase.js"></script>');

    var browserTemplate = fs.readFileSync("test/template/browser.html", "utf8");
    var workerTemplate  = fs.readFileSync("test/template/worker.js", "utf8");
    var nodeTemplate    = fs.readFileSync("test/template/node.js", "utf8");
    var nwTemplate      = fs.readFileSync("test/template/nw.html", "utf8");

    browserTemplate = browserTemplate.replace("__SCRIPT__", wm.browser ? browserScripts.join("\n") : "");
    workerTemplate  = workerTemplate.replace("__SCRIPT__", wm.worker ? workerScripts.join("\n    ") : "");
    nodeTemplate    = nodeTemplate.replace("__SCRIPT__", wm.node ? nodeScripts.join("\n") : "");
    nwTemplate      = nwTemplate.replace("__SCRIPT__", wm.nw ? nwScripts.join("\n") : "");

    return { browser: browserTemplate, worker: workerTemplate, node: nodeTemplate, nw: nwTemplate };

    function _require(file) { return 'require("../' + file + '");'; }
    function _import(file)  { return 'importScripts("../' + file + '");'; }
    function _script(file)  { return '<script src="../' + file + '"></script>'; }
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}


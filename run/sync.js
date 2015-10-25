#!/usr/bin/env node

(function(global) {

// --- console colors ---
var ERR  = "\u001b[31m"; // RED
var WARN = "\u001b[33m"; // YELLOW
var INFO = "\u001b[32m"; // GREEN
var CLR  = "\u001b[0m";  // WHITE
var LB   = "\n";         // line break

var fs       = require("fs");
var cp       = require("child_process");
var readline = require("readline");
var wmlib    = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod      = require(wmlib + "ModuleSystem.js");
var Task     = require(wmlib + "Task.js");
var argv     = process.argv.slice(2);

var repositoryFullName = process.cwd().split("/").pop();
var repositoryName     = repositoryFullName.indexOf(".") >= 0
                       ? repositoryFullName.split(".").slice(0, -1).join(".")
                       : repositoryFullName;

var BASE_MODEL_DIR     = "BASE_MODEL/";
var sourceDir          = process.argv[1].split("/").slice(0, -2).join("/") + "/";
var targetDir          = process.cwd() + "/";
var sourcePacakgeJSON  = sourceDir + BASE_MODEL_DIR + "package.json";
var targetPackageJSON  = targetDir + "package.json";
var wmJSON             = JSON.parse(fs.readFileSync(sourceDir + "package.json", "UTF-8"));

console.log( INFO + "  - repositoryFullName:  " + repositoryFullName + CLR );       // "Foo.js"
console.log( INFO + "  - repositoryName:      " + repositoryName     + CLR );       // "Foo"
console.log( INFO + "  - copy source dir:     " + sourceDir          + CLR );       // "/Users/uupaa/oss/WebModule/"
console.log( INFO + "  - copy target dir:     " + targetDir          + CLR );       // "/Users/uupaa/oss/Foo.js/"
console.log( INFO + "  - source package.json: " + sourcePacakgeJSON  + CLR );       // "/Users/uupaa/oss/my/WebModule/BASE_MODEL/package.json"
console.log( INFO + "  - target package.json: " + targetPackageJSON  + CLR + LB );  // "/Users/uupaa/oss/my/Foo.js/package.json"

// --- sync tasks ---
if (1) {
    syncPackageJSON();
    upgradePackageJSON();
    sortPackageJSONKeys();
    prettyPrintPackageJSON();
    buildWMTools("./test/wmtools.js");
    migrateSourceCode();
}

console.log("  sync done.");

function buildWMTools(output) { // @arg PathString
    var libs = ["Reflection.js", "Console.js", "Valid.js", "Help.js", "Task.js", "Test.js"];
    var dir = "../WebModule/lib/";
    var js = libs.map(function(lib) {
            return fs.readFileSync(dir + lib, "UTF-8")
        }).join("\n");

    js = "// ['" + libs.join("', '") + "'].join()\n\n" + js;

    // overwrite if there is a difference in the old file.
    if (fs.existsSync(output)) {
        var oldjs = fs.readFileSync(output, "UTF-8");

        if (oldjs !== js) {
            fs.writeFileSync(output, js); // overwrite
        }
    } else {
        fs.writeFileSync(output, js);
    }
}

function prettyPrintPackageJSON() {
    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var txt = JSON.stringify(json, null, 2);

    txt = txt.replace(/: \[([^\]]*)\],/g, function(_, items) {
        return ': [' + items.trim().replace(/\s*\n+\s*/g, " ") + '],';
    });

    fs.writeFileSync(targetPackageJSON, txt);
}

// WebModule/BASE_MODEL/package.json sync to YOURWebModule/package.json
function syncPackageJSON() {
    // srcJSON = WebMdule/BASE_MODEL/package.json
    // tgtJSON = YOURWebModule/package.json
    var srcJSON = JSON.parse(fs.readFileSync(sourcePacakgeJSON, "UTF-8").replace(/REPOSITORY_FULLNAME/g, repositoryFullName));
    var tgtJSON = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var wmVersion = wmJSON.version;

    if (!tgtJSON.scripts) {
        tgtJSON.scripts = srcJSON.scripts;
    } else {
        // tgtJSON.script の順番を維持しつつ、コマンドを差し込めるように key と value の状態を保存する
        var tgtKeys   = Object.keys(tgtJSON.scripts);
        var tgtValues = _Object_values(tgtJSON.scripts);

        for (var command in srcJSON.scripts) { // command = "sync", "min", "build", ...
            var src = srcJSON.scripts[command];
            var tgt = tgtJSON.scripts[command] || "";

            if (!tgt || tgt === src) {
                // tgt にコマンドAが無いか
                // tgt と src が同じならそのまま上書きする
                tgtJSON.scripts[command] = src;

                tgtKeys.push(command);
                tgtValues.push(src);
            } else if (tgt && tgt !== src) {
                // tgt の package.json にコマンドAが存在し src の package.json にもコマンドAがあるが、内容が異なる場合は、
                // tgt のコマンドAを優先し、src のコマンドA を
                // { "A_${wmversion}": srcJSON.scripts[command] } の形で挿入する。
                // tgt のコマンドAは上書きしない。
                var pos = tgtKeys.indexOf(command);

                tgtKeys.splice( pos, 0, command + "_" + wmVersion);
                tgtValues.splice( pos, 0, src);

                console.log(INFO + "  - inject run-script: " + CLR + '     { "' + command + "_" + wmVersion + '": "' + src + '" }');
            }
        }
        tgtJSON.scripts = _buildNewObjectByKeyOrder(tgtKeys, tgtValues); // rebuild
    }

    fs.writeFileSync(targetPackageJSON, JSON.stringify(tgtJSON, null, 2));
}

function _Object_values(object) {
    var result = [];
    var keys = Object.keys(object);

    for (var i = 0, iz = keys.length; i < iz; ++i) {
        var key = keys[i];
        result.push( object[key] );
    }
    return result;
}

function _buildNewObjectByKeyOrder(keys, values) {
    var result = {};

    for (var i = 0, iz = keys.length; i < iz; ++i) {
        result[keys[i]] = values[i];
    }
    return result;
}

// package.json convert "x-build": { ... } to "webmodule": { ... }
function upgradePackageJSON() {
    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));

    json = mod.upgradePackageJSON(json);

    fs.writeFileSync(targetPackageJSON, JSON.stringify(json, null, 2));
}

function sortPackageJSONKeys() {
    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var order = ["name", "version", "description", "url", "keywords",
                 "repository", "scripts", "webmodule",
                 "dependencies", "devDependencies", "lib", "main",
                 "author", "license", "contributors"];

    var keys = Object.keys(json).sort(function(a, b) {
        var pos1 = order.indexOf(a);
        var pos2 = order.indexOf(b);

        if (pos1 < 0) { pos1 = 999; }
        if (pos2 < 0) { pos2 = 999; }

        return pos1 - pos2;
    });

    var result = {};
    keys.forEach(function(key) {
        result[key] = json[key];
    });

    fs.writeFileSync(targetPackageJSON, JSON.stringify(result, null, 2));
}

function migrateSourceCode() {
    var DEPRECATED_CODES = {
            "NODE":     /_runOnNode\s*\=\s*"process" in global/,
            "WORKER":   /_runOnWorker\s*\=\s*"WorkerLocation" in global/,
            "BROWSER":  /_runOnBrowser\s*\=\s*"document" in global/,
            "EXPORTS":  /if\s*\("process" in global\)\s*\{/
        };

    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var sources = ["test/testcase.js"];

    for (var key in json.webmodule) { // develop, label, browser, worker, node, nw, el, ...
        switch (key) {
        case "browser":
        case "worker":
        case "node":
        case "nw":
        case "el":
            sources = sources.concat(json.webmodule[key].source);
            break;
        }
    }
    sources = mod.toUniqueArray(sources);
    if (sources.length) {
        sources.forEach(function(file) {
            var js = fs.readFileSync(file, "UTF-8");

            dumpDeprecatedCode(file, js, DEPRECATED_CODES.NODE);
            dumpDeprecatedCode(file, js, DEPRECATED_CODES.WORKER);
            dumpDeprecatedCode(file, js, DEPRECATED_CODES.BROWSER);
            dumpDeprecatedCode(file, js, DEPRECATED_CODES.EXPORTS);
        });
    }

    function dumpDeprecatedCode(file, js, rex) {
        if (rex.test(js)) {
            js.split("\n").forEach(function(line, index) {
                if (rex.test(line)) {
                    console.log(WARN + "  Found deprecated code( " + file + ":" + index + " )" +
                                "\t" + rex.source.replace(/\\s\*/g, " ").replace(/\\/g, "") + CLR);

                }
            });
        }
    }
}

})(GLOBAL);


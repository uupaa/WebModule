#!/usr/bin/env node

var _USAGE = _multiline(function() {/*
    Usage:
        WebModule/run/init.js [-h or --help]
                              [-v or --verbose]
                              [--alt]
                              [--bin]
*/});

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";

// ---------------------------------------------------------
//  fileName                    [scan, sourceFileName]
var _CLONE_FILES = {
    "alt": {
        "REPOSITORY_NAME.ts":   [true],
    },
    "bin": {
        "REPOSITORY_NAME.js":   [true],
    },
    "lib": {
        "REPOSITORY_NAME.js":   [true],
    },
    "lint": {
        "plato": {
            "README.md":        [],
        }
    },
    "release": {
        "README.md":            [],
    },
    "test": {
        "template": {
            "browser.html":     [true],
            "node.js":          [true],
            "nw.html":          [true],
            "nw.package.json":  [true],
            "worker.js":        [true],
        },
        "testcase.js":          [true],
    },
    ".gitignore":               [],
    ".jshintrc":                [],
    ".npmignore":               [],
    ".travis.yml":              [true, "MODULE_travis.yml"],
    "index.js":                 [true, "MODULE_index.js"],
//  "LICENSE":                  [true, "MODULE_LICENSE"],
    "package.json":             [true, "MODULE_package.json"],
    "README.md":                [true, "MODULE_README.md"]
};

var fs       = require("fs");
var cp       = require("child_process");
var wmlib    = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var Task     = require(wmlib + "Task.js");
var readline = require("readline");
var argv     = process.argv.slice(2);

var repositoryFullName = process.cwd().split("/").pop();
var repositoryName     = repositoryFullName.indexOf(".") >= 0
                       ? repositoryFullName.split(".").slice(0, -1).join(".")
                       : repositoryFullName;

var fromDir            = process.argv[1].split("/").slice(0, -2).join("/") + "/";
var toDir              = process.cwd() + "/";

console.log(INFO + "  - repositoryFullName: " + repositoryFullName + CLR); // "Foo.js"
console.log(INFO + "  - repositoryName:     " + repositoryName     + CLR); // "Foo"
console.log(INFO + "  - copy source dir:    " + fromDir            + CLR); // "/Users/uupaa/oss/WebModule/"
console.log(INFO + "  - copy target dir:    " + toDir              + CLR + "\n"); // "/Users/uupaa/oss/Foo.js"

//return;

// -------------------------------------------------------------
var options = _parseCommandLineOptions({
        help:       false,      // Boolean - show help.
        verbose:    false,      // Boolean - verbose mode.
        alt:        false,      // Boolean - create alt directory.
        bin:        false,      // Boolean - create bin directory.
        desc:       "Module description.", // String - Module description.
    });

if (options.help) {
    console.log(WARN + _USAGE + CLR);
    return;
}

if (!options.alt) {
    delete _CLONE_FILES.alt;
}
if (!options.bin) {
    delete _CLONE_FILES.bin;
}

if (fs.existsSync("README.md") ) {
    options.desc = fs.readFileSync("README.md", "UTF-8").split("\n").slice(-2).join("").trim();
}

getGitHubUserName(function(userName) {

    options.userName = userName;
    _clone(fromDir, toDir, _CLONE_FILES, function() {
        console.log("  ");
        console.log(INFO + "  done." + CLR + "\n");
        console.log(INFO + "  Available next actions," + CLR);
        console.log(INFO + "  `$ npm run`        # list up npm run-script" + CLR);
        console.log(INFO + "  `$ npm start`      # start local httpd server" + CLR);
        console.log(INFO + "  `$ npm run sync`   # sync scripts, install/update node modules, create test pages and minify" + CLR);
    });

}, function(err) {
    console.error(ERR + "Error: git config --get user.name" + CLR);
});

// =========================================================
function getGitHubUserName(callback, errorCallback) {
    cp.exec("git config --get remote.origin.url", function(err, stdout, stderr) {
        if (err) {
            errorCallback(err);
        } else {
            var value = stdout.trim();
            var result = "";

            // HTTPS format // "https://github.com/uupaa/WMExample.js.git"
            // SSH   format //     "git@github.com:uupaa/WMExample.js.git"

            if (/^https/.test(value)) {
                result = value.split("github.com/"    )[1].split("/")[0];
            } else if (/^git@github.com/.test(value)) {
                result = value.split("git@github.com:")[1].split("/")[0];
            }
            callback(result);
        }
    });
}

function _clone(fromDir,    // @arg String - copy from dir. has tail slash(/)
                toDir,      // @arg String - copy to dir. has tail slash(/)
                fileTree,   // @arg Object - source file tree.
                callback) { // @arg Function - finished callback.

    var overwriteFiles = []; // [ [targetFile, sourceText], ... ]

    _doClone(overwriteFiles, fromDir, toDir, fileTree);

    if (overwriteFiles.length) {
        var rl = readline.createInterface(process.stdin, process.stdout);
        Task.loop(overwriteFiles, _tick, function() {
            rl.close();
            callback();
        });

        function _tick(task, index, overwriteFiles) {
            var ary = overwriteFiles[index];
            var targetFile = ary[0];
            var sourceText = ary[1];

            rl.question("  exists:    " + targetFile + " - overwrite it? (y/n): ",
                       function(answer) {

                if (/^y$/i.test(answer)) {
                    console.log(WARN + "  overwrite: " + targetFile + CLR);
                    fs.writeFileSync(targetFile, sourceText);
                } else {
                    console.log("  skip:      " + targetFile);
                }
                task.pass();
            });
        }
    } else {
        callback();
    }
}

function _doClone(overwriteFiles, fromDir, toDir, fileTree) {
    for (fileName in fileTree) {
        _loop(overwriteFiles, fileName, fileTree);
    }

    function _loop(overwriteFiles, // @arg FileStringArray - ["file", ...]
                   fileName,       // @arg FileNameString|DirNameString - "MODULE_README.md", "lib"
                   fileTree) {     // @arg Object - _CLONE_FILES or _CLONE_FILES subtree.
        var options        = fileTree[fileName]; // [scan, sourceFileName]
        var scan           = options[0] || false;
        var sourceFileName = options[1] || "";
        var isFileEntry    = Array.isArray(options);

        if ( !isFileEntry ) { // is directory entry
            if ( !fs.existsSync(toDir + fileName) ) {
                console.log("  mkdir:     " + toDir + fileName + "/");
                fs.mkdirSync(toDir + fileName);
            }
            // recursive call
            _doClone(overwriteFiles,
                     fromDir + fileName + "/",
                     toDir   + fileName + "/",
                     fileTree[fileName]);

        } else {
            var sourceFile = fromDir + (sourceFileName || fileName);
            var targetFile = toDir   + fileName;

            // replace fileName. "lib/REPOSITORY_NAME.js" -> "lib/Foo.js"
            targetFile = _repleaceText(targetFile);

            var targetFileAlreadyExists = fs.existsSync(targetFile);
            var sourceText = fs.readFileSync(sourceFile, "UTF-8");
            var targetText = targetFileAlreadyExists ? fs.readFileSync(targetFile, "UTF-8") : "";

            if (scan) {
                sourceText = _repleaceText(sourceText);
            }
            if (targetText && targetText !== sourceText) {
                overwriteFiles.push([targetFile, sourceText]);
            } else {
                if (targetFileAlreadyExists) {
                    console.log("  overwrite: " + targetFile);
                } else {
                    console.log("  clone:     " + targetFile);
                }
                fs.writeFileSync(targetFile, sourceText);
            }
        }
    }

    function _repleaceText(text) {
        text = text.replace(/DESCRIPTION/g,               options.desc);                     // "description"
        text = text.replace(/GITHUB_USER_NAME/g,          options.userName);                 // "uupaa"
        text = text.replace(/LOWER_REPOSITORY_FULLNAME/g, repositoryFullName.toLowerCase()); // "foo.js"
        text = text.replace(/LOWER_REPOSITORY_NAME/g,     repositoryName.toLowerCase());     // "foo"
        text = text.replace(/REPOSITORY_FULLNAME/g,       repositoryFullName);               // "Foo.js"
        text = text.replace(/REPOSITORY_NAME/g,           repositoryName);                   // "Foo"
        text = text.replace(/WEBMODULE_IDIOM/g,           "(this || 0).self || global");

        return text;
    }
}

function _parseCommandLineOptions(options) { // @arg Object:
                                             // @ret Object:
    for (var i = 0, iz = argv.length; i < iz; ++i) {
        switch (argv[i]) {
        case "-h":
        case "--help":      options.help = true; break;
        case "-v":
        case "--verbose":   options.verbose = true; break;
        case "--alt":       options.alt = true; break;
        case "--bin":       options.bin = true; break;
        }
    }
    return options;
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}


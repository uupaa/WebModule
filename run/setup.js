#!/usr/bin/env node

(function(global) {

var _USAGE = _multiline(function() {/*
    Usage:
        WebModule/run/setup.js [-h or --help]
                               [-v or --verbose]
                               [--alt]
                               [--bin]
*/});

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";


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

var BASE_MODEL_DIR  = "BASE_MODEL/";
var copySourceDir   = process.argv[1].split("/").slice(0, -2).join("/") + "/";
var copyTargetDir   = process.cwd() + "/";
var fileTree        = JSON.parse(fs.readFileSync(copySourceDir + BASE_MODEL_DIR + ".files.json", "UTF-8"));

console.log(INFO + "  - repositoryFullName: " + repositoryFullName + CLR);        // "Foo.js"
console.log(INFO + "  - repositoryName:     " + repositoryName     + CLR);        // "Foo"
console.log(INFO + "  - copy source dir:    " + copySourceDir      + CLR);        // "/Users/uupaa/oss/WebModule/"
console.log(INFO + "  - copy target dir:    " + copyTargetDir      + CLR + "\n"); // "/Users/uupaa/oss/Foo.js"

//console.log(JSON.stringify(fileTree, null, 2));

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
    delete fileTree.alt;
}
if (!options.bin) {
    delete fileTree.bin;
}

if (fs.existsSync("README.md") ) {
    options.desc = fs.readFileSync("README.md", "UTF-8").split("\n").slice(-2).join("").trim();
}

getGitHubUserName(function(userName) {

    options.userName = userName;
    _clone(copySourceDir + BASE_MODEL_DIR, copyTargetDir, fileTree, function() {
        console.log("  ");
        console.log(INFO + "  done." + CLR + "\n");
        console.log(INFO + "  You can be next actions." + CLR);
        console.log(INFO + "  `$ npm run`        # Dump all WebModule commands" + CLR);
        console.log(INFO + "  `$ npm start`      # Start local http server" + CLR);
        console.log(INFO + "  `$ npm run sync`   # Update npm modules" + CLR);
        console.log(INFO + "  `$ npm t`          # Minify and Test" + CLR);
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

function _clone(copySourceDir,  // @arg String - copy from dir. has tail slash(/)
                copyTargetDir,  // @arg String - copy to dir. has tail slash(/)
                fileTree,       // @arg Object - source file tree.
                callback) {     // @arg Function - finished callback.

    var overwriteFiles = []; // [ [targetFile, sourceText], ... ]

    _doClone(overwriteFiles, copySourceDir, copyTargetDir, fileTree);

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

            rl.question("  exists:    " + targetFile + " - overwrite it? (y/n): ", function(answer) {

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

function _doClone(overwriteFiles, copySourceDir, copyTargetDir, fileTree) {

    for (fileName in fileTree) {
        _loop(overwriteFiles, fileName, fileTree);
    }

    function _loop(overwriteFiles, // @arg FileStringArray - ["file", ...]
                   name,           // @arg FileNameString|DirNameString - "README.md", "lib", ...
                   fileTree) {     // @arg Object - _CLONE_FILES or _CLONE_FILES subtree.
        var options     = fileTree[name]; // [ scan ]
        var scan        = Array.isArray(options) && options.indexOf("scan") >= 0;
        var disable     = Array.isArray(options) && options.indexOf("disable") >= 0;
        var isDirEntry  = !Array.isArray(options); // dir is {}, file is []

        if (disable) {
            console.log("  disable:   " + _repleaceText(copyTargetDir + name));
            return;
        }
        if (isDirEntry) {
            if ( !fs.existsSync(copyTargetDir + name) ) {
                console.log("  mkdir:     " + copyTargetDir + name + "/");
                fs.mkdirSync(copyTargetDir + name);
            }
            // recursive call
            _doClone(overwriteFiles,
                     copySourceDir + name + "/",
                     copyTargetDir + name + "/",
                     fileTree[name]);

        } else {
            var sourceFile = copySourceDir + name;
            var targetFile = _repleaceText(copyTargetDir + name); // replace file name. "lib/REPOSITORY_NAME.js" -> "lib/Foo.js"
            var fileExists = fs.existsSync(targetFile);
            var sourceText = fs.readFileSync(sourceFile, "UTF-8");
            var targetText = fileExists ? fs.readFileSync(targetFile, "UTF-8") : "";

            if (scan) {
                sourceText = _repleaceText(sourceText);
            }
            if (targetText && targetText !== sourceText) {
                overwriteFiles.push([targetFile, sourceText]);
            } else {
                if (fileExists) {
                    console.log("  exists:    " + targetFile);
                } else {
                    console.log("  clone:     " + targetFile);
                    fs.writeFileSync(targetFile, sourceText);
                }
            }
        }
    }

    function _repleaceText(text) {
        text = text.replace(/<<DESCRIPTION>>/g,               options.desc);                     // "description"
        text = text.replace(/<<GITHUB_USER_NAME>>/g,          options.userName);                 // "uupaa"
        text = text.replace(/<<LOWER_REPOSITORY_FULLNAME>>/g, repositoryFullName.toLowerCase()); // "foo.js"
        text = text.replace(/<<LOWER_REPOSITORY_NAME>>/g,     repositoryName.toLowerCase());     // "foo"
        text = text.replace(/<<REPOSITORY_FULLNAME>>/g,       repositoryFullName);               // "Foo.js"
        text = text.replace(/REPOSITORY_FULLNAME/g,           repositoryFullName);               // "Foo.js"
        text = text.replace(/<<REPOSITORY_NAME>>/g,           repositoryName);                   // "Foo"
        text = text.replace(/__REPOSITORY_NAME__/g,           _spacer(repositoryName.length));   // "Foo"
        text = text.replace(/REPOSITORY_NAME/g,               repositoryName);                   // "Foo"

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

function _spacer(n) { // @arg Integer
                      // @ret String
    return "                                  ".slice(0, n);
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}

})(GLOBAL);


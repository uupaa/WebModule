#!/usr/bin/env node

(function(global) {

// Usage: WebModule/run/add-src.js NewClass.js

var ERR  = "\u001b[31m";
var WARN = "\u001b[33m";
var INFO = "\u001b[32m";
var CLR  = "\u001b[0m";

var fs       = require("fs");
var argv     = process.argv.slice(2);
var srcName  = argv[0]; // "NewClass.js"
var className= argv[0].replace(/\.js$/, ""); // "NewClass"

var BASE_MODEL_DIR     = "BASE_MODEL/";
var sourceDir          = process.argv[1].split("/").slice(0, -2).join("/") + "/";
var targetDir          = process.cwd() + "/";
var targetPackageJSON  = require(targetDir + "package.json");
var GITHUB_USER_NAME   = targetPackageJSON.repository.url.split("/")[3];
var sourceCode         = fs.readFileSync(sourceDir + BASE_MODEL_DIR + "/lib/REPOSITORY_NAME.js", "UTF-8");
var targetPath         = targetDir + "lib/" + srcName;


if ( !/\.js$/.test(srcName) ) {
    console.log(ERR + "  The file name must have .js extension. " + CLR);
    return;
}
if ( fs.existsSync(targetPath) ) {
    console.log(ERR + "  The file already exists. " + CLR + targetPath);
    return;
}
fs.writeFileSync(targetPath, _repleaceText(sourceCode), "utf-8");

console.log(INFO + "  Add source: " + targetPath + CLR);

// -------------------------------------------------------------
function _repleaceText(text) {
    text = text.replace(/<<GITHUB_USER_NAME>>/g, GITHUB_USER_NAME);            // "uupaa"
    text = text.replace(/<<REPOSITORY_NAME>>/g,  className);                   // "Foo"
    text = text.replace(/__REPOSITORY_NAME__/g,  _spacer(className.length));   // "Foo"

    return text;
}

function _spacer(n) { // @arg Integer
                      // @ret String
    return "                                  ".slice(0, n);
}

})(GLOBAL);


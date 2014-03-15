
var fs = require("fs");
var Process = require("child_process");

var command = "plato --title Zzz.js --jshint .jshintrc -d lint/plato lib/Zzz.js";

Process.exec(command, function(err, stdout, stderr) {
                console.log(command);

                _parseHistoryJS();
                _parseHistoryJSON();
                _parseReportJS();
                _parseReportJSON();
             });

// ---------------------------------------------------------
function _parseHistoryJS() {
    var fileName = "./lint/plato/report.history.js";
    _write(fileName, "__history = ", _load(fileName), "");
}
function _parseHistoryJSON() {
    var fileName = "./lint/plato/report.history.json";
    _write(fileName, "", _load(fileName), "");
}

function _parseReportJS() {
    var fileName = "./lint/plato/report.js";
    _write(fileName, "__report = ", _sort(_load(fileName)), "");
}
function _parseReportJSON() {
    var fileName = "./lint/plato/report.json";
    _write(fileName, "", _sort(_load(fileName)), "");
}


function _load(fileName) {
    if (/\.json$/.test(fileName)) {
        return JSON.parse( fs.readFileSync(fileName, "utf8") );
    } else if (/\.js$/.test(fileName)) {
        return eval("(" + fs.readFileSync(fileName, "utf8") + ")");
    }
    return fs.readFileSync(fileName, "utf8");
}

function _sort(json) {
    var result = {};
    var keys = Object.keys(json).sort();

    for (var i = 0, iz = keys.length; i < iz; ++i) {
        result[keys[i]] = json[keys[i]];
    }
    return result;
}

function _write(fileName, prefix, json, postfix) {
    fs.writeFileSync(fileName, prefix + JSON.stringify(json, null, 2) + postfix + "\n");
}


// Reflection.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _isNodeOrNodeWebKit = !!global.global;
//var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
//var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
//var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
//var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

var IGNORE_KEYWORDS = [
        "webkitStorageInfo",
        "Infinity",
        "NaN",
        "arguments",
        "caller",
        "callee",
        "buffer",
        "byteOffset",
        "byteLength", // DataView, ArrayBuffer, Float32Array, ...
        "length",
        "String.prototype.help",
        "Function.prototype.help",
        "MediaError",
    ];
var _syntaxHighlightData = {
        matcher:  null, // /^\W(function|var|...|with)\W$/
        keywords: null  // /\\[^\n]+|.../
    };
var ES6_SYNTAX_KEYWORDS = [
        "\/\/[^\n]+",       // // comment
        "\/[^\n\/]+\/",     // /regexp/
        "\"[^\n\"]*\"",     // "string"
        "\'[^\n\']*\'"      // 'string'
    ];
var ES6_IDENTIFY_KEYWORD =
        "function|var|this|self|that|if|else|in|typeof|instanceof|null|undefined|" +
        "try|catch|throw|finally|switch|case|default|for|while|do|break|continue|" +
        "return|new|debugger|void|delete|" +
        "enum|class|super|extends|implements|interface|private|protected|package|" +
        "static|public|export|import|yield|let|const|with";

// --- class / interfaces ----------------------------------
function Reflection() {
}

Reflection["lang"] = ""; // Reference language. "", "en", "ja"

Reflection["addIgnoreKeyword"]      = Reflection_addIgnoreKeyword;      // Reflection.addIgnoreKeyword(keywords:StringArray):void

// --- path ---
Reflection["resolve"]               = Reflection_resolve;               // Reflection.resolve(target:Function|String):Object
// --- module ---
Reflection["getModuleRepository"]   = Reflection_getModuleRepository;   // Reflection.getModuleRepository(moduleName:String):String
// --- class ---
Reflection["getBaseClassName"]      = Reflection_getBaseClassName;      // Reflection.getBaseClassName(value):String
Reflection["getConstructorName"]    = Reflection_getConstructorName;    // Reflection.getConstructorName(value):String
// --- function ---
Reflection["getFunctionAttribute"]  = Reflection_getFunctionAttribute;  // Reflection.getFunctionAttribute(target:Function, name:String = "all"):Object
// --- link ---
Reflection["getSearchLink"]         = Reflection_getSearchLink;         // Reflection.getSearchLink(path:String):Object
Reflection["getReferenceLink"]      = Reflection_getReferenceLink;      // Reflection.getReferenceLink(path:String):Object
// --- syntax highlight ---
Reflection["syntaxHighlight"]       = Reflection_syntaxHighlight;       // Reflection.syntaxHighlight(code:String, highlight:String, target:String = "console", style:Object = {}):StringArray

// --- implements ------------------------------------------
function Reflection_addIgnoreKeyword(keywords) { // @arg StringArray
                                                 // @desc add ignore keywords.
    Array.prototype.push.apply(IGNORE_KEYWORDS, keywords);
}

function Reflection_resolve(target) { // @arg Function|String target function - Object.freeze or "Object.freeze"
                                      //                                        callback(detach:Boolean):void
                                      // @ret Object - { path, fn }
                                      // @return.path String - function absoulute path. eg: ["Object", "freeze"]
                                      // @return.fn Function - function. eg: Object.freeze
                                      // @desc resolve function absolute path.

//{@dev
    if (!/function|string/.test(typeof target)) {
        throw new Error("Reflection.resolve(target): target is not Function or String.");
    }
//}@dev

    switch (typeof target) {
    case "function":
        return { "path": _convertFunctionToPathString(target), "fn": target };
    case "string":
        target = _extractSharp(target);
        return { "path": target, "fn": _convertPathStringToFunction(target) };
    }
    return { "path": "", "fn": null };
}

function _convertPathStringToFunction(target) { // @arg String        - function path.  "Object.freeze"
                                                // @ret Function|null - function object. Object.freeze
    return target.split(".").reduce(function(parent, token) {
                return ( parent && (token in parent) ) ? parent[token]
                                                       : null;
            }, global);
}

function _convertFunctionToPathString(target) { // @arg Function - function object. Object.freeze
                                                // @ret String   - function path.  "Object.freeze"
    var path = "";
    var globalIdentities = _enumKeys(global).sort();

    globalIdentities.unshift("Object", "Function", "Array", "String", "Number"); // inject

    for (var i = 0, iz = globalIdentities.length; i < iz && !path; ++i) {
        var className = globalIdentities[i];

        if ( IGNORE_KEYWORDS.indexOf(className) < 0 &&
             global[className] !== null &&
             /object|function/.test(typeof global[className]) ) {

            var klass = global[className];

            if (klass === target) {
                path = className;
            } else {
                path = _findClassMember(target, className, _enumKeys(klass));

                if ( !path && ("prototype" in klass) ) {
                    path = _findPropertyMember(target, className,
                                               _enumKeys(klass["prototype"]));
                }
            }
        }
    }
    return path.replace(/^global\./i, "");
}

function _enumKeys(object) {
    return (Object["getOwnPropertyNames"] || Object["keys"])(object);
}

function _findClassMember(target, className, keys) {
    for (var i = 0, iz = keys.length; i < iz; ++i) {
        var key = keys[i];
        var path = className + "." + key;

        try {
            if (IGNORE_KEYWORDS.indexOf(path) < 0 &&
                IGNORE_KEYWORDS.indexOf(key)  < 0) {

                if (global[className][key] === target) {
                    return path; // resolved
                }
            }
        } catch (o_o) {}
    }
    return "";
}

function _findPropertyMember(target, className, keys) {
    for (var i = 0, iz = keys.length; i < iz; ++i) {
        var key = keys[i];
        var path = className + ".prototype." + key;

        try {
            if (IGNORE_KEYWORDS.indexOf(path) < 0 &&
                IGNORE_KEYWORDS.indexOf(key)  < 0) {

                if (global[className]["prototype"][key] === target) {
                    return path; // resolved
                }
            }
        } catch (o_o) {}
    }
    return "";
}

function Reflection_getFunctionAttribute(target, // @arg Function
                                         name) { // @arg String = "all"
                                                 // @ret Object - { attrName: { name, type, optional, comment }, ... }
    var result = {};
    var sourceCode = target + "";
    var head = _splitFunctionDeclaration(sourceCode)["head"]; // { head, body }

    switch (name || "all") {
    case "all":
        _getArg(head, result);
        _getRet(head, result);
        break;
    case "arg":
        _getArg(head, result);
        break;
    case "ret":
        _getRet(head, result);
        break;
    }
    return result;
}

function _getArg(head,     // @arg StringArray - [line, ...]
                 result) { // @arg Object
                           // @ret Object - result + { "arg": [{ name, type, optional, comment }, ...] }
    // get @arg attribute.
    //
    //      function Foo_add(name,     // @arg Function|String = ""   comment
    //                       key   ) { // @arg String                 comment
    //                                 // @ret ResultType             comment
    //                       ~~~~~             ~~~~~~~~~~~~~~~   ~~   ~~~~~~~
    //                       name              type              opt  comment
    //      }

    result["arg"] = [];

    var format = /^([\w\|\/,]+)\s*(=\s*("[^"]*"|'[^']*'|\S+))?\s*([^\n]*)$/;

    head.forEach(function(line, lineNumber) {
        if (/@arg|@var_args/.test(line)) {
            if (lineNumber === 0) {
                line = _removeFunctionDeclarationString(line);
            }
            var nameType = line.split(/@arg|@var_args/);
            var name     = nameType[0].replace(/\W+/g, "").trim();
            var type     = "";
            var optional = "";
            var comment  = "";
            var token    = format.exec(nameType[1].trim());

            if (token) {
                type     = token[1];
                optional = token[3] || "";
                comment  =(token[4] || "").replace(/^[ :#\-]+/, "");
            }
            result["arg"].push({ "name": name, "type": type,
                                 "optional": optional, "comment": comment });
        }
    });
    return result;
}

function _getRet(head,     // @arg StringArray - [line, ...]
                 result) { // @arg Object
                           // @ret Object - { "ret": { types, comment }, ... }
    // get @ret attribute.
    //
    //      function Foo_add(name,     // @arg Function|String = ""   comment
    //                       key   ) { // @arg String                 comment
    //                                 // @ret ResultType             comment
    //                                         ~~~~~~~~~~~~~~~        ~~~~~~~
    //                                         type                   comment
    //      }

    result["ret"] = [];

    var format = /^([\w\|\/,]+)\s+([^\n]*)$/;

    head.forEach(function(line, lineNumber) {
        if (/@ret/.test(line)) {
            if (lineNumber === 0) {
                line = _removeFunctionDeclarationString(line);
            }
            var typeComment = line.split(/@ret/); // -> ["  //   ", " ResultType comment"]
            var type    = "";
            var comment = "";
            var token   = format.exec(typeComment[1].trim());

            if (token) {
                type    = token[1];
                comment = token[2];
            }
            result["ret"].push({ "type": type, "comment": comment });
        }
    });
    return result;
}

function _splitFunctionDeclaration(sourceCode) { // @arg String - function code
                                                 // @ret Object - { head:StringArray, body:StringArray }
    //
    //  sourceCode:
    //
    //      "function foo() { // @ret String\n
    //          return '';\n
    //      }"
    //
    //  result: {
    //      head: [
    //          "function foo() { // @ret String"
    //      ],
    //      body: [
    //          "    return '';",
    //          "}"
    //      ]
    //  }
    //
    var code = sourceCode.trim();
    var lines = code.split("\n");
    var x = lines[0].indexOf("//");
    var i = 0, iz = lines.length;

    if (x >= 10) {
        for (; i < iz; ++i) {
            if (lines[i].indexOf("//") !== x) {
                break;
            }
        }
    }
    return { "head": lines.slice(0, i), "body": lines.slice(i) };
}

function _removeFunctionDeclarationString(sourceCode) { // @arg String
                                                        // @ret String
    //
    //  sourceCode:
    //      "function xxx(...) { }"
    //
    //  result:
    //                  "(...) { }"
    //
    return sourceCode.replace(/^function\s+[^\x28]+/, "");
}

function _extractSharp(path) { // @arg String - "Array#forEach"
                               // @ret String - "Array.prototype.forEach"
    return path.trim().replace("#", ".prototype.");
}

function Reflection_getModuleRepository(moduleName) { // @arg String - path. "Reflection"
                                                      // @ret String
                                                      // @desc get WebModule repository url.
    if (moduleName in global) {
        var repository = global[moduleName]["repository"] || "";

        if (repository) {
            return repository.replace(/\/+$/, ""); // trim tail slash
        }
    }
    return ""; // global[moduleName] not found
}

function Reflection_getSearchLink(path) { // @arg String - "Object.freeze"
                                          // @ret Object - { title:String, url:URLString }
                                          // @desc get Google search link.
    //
    //  Google Search( Array.isArray ):
    //      http://www.google.com/search?lr=lang_ja&ie=UTF-8&oe=UTF-8&q=Array.isArray
    //
    return {
        "title": "Google Search( " + path + " ):",
        "url":   _createGoogleSearchURL(path)
    };
}

function _createGoogleSearchURL(keyword) { // @arg String - search keyword.
                                           // @ret String - "http://..."
    return "http://www.google.com/search?lr=lang_" +
                _getLanguage() + "&q=" +
                encodeURIComponent(keyword);
}

function Reflection_getReferenceLink(path) { // @arg String - "Object.freeze"
                                             // @ret Object - { title:String, url:URLString }
                                             // @desc get JavaScript/WebModule reference link.
    var className  = path.split(".")[0] || "";       // "Array.prototype.forEach" -> ["Array", "prototype", "forEach"] -> "Array"
    var repository = Reflection_getModuleRepository(className); // "https://github.com/uupaa/Help.js"

    //
    //  JavaScript API( Array.isArray ) Reference:
    //      http://www.google.com/search?btnI=I%27m+Feeling+Lucky&lr=lang_ja&ie=UTF-8&oe=UTF-8&q=MDN%20Array.isArray
    //
    //  WebModule Reference:
    //      https://github.com/uupaa/PageVisibilityEvent.js/wiki/PageVisibilityEvent#
    //
    if (/native code/.test(global[className] + "")) {
        return {
            "title": "JavaScript Reference( " + path + " ):",
            "url":   _createGoogleImFeelingLuckyURL(path, "MDN")
        };
    } else if (repository && /github/i.test(repository)) {
        return {
            "title": "WebModule Reference:",
            "url":   _createGitHubWikiURL(repository, className, path)
        };
    }
    return null;
}

function _createGoogleImFeelingLuckyURL(keyword,    // @arg String - search keyword.
                                        provider) { // @arg String - search providoer.
                                                    // @ret String - "http://..."
                                                    // @desc create I'm feeling lucky url
    return "http://www.google.com/search?btnI=I%27m+Feeling+Lucky&lr=lang_" +
                _getLanguage() + "&q=" + provider + "%20" +
                encodeURIComponent(keyword);
}

function _createGitHubWikiURL(baseURL,      // @arg String - "http://..."
                              wikiPageName, // @arg String - "Foo"
                              hash) {       // @arg String - "Foo#add"
    // replace characters
    //      space    -> "-"
    //      hyphen   -> "-"
    //      underbar -> "_"
    //      alphabet -> alphabet
    //      number   -> number
    //      other    -> ""
    //      unicode  -> encodeURIComponent(unicode)
    hash = hash.replace(/[\x20-\x7e]/g, function(match) {
                var result = / |-/.test(match) ? "-"
                           : /\W/.test(match)  ? ""
                           : match;

                return result;
            });

    // {baseURL}/wiki/{wikiPageName} or
    // {baseURL}/wiki/{wikiPageName}#{hash}
    var result = [];

    result.push( baseURL.replace(/\/+$/, ""), // remove tail slash
                 "/wiki/",
                 wikiPageName + "#" );

    if (wikiPageName !== hash) {
        result.push( "wiki-", encodeURIComponent(hash.toLowerCase()) );
    }
    return result.join("");
}

function _getLanguage() { // @ret String - "en", "ja" ...
    if (Reflection["lang"]) {
        return Reflection["lang"];
    }
    if (global["navigator"]) {
        return global["navigator"]["language"];
    }
    return "en";
}

function Reflection_getBaseClassName(value) { // @arg Any - instance, exclude null and undefined.
                                              // @ret String
    // Object.prototype.toString.call(new Error());     -> "[object Error]"
    // Object.prototype.toString.call(new TypeError()); -> "[object Error]"
    return Object.prototype.toString.call(value).split(" ")[1].slice(0, -1); // -> "Error"
}

function Reflection_getConstructorName(value) { // @arg Any - instance, exclude null and undefined.
                                                // @ret String
    // Reflection_getConstructorName(new (function Aaa() {})); -> "Aaa"
    return value.constructor["name"] ||
          (value.constructor + "").split(" ")[1].split("\x28")[0]; // for IE
}

function Reflection_syntaxHighlight(code,      // @arg String             - source code
                                    highlight, // @arg String             - highlight keyword
                                    target,    // @arg String = "console" - target environment.
                                    style) {   // @arg Object = {}        - { syntax, comment, literal, highlight }
                                               // @style.syntax    CSSStyleTextString = "color:#03f"
                                               // @style.comment   CSSStyleTextString = "color:#3c0"
                                               // @style.literal   CSSStyleTextString = "color:#f6c"
                                               // @style.highlight CSSStyleTextString = "background:#ff9;font-weight:bold"
                                               // @ret StringArray
    switch (target || "console") {
    case "console":
        return _syntaxHighlightForConsole(code, highlight, style || {});
    }
    return [];
}

function _syntaxHighlightForConsole(code, highlight, style) {
    var styleSyntax    = style["syntax"]    || "color:#03f";
    var styleComment   = style["comment"]   || "color:#3c0";
    var styleLiteral   = style["literal"]   || "color:#f6c";
    var styleHighlight = style["highlight"] || "background:#ff9;font-weight:bold";
    var highlightData  = _createSyntaxHighlightData();

    var styleDeclaration = [];
    var rexSource = highlight ? (highlight + "|" + highlightData.keyword.join("|"))
                              :                    highlightData.keyword.join("|");
    var rex = new RegExp("(" + rexSource + ")", "g");
    var body = ("\n" + code + "\n").replace(/%c/g, "% c").
                                    replace(rex, function(_, match) {
                if (match === highlight) {
                    styleDeclaration.push(styleHighlight, "");
                    return "%c" + highlight + "%c";
                } else if (/^\/\/[^\n]+$/.test(match)) {
                    styleDeclaration.push(styleComment, "");
                    return "%c" + match + "%c";
                } else if (/^(\/[^\n\/]+\/|\"[^\n\"]*\"|\'[^\n\']*\')$/.test(match)) {
                    styleDeclaration.push(styleLiteral, "");
                    return "%c" + match + "%c";
                } else if (highlightData.matcher.test(match)) {
                    styleDeclaration.push(styleSyntax, "");
                    return "%c" + match + "%c";
                }
                return match;
            }).trim();
    return [body].concat(styleDeclaration);
}

function _createSyntaxHighlightData() {
    if (!_syntaxHighlightData.matcher) { // cached?
        _syntaxHighlightData.matcher =
                new RegExp("^\\W(" + ES6_IDENTIFY_KEYWORD + ")\\W$");
        _syntaxHighlightData.keyword = [].concat(ES6_SYNTAX_KEYWORDS,
                ES6_IDENTIFY_KEYWORD.split("|").map(function(keyword) {
                    return "\\W" + keyword + "\\W";
                }));
    }
    return _syntaxHighlightData;
}

// --- validate / assertions -------------------------------
//{@dev
//function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
//function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Reflection;
}
global["Reflection"] = Reflection;

})((this || 0).self || global);


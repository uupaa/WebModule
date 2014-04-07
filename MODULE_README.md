=========
Zzz.js
=========

Zzz.js description.

# Document

- https://github.com/uupaa/Zzz.js/wiki/Zzz
- https://github.com/uupaa/WebModule, [slide](http://uupaa.github.io/Slide/slide/WebModule/index.html)
- https://github.com/uupaa/Help.js, [slide](http://uupaa.github.io/Slide/slide/Help.js/index.html)

# How to use

```js
<script src="lib/Zzz.js">
<script>
// for Browser
console.log( Zzz() );
</script>
```

```js
// for WebWorkers
importScripts("lib/Zzz.js");

console.log( Zzz() );
```

```js
// for Node.js
var Zzz = require("lib/Zzz.js");

console.log( Zzz() );
```

# for Developers

1. Install development dependency tools

    ```sh
    $ brew install closure-compiler
    $ brew install node
    $ npm install -g plato
    ```

2. Clone Repository and Install

    ```sh
    $ git clone git@github.com:uupaa/Zzz.js.git
    $ cd Zzz.js
    $ npm install
    ```

3. Build and Minify

    `$ npm run build`

4. Test

    `$ npm run test`

5. Lint

    `$ npm run lint`

6. Perf

    http://jsperf.com/uupaa-zzz/


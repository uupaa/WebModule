WebModule
=========

The WebModule is module template for Mobile Web Application.

# Document

https://github.com/uupaa/WebModule/wiki/WebModule

# How to use

1. Clone WebModule to your work space, and add permission to the clone command.

    ```sh
    $ git clone git@github.com:uupaa/WebModule.git
    $ chmod +x WebModule/clone
    ```

2. Create new repository 'MyModule.js' in the GitHub and clone it.

    ```sh
    $ git clone git@github.com:uupaa/MyModule.js.git
    $ cd MyModule.js
    ```

3. Execute clone command.

    ```sh
    $ pwd
    > MyModule.js
    $ ../WebModule/clone USER_NAME
    ```

=========
Zzz.js
=========

Zzz.js description.

# Document

https://github.com/uupaa/Zzz.js/wiki/Zzz.js

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
    $ npm install -g typescript
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


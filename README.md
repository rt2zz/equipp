Remander
======

Extensible node.js server.
@TODO move server component into eqi
Work in progress...

## Overview
Create a server
```js
var Remander = require('remander')
var server = new Remander()
```

Extend the server with "Extensions".
```js
server.extend(require('eqauth'), {key: 'user'})
```

Setup plugins.
```js
server.plugin(require('./plugins/user'))
```

For more usage details see the eqi server

equipt
======

node.js server framework inspired by Hapi.

Work in Progress...

### server.route
```js
server.route({
  path: 'user/:id',
  pre: [...]
  handler: function(request, reply){ ... }
})
```

### request object
as with many frameworks equip defines its own request object.
```js
request.raw.request //vanilla node request
request.raw.response //vanilla node response
request.reply //equipt reply object
request.pre //pre-handler data is loaded onto this object
```

### pre-handlers
Pre handlers are declared with a nested array syntax.  They can be put on the server itself for all requests or on individual routes via teh route.pre property.
```js

server.pre([
    //run in series
    {series1: dummyHandler}, //the remand of 'foo' from dummyHandler will be mapped onto request.pre.series1.
    [
      {parallel1: dummyHandler}, //elements of nested arrays run in parallel.
      {parallel2: dummyHandler}
    ]
  ])

function dummyHandler(request, remand){
  remand('foo')
}
```


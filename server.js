module.exports = Server

var http = require('http')
var https = require('hardhttps')
var Router = require('routes')
var router = new Router()
var _ = require('lodash')
var url = require('url')

/**
  * Server Class
  **/
function Server(port){
  this._pre = []
  this.config = {
    port: port
  }
}

/**
  *  Config is a standard node https config object. This method will
  *  automatically switch the server to https.
  **/
Server.prototype.tls = function(config){
  this.tls = true
  this.config.tls = config

  //If config is string 'default', load the default tls config
  if(config === 'default') this.config.tls = require('./defaults/tls/config.js')

  return this
}

/**
  * Starts the server
  **/
Server.prototype.start = function(cb){
  var self = this

  if(self.tls){
    https.createServer(self.config.tls, self.requestHandler.bind(self)).listen(self.config.port)
    cb()
  }
  else{
    http.createServer(self.requestHandler.bind(self)).listen(self.config.port)
    cb()
  }
}

// Define a block of prerequisite functions
Server.prototype.pre = function(pre){
  var self = this
  self._pre.push(pre)
  return this
}

// Define a server route
Server.prototype.route = function(route){
  router.addRoute(route.path, compileRouteFn(route.pre, route.handler))
}

// Incoming request handler.
// @TODO Does this need to be in the Server class?
// @TODO pluggable router & error handling
Server.prototype.requestHandler = function(request, response){
  var self = this

  var request = new Request(request, response)

  var preq = new Preq(request, function(err){
    var path = url.parse(request.raw.request.url).pathname
    var match = router.match(path)

    if(typeof(match.fn) != 'function') throw new Error('need to handle 404')
    match.fn(request)
  })

  //Run (recursively) the delcared pre functions.  flatten to reduce array depth by 1.
  preq.run(_.flatten(self._pre, true))
}

/**
  * Compiles a route handler given a route object (path and equip handler).
  * Returns closure to capture the prerequisites and equip handler
  **/
function compileRouteFn(pre, handler){
  return function(request){
    var preq = new Preq(request, function(err){
      var reply = request.reply
      handler(request, reply)
    })
    preq.run(pre)
  }
}

/**
  * Class to run prerequisites in series and in paralell.
  * Stores the results on request.pre
  * @TODO split into own file/module
  * @TODO consider best place to 'store' data
  * @TODO how to ensure completion of async stack
  **/
function Preq(request, cb){
  this.request = request
  this.cb = cb
}

Preq.prototype.run = function(pre){
  var self = this
  var request = self.request
  self.pre = pre

  if(self.pre.length == 0){
    self.cb(null)
  }
  else{
    var toRun = self.pre.shift()

    if(Array.isArray(toRun)){
      var counter = new Counter(toRun.length)

      _.each(toRun, function(el){
        _.each(el, function(fn, key){
          var remand = self.createParallelRemand(key, counter)
          fn(request, remand)
        })
      })
    }
    else{
      _.each(toRun, function(fn, key){
        var remand = self.createSimpleRemand(key)
        fn(request, remand)
      })
    }
  }
}

/**
  * A remand is a closure that a pre-handler calls to store its results onto
  * the request object and notify Preq to continue async execution.
  **/
Preq.prototype.createSimpleRemand = function (key){
  var self = this
  return function(value){
    self.request.pre.key = value
    self.run(self.pre)
  }
}

// Using a simple counter run allow for parallel pre-handler execution
Preq.prototype.createParallelRemand = function(key, counter){
  var self = this
  return function(value){
    self.request.pre.key = value
    counter.increment()
    if(counter.complete){
      self.run(self.pre)
    }
  }
}

/**
  * Simple Class that increments until complete
  * @TODO throw error if goes past max
  **/
function Counter(max){
  var self = this
  this.count = 0
  this.max = max
  this.complete = false
  this.increment = function(){
    self.count++
    if(self.count == max) this.complete = true
  }
}

/**
  * Equip request object.
  * @TODO fill out. Compare to express/koa/hapi etc.
  **/
function Request(request, response){
  var self = this
  this.raw = {request: request, response: response}
  this.pre = {}
  this.reply = function(data){
    self.raw.response.end(data)
  }
}

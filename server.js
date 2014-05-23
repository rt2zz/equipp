module.exports = Server

var http = require('http')
var https = require('hardhttps')
var _ = require('lodash')
var url = require('url')
var async = require('async')

var Plugin = require('./plugin.js')
var Request = require('./request.js')

/**
  * Server Class
  **/
function Server(port){
  //@TODO can these be removed or passed around more elegantly?
  this.Plugin = Plugin
  this.RemandChain = RemandChain
  
  this.pluginDir = __dirname+'/../../plugins'
  this._pluginShare = {}
  this._plugins = {names: [], ops: []}

  this._pipePoints = {}
  this._pipePointsOrder = []

  this.pipeline = function(point, remands){
    console.log('loading pipeline')
    this.pipeline['_'+point].push(remands)
  }

  this.pipePoint('Request', null, ['post'])
  this.pipePoint('Response', null)

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

  self.requirePlugins(function(){
    self.pipeline._remandArray = self.buildRemandArray()

    if(self.tls){
      https.createServer(self.config.tls, self.requestHandler.bind(self)).listen(self.config.port)
      cb()
    }
    else{
      http.createServer(self.requestHandler.bind(self)).listen(self.config.port)
      cb()
    }
  })
}

Server.prototype.buildRemandArray = function(){
  var self = this
  console.log('ppo', self._pipePointsOrder)

  //build top level remand array
  var remands = []
  _.each(self._pipePointsOrder, function(name, key){
    var handle = {}
    if([null, undefined].indexOf(self._pipePoints[name]) > -1) var handle = null
    else handle['_handle'+name] = self._pipePoints[name]
    remands = remands.concat(self.pipeline['_pre'+name], [handle], self.pipeline['_post'+name])
  })

  //remove udefined and null values
  var remands = _.chain(remands).flatten(true).without(null, undefined).value()

  return remands
}

//@TODO more flexible pipe point ordering
Server.prototype.pipePoint = function(name, handler, stages){
  this._pipePoints[name] = handler
  this._pipePointsOrder.splice(1,0,name)
  if(!stages || stages.indexOf('pre') > -1) this.pipeline['_pre'+name] = []
  if(!stages || stages.indexOf('post') > -1) this.pipeline['_post'+name] = []
}

// Incoming request handler.
// @TODO Does this need to be in the Server class?
// @TODO pluggable router & error handling
Server.prototype.requestHandler = function(request, response){
  var self = this
  console.log('REQUEST', request.url)

  var request = new Request(request, response)

  //Instantiate and run chain
  var chain = new RemandChain(request, self.pipeline._remandArray.slice(0), function(){
  }).run()
}


/**
  * Class to run prerequisites in series and in paralell.
  * Stores the results on request.pre
  * @TODO split into own file/module
  * @TODO consider best place to 'store' data
  * @TODO how to ensure completion of async stack
  **/
function RemandChain(request, remands, cb){
  console.log('rcr', remands)
  this.request = request
  this.remands = remands
  this.cb = cb
}

RemandChain.prototype.run = function(){
  var self = this

  if(self.remands.length == 0){
    self.cb(null)
  }

  else{
    var toRun = self.remands.shift()

    if(Array.isArray(toRun)){
      var counter = new Counter(toRun.length)

      _.each(toRun, function(el){
        _.each(el, function(fn, key){
          var remand = self.createParallelRemand(key, counter)
          fn(self.request, remand)
        })
      })
    }
    else{
      _.each(toRun, function(fn, key){
        var remand = self.createSimpleRemand(key)
        fn(self.request, remand)
      })
    }
  }
}

/**
  * A remand is a closure that a pre-handler calls to store its results onto
  * the request object and notify Preq to continue async execution.
  **/
RemandChain.prototype.createSimpleRemand = function (key){
  var self = this
  return function(value){
    self.request.pre.key = value
    self.run()
  }
}

// Using a simple counter run allow for parallel pre-handler execution
RemandChain.prototype.createParallelRemand = function(key, counter){
  var self = this
  return function(value){
    self.request.pre.key = value
    counter.increment()
    if(counter.complete){
      self.run()
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

Server.prototype.require = function(name, ops){
  var ops = ops || {}
  this._plugins.names.push(name)
  this._plugins.ops.push(ops)
}

Server.prototype.requirePlugins = function(next){
  var plugins = _.zip(this._plugins.names, this._plugins.ops)
  var self = this
  async.map(plugins, function(plugin, cb){
    self.requirePlugin({name: plugin[0], ops: plugin[1]}, cb)
  }, function(err, results){
    //@TODO add error handling
    next()
  })
}

Server.prototype.requirePlugin = function(config, next){
  var name = config.name
  if(name.substring(0,1) == '/'){
    var path = name
    var mod = require(name)
  }
  else{
    var path = this.pluginDir+'/'+name
    var mod = require(path)
  }
  var plugin = new server.Plugin(path, this)
  mod.init(plugin, config.ops, next)
}

Server.prototype.get = function(name){
  //@TODO not found handling
  return this._pluginShare[name]
}

Server.prototype.extend = function(name){
  var ext = require(name)
  ext.setup(this)
}

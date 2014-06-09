module.exports = Server

//@TODO move http server into its own module

var http = require('http')
var https = require('hardhttps')
var _ = require('lodash')
var url = require('url')
var async = require('async')
var path = require('path')

var Plugin = require('./plugin.js')
var Request = require('./request.js')
var RemandChain = require('./chain.js')

var randomstring = require('randomstring')

/**
  * Server Class
  **/
function Server(config){
  this.config = config || {}

  //@TODO can these be removed or passed around more elegantly?
  this.Plugin = Plugin
  this.Request = Request
  this.RemandChain = RemandChain
  this.pluginLoader = []

  this.dir = path.resolve(__dirname+'/../../')
  this._pluginShare = {}
  this._requestedPlugins = []
  this.services = {}
  this._servicesMeta = {}

  this._pipePoints = {}
  this._pipePointsOrder = []

  this.pipeline = function(point, remands){
    this.pipeline['_'+point].push(remands)
  }

  this.pipePoint('Request', null, ['post'])
  this.pipePoint('Response', function(request, remand){
    var reply = request.reply
    console.log('replying', reply.data)
    request.raw.response.end(reply.data)
  })
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

Server.prototype.port = function(port){
  this.config = this.config || {}
  this.config.port = port
  return this
}

/**
  * Starts the server
  **/
Server.prototype.start = function(cb){
  console.log('starting')
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
Server.prototype.requestHandler = function(request, response){
  var self = this
  console.log('REQUEST', request.url)

  var request = new Request(request, response, self.keys)

  //Instantiate and run chain
  var chain = new RemandChain(request, self.pipeline._remandArray.slice(0), function(){
  }).run()
}

Server.prototype.plugin = function(module, ops){
  var ops = ops || {}
  //@todo make name deteministic... or get actual module names
  this._requestedPlugins.push({module: module, name: randomstring.generate(8), ops: ops})
}

Server.prototype.requirePlugins = function(next){
  var plugins = this._requestedPlugins
  var self = this
  async.map(plugins, self.requirePlugin.bind(self), function(err, results){

    //@TODO add error handling and cleanup
    async.map(self.pluginLoader, function(loader, next){
        console.log('loaded plugins', results)
        loader(plugins, next)
      }, function(err, results){
        console.log('coming back frmo plugin loaders')
        if(err) throw new Error('loader error')
        console.log('loaded plugin loaders', results)
        next()
    })
  })
}

Server.prototype.requirePlugin = function(config, next){
  console.log('this.services', this.services)
  config.plugin = new Plugin(config.name, this)
  if(config.module.plugin) config.module.plugin(config.plugin, config.ops, next)
  else next()
}

Server.prototype.get = function(name){
  //@TODO not found handling
  return this._pluginShare[name]
}

Server.prototype.extend = function(module, ops){
  module.extension(this, ops)
}

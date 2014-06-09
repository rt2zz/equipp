module.exports = Plugin

function Plugin(path, server){
  this._pluginPath = path
  this.server = server
  this.get = server.get
  this._preHandler = []
  this._postHandler = []
}

Plugin.prototype.share = function(object){
  // var info = require(this._pluginPath+'/package.json')
  // this.server._pluginShare[info.name] = object
}

//@TODO implement dependency
Plugin.prototype.dependency = function(name){
  // if(this.server._plugins.names.indexOf(name) > -1){
  //
  // }
  // else{
  //   throw new Error('plugin dependency not met!')
  // }
}

Plugin.prototype.preHandler = function(pre){
  this._preHandler.push(pre)
}

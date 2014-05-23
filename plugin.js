module.exports = Plugin

function Plugin(path, server){
  this._pluginPath = path
  this.server = server
  this.get = server.get
  this._pre = []
  this._post = []
}

Plugin.prototype.share = function(object){
  var info = require(this._pluginPath+'/package.json')
  this.server._pluginShare[info.name] = object
}

//@TODO cleanup
Plugin.prototype.dependency = function(name){
  if(this.server._plugins.names.indexOf(name) > -1){

  }
  else{
    throw new Error('plugin dependency not met!')
  }
}

Plugin.prototype.pre = function(pre){
  this._pre.push(pre)
}

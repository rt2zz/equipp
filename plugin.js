module.exports = Plugin

function Plugin(id, server){
  this._id = id
  this.server = server
  this.services = server.services
  this._servicesMeta = server._servicesMeta
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

Plugin.prototype.service = function(key, value){
  this._servicesMeta[key] = this._servicesMeta[key] || {}
  console.log('services', this.services)
  if(this.services[key]){
    //Check if this module "controls" this service
    if(this._servicesMeta[key].id != this._id){
      //@todo, improve error handling here, or possibly only throw warning / override option
      throw new Error('Cannot register that service, name already taken')
    }
  }
  this.services[key] = value
  this._servicesMeta[key].id = this._id
}

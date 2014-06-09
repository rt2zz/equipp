
var _ = require('lodash')

/**
  * Equip request object.
  * @TODO fill out. Compare to express/koa/hapi etc.
  **/
function Request(request, response, keys){
  var self = this
  this.raw = {request: request, response: response}
  this.pre = {}
  this.keys = keys

  //@TODO make thism ore elegant with classes or closures...
  this.reply = function(data){
    self.reply.data = data
    if(typeof self.reply.remand == 'function'){
      self.reply.remand(data)
      self.reply.remand = null
    }
  }
  this.reply.remand = null

}

Request.prototype.error = function(type){
  console.log('ERROR', type)
  this.raw.response.end('Error: ', type)
}

module.exports = Request

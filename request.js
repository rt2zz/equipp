module.exports = Request

var _ = require('lodash')
/**
  * Equip request object.
  * @TODO fill out. Compare to express/koa/hapi etc.
  **/
function Request(request, response){
  var self = this
  this.raw = {request: request, response: response}
  this.pre = {}
  this._replied = false
  this.reply = createReply()function(data){

    if(this._replied){
      throw new Error('Replied Twice')
    }
    self.raw.response.end(data)
    this._replied = true
  }
}

function createReply(){
  return new Re
}

function Reply(data){
  if(this instanceof Reply)
}

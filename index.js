module.exports = new Equip()

var Server = require('./server.js')

function Equip(){
}

Equip.prototype.createServer = function(port){
  return new Server(port)
}

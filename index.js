module.exports = new Eqi()

var Server = require('./server.js')

function Eqi(){
}

Eqi.prototype.createServer = function(port){
  return new Server(port)
}

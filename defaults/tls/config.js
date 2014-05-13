var fs = require('fs')

module.exports = {
  key: fs.readFileSync(__dirname+'/server-key.pem'),
  cert: fs.readFileSync(__dirname+'/server-cert.pem'),
  ca: []
}

module.exports = RemandChain

var _ = require('lodash')

/**
  * Class to run prerequisites in series and in paralell.
  * Stores the results on request.pre
  * @TODO split into own file/module
  * @TODO consider best place to 'store' data
  * @TODO how to ensure completion of async stack
  **/
function RemandChain(request, remands, cb){
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
  var remand = function(value){
    self.request.pre[key] = value
    self.run()
  }
  decorate(remand, self)
  return remand
}


// Using a simple counter run allow for parallel pre-handler execution
RemandChain.prototype.createParallelRemand = function(key, counter){
  var self = this
  var remand = function(value){
    self.request.pre[key] = value
    counter.increment()
    if(counter.complete){
      self.run()
    }
  }
  decorate(remand, self)
  return remand
}

RemandChain.prototype.break = function(){
  console.log('BREAKING CHAIN')
  //@TODO Default reply
}

function decorate(remand, self){
  //@TODO figure out best way to do this... closure over self, or bind, or something else?
  remand.error = function(){
    //@TODO implement error
  }
  remand.break = function(){
    self.break()
  }
}

function remandError(type){
  // reply to req
  // break / continue chain
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

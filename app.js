var restify = require('restify'),
    mongojs = require('mongojs')

var config = {
  app: {
    name: 'pokedex',
    address: '127.0.0.1',
    port: 8080
  },
  mongo: {
    address: '127.0.0.1',
    port: 27017,
    base: 'pokedex'
  }
}

var db = mongojs(config.mongo.address + ':' + config.mongo.port + '/' + config.mongo.base, [config.mongo.base])
var Pokemons = db.collection('pokemons')

var server = restify.createServer({
  name: config.app.name
})

server.use(restify.queryParser()) // Parsed contend into req.query
server.use(restify.bodyParser())  // Request data into JavaScript object
server.use(restify.CORS())        // CORS support

// Routes
var pokemonsPath = '/pokemons'
server.get(pokemonsPath, findAllPokemons)
server.get(pokemonsPath + '/:pokemonId', findPokemon)
server.post(pokemonsPath, createPokemon)
server.put(pokemonsPath + '/:pokemonId', editPokemon)
server.del(pokemonsPath + '/:pokemonId', removePokemon)

server.listen(config.app.port, config.app.address, function() {
  console.log('%s listening at %s', server.name, server.url)
})


// Callbacks

function findAllPokemons(req, res, next) {
  Pokemons.find().sort({ 'postedOn': -1 }, function(err, pokemons) {
    if(err) return next(err)
    res.send(200, pokemons)
    return next()
  })
}

function findPokemon(req, res, next) {
  Pokemons.findOne({ _id: mongojs.ObjectId(req.params.pokemonId) }, function(err, pokemon) {
    if(err) return next(err)
    res.send(200, pokemon)
    return next()
  })
}

function createPokemon(req, res, next) {
  var params = req.params,
      now = new Date()
  var pokemon = {
    name: params.name,
    created_at: now,
    updated_at: now
  }

  Pokemons.save(pokemon, function(err) {
    if(err) return next(err)
    res.send(201, pokemon)
    return next()
  })
}

function editPokemon(req, res, next) {
  var params = req.params
  var pokemon = { updated_at: new Date() }
  if(typeof params.name !== 'undefined') {
    pokemon.name = params.name
  }

  var objectId = mongojs.ObjectId(params.pokemonId)
  Pokemons.update({ _id: objectId }, { $set: pokemon }, function(err) {
    if(err) return next(err)
    Pokemons.findOne({ _id: objectId }, function(err, pokemon) {
      if(err) return next(err)
      res.send(200, pokemon)
      return next()
    })
  })
}

function removePokemon(req, res, next) {
  Pokemons.remove({
    _id: mongojs.ObjectId(req.params.pokemonId)
  }, function(err) {
    if(err) return next(err)
    res.send(204)
    return next()
  })
}



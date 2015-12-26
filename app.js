var twitter = require('ntwitter'),
    https   = require('https'),
    fs      = require('fs'),
    mysql   = require('mysql'),
    config  = require('./config');

var twit = new twitter( config.twitter );

var connection = mysql.createConnection( config.db );

twit.stream('statuses/filter', { track: config.track }, function(stream) {

  console.log('connected to twitter\'s streaming API...');

  stream.on('data', function (data) {

    if (data.text.substr(0,4) != 'RT @') {

      if ( data.extended_entities != undefined ) {

        if ( data.extended_entities.media != undefined ) {

          var media = data.extended_entities.media;

          var post;

          for (var i = 0; i < media.length; i++) {

            var imageUrl = media[i].media_url_https;

            post  = {
              tw_id       : data.id_str,
              screen_name : data.user.screen_name,
              created_at  : data.created_at,
              text        : data.text,
              imageUrl    : imageUrl,
              image       : imageUrl.match(/\/([^/]+)$/)[1]
            };

            savePost( post );

          }

        }

      }

    }

  });

  stream.on('error', function(error, code) {
    console.log("My error: " + error + ": " + code);
  });

});

function savePost( post ) {

  var query = connection.query('INSERT INTO tweets SET ?', post, function(err, result) {

    console.log( post.created_at + ' ' + ('               ' + post.screen_name).slice(-15) + ' : ' + post.text);

    var file = fs.createWriteStream(config.imageFolder + '/' + post.image);

    var request = https.get(post.imageUrl + ':large', function(response) {
      response.pipe(file);
    });

  }, function (error) {
    console.error(error);
  });

}

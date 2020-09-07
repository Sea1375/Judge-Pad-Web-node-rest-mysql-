var http = require('https');
var app = require('./app');

var port = process.env.PORT || 3001; 	  // set our port
var host = process.env.HOST || '0.0.0.0'; // For Heroku to run successfully

http.createServer(app).listen(port, host, () => {
	console.log("Server ready at https://" + host + ":" + port);
});

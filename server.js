'use strict';

require('dotenv').config();

// Start the web server
require('./app.js').start(process.env.PORT);
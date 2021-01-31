// Setup
// createdb slack-user-queue

require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const data = require('./data')
const { commands } = require('./commands')

// Initialize
data.init()
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended: true}));
app.listen(PORT, () => console.log(`listening on port ${PORT}!`));

// Routes
app.post('/commands/queue', commands)

// Release data pool connection after route processing
app.use((err, req, res, next) => {
  if (res.locals.dataConnection) {
    data.releaseConnection(res.locals.dataConnection);
  }
  next(err)
})
app.use((req, res, next) => {
  if (res.locals.dataConnection) {
    data.releaseConnection(res.locals.dataConnection);
  }
  next();
})

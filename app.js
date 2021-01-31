// Setup
// createdb slack-user-queue

require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const data = require('./data')
data.init()
const PORT = process.env.PORT || 3000;

const CREATE = "create"
const LIST = "list"
const SHOW = "show"
const RESET = "reset"
const ADD_OR_CYCLE_TO_FRONT = "budge"
const ADD_OR_CYCLE_TO_BACK = "add-or-cycle-to-back"

app.use(bodyParser.urlencoded({extended: true}));
app.listen(PORT, () => console.log(`listening on port ${PORT}!`));


app.post('/commands/queue', async (req, res, next) => {
  const {text} = req.body;
  console.log(text)
  const parts = text.split(" ")
  let responseText

  // No arguments - show commands
  if (!parts.length || parts[0] === "") {
    responseText =  "`/queue create {name}` – create a new queue\n" +
                    "`/queue list – show all queues\n" +
                    "`/queue {name}` – show the queue\n" +
                    "`/queue {name} 5` – show the 5 users at front of the queue\n" +
                    "`/queue {name} -5` – show the 5 users at the back of the queue\n" +
                    "`/queue {name} @user1 [@user2 @user3 ...]` – send users to the back of the queue\n" +
                    "`/queue {name} budge @user1 [@user2 @user3 ...]` – send users to the front of the queue\n" +
                    "`/queue reset {name}` – remove all users from queue\n"
    res.send({
      response_type: "ephemeral",
      text: responseText
    });
    return next()
  }

  // grab a list of all queues
  let db, queues
  try {
    db = await data.openConnection()
    res.locals.dataConnection = db
    try {
      queues = await db.query('SELECT * FROM queues')
    } catch (err) {
      // create schema
      await db.query('CREATE TABLE IF NOT EXISTS queues (queue_id INT GENERATED ALWAYS AS IDENTITY, queue_name VARCHAR NOT NULL, PRIMARY KEY(queue_id))')
      await db.query('CREATE TABLE IF NOT EXISTS users (user_id INT GENERATED ALWAYS AS IDENTITY, user_name VARCHAR NOT NULL, PRIMARY KEY(user_id))')
      await db.query('CREATE TABLE IF NOT EXISTS queue_users (queue_users_id INT GENERATED ALWAYS AS IDENTITY, queue_id INT NOT NULL, user_id INT NOT NULL, rank BIGINT DEFAULT 0, PRIMARY KEY(queue_users_id))')
      console.log('queue tables initialized')
      queues = await db.query('SELECT * FROM queues')
    }
  } catch (err) {
    res.send("Error " + err);
    return next(err)
  }

  switch (parts[0].toLowerCase()) { // command handling
    case LIST: {
      console.log(JSON.stringify(queues.rows,null,2))
      if (queues.rows.length > 0) {
        responseText = queues.rows.reduce((accumulator,row,i) => {
          return i === 0 ? `\`${row.queue_name}\`` : accumulator + `\n\`${row.queue_name}\``
        },"")
      } else {
        responseText = "No queues created yet! (`/queue create {name}` to create one)"
      }
      break;
    }
    case CREATE: {
      const queueName = parts[1]
      if (queues.rows.find(row => row.queue_name === queueName)) {
        responseText = `There's already a queue with that name`
      } else {
        try {
          await db.query('INSERT INTO queues (queue_name) VALUES($1)', [queueName])
          responseText = `queue "${queueName}" created`
        } catch (err) {
          res.send("Error " + err)
          return next(err)
        }
      }
      break;
    }
    case RESET: {
      const queue = queues.rows.find(row => row.queue_name === parts[1])
      if (!queue) {
        responseText = `There's no queue called "${parts[0]}"`
        res.send({
          response_type: "ephemeral",
          text: responseText
        });
        return next()
      }

      try {
        await db.query(`DELETE FROM queue_users WHERE queue_id = ${queue.queue_id}`)
        responseText = `queue "${queue.queue_name}" has been reset`
      } catch (err) {
        res.send("Error " + err)
        return next(err)
      }

      break;
    }
    default: { // operations on a given queue
      const queue = queues.rows.find(row => row.queue_name === parts[0])
      if (!queue) {
        responseText = `There's no queue called "${parts[0]}"`
        res.send({
          response_type: "ephemeral",
          text: responseText
        });
        return next()
      }

      // grab the queue users
      let queueUsers
      try {
        queueUsers = await db.query(`SELECT * FROM queue_users qu LEFT JOIN users u ON u.user_id = qu.user_id WHERE qu.queue_id = ${queue.queue_id} ORDER BY rank`)
        console.log(JSON.stringify(queueUsers.rows,null,2))
      } catch (err) {
        res.send("Error " + err);
        return next(err)
      }

      // command handling
      const action = parts.length === 1 ? SHOW : parts[1] === ADD_OR_CYCLE_TO_FRONT ? ADD_OR_CYCLE_TO_FRONT : ADD_OR_CYCLE_TO_BACK
      if (action === SHOW) {
        if (queueUsers.rows.length > 1) {
          responseText = queueUsers.rows.reduce((accumulator,row,i) => {
            return i === 0 ? row.user_name : accumulator + `\n${row.user_name}` // todo: just display username, don't ping user with @
          },"")
        } else {
          responseText = `No users added to the \"${parts[0]}\" queue yet! (\`/queue ${parts[0]} @user1 [@user2 @user3...]\` to add some)`
        }
      }
      if (action === ADD_OR_CYCLE_TO_FRONT || action === ADD_OR_CYCLE_TO_BACK) {
        // parse users
        const users = action === ADD_OR_CYCLE_TO_BACK ? parts.slice(1, parts.length) : parts.slice(2, parts.length)
        console.log(JSON.stringify(users,null,2))
        // TODO: For each user provded, if already in queue, move to appropriate position, otherwise create at appropriate position
        responseText = `TODO: ${action}...`
      }
    }
  }

  res.send({
    response_type: "ephemeral",
    text: responseText
  });
  return next()
})

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

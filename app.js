const express = require('express');
const app = express();
const bodyParser= require('body-parser');

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.listen(PORT, () => console.log(`listening on port ${PORT}!`));


app.post('/commands/stack', (req, res) => {
    const {text} = req.body;
    console.log(text)
    const parts = text.split(" ")
    let responseText

    if (!parts.length) {
      responseText = "TODO: show param help"
      res.send({
        response_type: "in_channel",
        text: responseText
      });
    }

    if (parts[0] === "create") {
      const stackName = parts[1]
      // TODO: store somewhere
      responseText = `stack "${stackName}" created`
    } else {
      const stackName = parts[0]
      const action = parts.length > 1 ? "bury" : "list"

      if (action === "bury") {
        const users = parts.splice(1,parts.length - 1)
        // TODO: Bury all mentioned users at bottom of stack
        responseText = "Burying ..."
      } else if (action === "list") {
        // TODO: Show the stack
        responseText = `Showing ${stackName} stack...`
      }
    }

    res.send({
      response_type: "in_channel",
      text: responseText
    });
})

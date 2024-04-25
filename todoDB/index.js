const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();
process.env.TOKEN_SECRET;
const Ajv = require("ajv")
const app = express();
// Variante 2
//Zugriff auf Body des Request wir wollen nur JSON am Anfang des Dokuments!!
app.use((req, res, next) => {
  express.json()(req, res, err => {
    if (err) {
      return res.status(400).send({
        message: "Could not parse JSON"
      });
    }
    next();
  })
});

app.use(cors())
app.use(express.urlencoded({ extended: true }))

const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
const schema = {
  type: "object",
  properties: {
    id: {type: "integer"},
    title: { type: "string" },
    completed: { type: "boolean" },
  },
  required: ["title", "completed"],
    additionalProperties:false
}
const validate = ajv.compile(schema)



// Create an async pool object with promisified methods
const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
async function query(sql, params) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    throw error;
  }
}
// Function to check the connection
async function checkConnection() {
  try {
    // Execute a simple query to check the connection
    await pool.query('SELECT 1');
    console.log('Connected to the MySQL server.');
  } catch (err) {
    console.error('Error connecting to MySQL server:', err);
  } finally {
    // Close the connection pool
  }
}

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET);
}



// Call the function to check the connection
checkConnection();

app.get('/todos', async function (req, res) {
  try {
    const sql = "SELECT * FROM todos";
    var todos = await query(sql);
    console.log(todos);
    if (todos.length == 0) {
      res.status(404).json({
        status: 404,
        message: "keine Todos gefunden"
      });
      return;
    }
    //console.log(todos);
    var row = todos.length;
    res.status(200).json({
      status: 200,
      todos,
      row
    });
    return;
  } catch (err) {
    res.status(500).send({
      status: 500,
      message: err
    });
  }
  return;
});


app.post('/todos', async function (req, res) {
  let todo = req.body;

  const isValid = validate(todo)
  if (!isValid) {
    console.log(validate.errors);
    res.send("Invalid data")
    return;
  }

  try {
    let value = todo.completed ? 1 : 0;
    const sql = "INSERT INTO todos (title,completed) VALUES (?,?)";

    var todos = await query(sql, [todo.title, value]);

    //console.log(todos);
    res.send("Data saved")
    return;

  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: 500,
      message: err
    });
    res.send("Fehler...");
    return;
  }
  return;
});


app.put('/todos', async function (req, res) {
  let todo = req.body;

  const isValid = validate(todo)
  if (!isValid) {
    console.log(validate.errors);
    res.send("Invalid data")
    return;
  }

  try {
    let value = todo.completed ? 1 : 0;
    const sql = "UPDATE todos SET completed = ? WHERE id = ?";

    var todos = await query(sql, [value,todo.id]);

    console.log(sql);
    console.log("id:", todo.id, " value:",value);
    res.send("Data updated")
    return;

  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: 500,
      message: err
    });
    res.send("Fehler...");
    return;
  }
  return;
});


app.delete('/todos', async function (req, res) {
  let todo = req.body;

  const isValid = validate(todo)
  if (!isValid) {
    console.log(validate.errors);
    res.send("Invalid data")
    return;
  }
  try {
    const sql = "DELETE FROM todos WHERE id = ?";
    var todos = await query(sql, [todo.id]);
    res.send("Data deleted")
    console.log(todos);
    if (todos.length == 0) {
      res.status(404).json({
        status: 404,
        message: "keine Todos gefunden"
      });
      return;
    }
    //console.log(todos);
    var row = todos.length;
    res.status(200).json({
      status: 200,
      todos,
      row
    });
    return;
  } catch (err) {
    res.status(500).send({
      status: 500,
      message: err
    });
  }
  return;
});



app.get('/', (req, res) => {

  res.send('hallo ihr luschen');
});

///Zugriffe auf Pfade mit : 
// Apfrage mit Parameter  /hello?name=xxx
app.get('/hello', (req, res) => {
  res.send("hallo mein query ist:" + req.query.name);
});
// Abfrage mit Platzhalter in /hello/markus
app.get('/hello/:name', (req, res) => {
  console.log(req.params.name);
  res.send("hallo mein Name ist auch " + req.params.name);
});

// Abfrage mit Platzhalter in /hello/markus
app.post('/hello/body', function (req, res) {
  console.log(req.body);
  res.send(req.body);
});








app.listen(3000, () => console.log('Example REST started'))
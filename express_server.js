const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

function findUser(email) {
  for (let userID in users) {
    if (email === users[userID].email) {
      return users[userID];
    }
  }
  return false;
}

// databases
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// homepage
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { user: users[userId], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect("/urls/" + randomString);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { user: users[userId], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { user: users[userId], urls: urlDatabase };
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  let userFound = findUser(inputEmail);

  if (userFound && userFound.password == inputPassword) {
    res.cookie('user_id', req.body.email);
    res.redirect("/");
  } else {
    res.status(400).send('Incorrect credentials. <a href = "/login">Please try again.</a>');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  let emailFound = false;

  if (inputEmail === "" && inputPassword === "") {
    res.status(400).send('Please enter an email and password');
  } else if (inputPassword === "") {
    res.status(400).send('Please enter a password');
  } else if (inputEmail === "") {
    res.status(400).send("Please enter an email");
  } else {
    for (let userId in users) {
      if (inputEmail === users[userId].email) {
        emailFound = true;
      }
    } if (emailFound === true) {
      res.status(400).send('Email has already been taken');
    } else {
      users[id] = { id: id, email: req.body.email, password: req.body.password };
      res.cookie('user_id', users[id].id);
      res.redirect("/urls");
    }
  }
  console.log(users);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { user: users[userId], urls: urlDatabase, shortURL: req.params.id, longURL: urlDatabase[req.params.id] || "not found" };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


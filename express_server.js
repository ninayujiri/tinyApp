// Dependencies
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");


// Middleware
// - Cookie encryption
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// - JSON body parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Encrypts passwords
const bcrypt = require('bcrypt');


// Functions
function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

function findUser(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return false;
};

function userChecker(currentUser) {
  for (let user in users) {
    if (user === currentUser) {
      return true;
    }
  } return false;
};

function registerChecker(email, password) {
if (password === undefined) {
    for (id in users) {
      if (users[id].email === email){
        return true;
      }
    } return false;
  }
};


// Databases
// - URL Database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    createdBy: 'userRandomID'},
  '9sm5xK': {
    longURL: "http://www.google.com",
    createdBy: 'user2RandomID'}
};

// - User Database
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
  },
   "123456": {
    id: "123456",
    email: "nina@nina.com",
    password: "nina"
  }
};


// Root Page
app.get("/", (req, res) => {
  let currentUser = req.session.user_id;
  if (currentUser) {
  res.redirect("/urls");
  }
});


// Registration Page
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  if (inputEmail === "" && inputPassword === "") {
    res.status(400).send('Please enter an email and password');
  } else if (inputPassword === "" || inputEmail === "") {
    res.status(400).send('Please enter both a username and password');
  } else if (registerChecker(req.body.email)) {
    res.status(400).send('Email has already been taken');
  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(inputPassword, 10);
    users[id] = { id: id, email: req.body.email, password: hashedPassword };
    req.session.user_id = users[id].id;
    res.redirect("/urls");
  }
});


// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(inputPassword, 10);
  let userFound = findUser(inputEmail);

  if (inputEmail === null || inputPassword === null) {
    res.status(400).send('Please fill in both email and password fields. <a href = "/login">Try again.</a>');
  }
  for (user in users) {
    if (userFound && bcrypt.compareSync(inputPassword, hashedPassword)) {
    req.session.user_id = userFound.id;
    res.redirect("/urls");
    return;
    }
  }
  res.status(400).send('Incorrect credentials. <a href = "/login">Please try again.</a>');
});


// Logout Page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// URL Index
app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  if (userChecker(userId)) {
    let userURLs = {};
    for (let url in urlDatabase) {
      if (urlDatabase[url].createdBy === req.session.user_id){
        userURLs[url] = urlDatabase[url];
      }
    }
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send('Please <a href = "/login">login</a> or <a href = "/register">register.</a>');
  }
});

app.post("/urls", (req, res) => {
  let userId = req.session.user_id;
  if (userChecker(userId)) {
    let randomString = generateRandomString();
    urlDatabase[randomString] = { longURL: req.body.longURL, createdBy: userId };
    res.redirect("/urls/" + randomString);
  } else {
    res.status(401).send('Please <a href = "/login">login</a> or <a href = "/register">register.</a>');
  }
});


// Create a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  let currentUser = req.session.user_id;
  if (!currentUser) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});


// Show URL
app.get("/u/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// Update URL
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase, shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = { longURL: req.body.longURL, createdBy: req.session.user_id };
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


// Listening Port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


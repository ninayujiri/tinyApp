// Dependencies
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");


// Middleware:
// Cookie encryption
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Parses to a JSON file
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Encrypts passwords
const bcrypt = require('bcrypt');


// Global Functions:
// Generates a Random String
function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

// Checks if the user exists in the Database
function findUser(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return false;
};

// Checks if the current user matches the cookie
function userChecker(currentUser) {
  for (const user in users) {
    if (user === currentUser) {
      return true;
    }
  } return false;
};

// Checks if the the URL is in the Database
function urlChecker(shortURL) {
  const arrShortUrl = Object.keys(urlDatabase);
  for (const url in arrShortUrl) {
    if (shortURL === arrShortUrl[url]) {
      return arrShortUrl[url];
    }
  } return false;
};



// Databases:
// URL Database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    createdBy: 'userRandomID'},
  '9sm5xK': {
    longURL: "http://www.google.com",
    createdBy: 'user2RandomID'}
};

// User Database
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
  const currentUser = req.session.user_id;
  if (!currentUser) {
    res.render('home');
  } else {
  res.redirect("/urls");
  }
});


// Registration Page
app.get("/register", (req, res) => {
  const currentUser = req.session.user_id;
  if (currentUser) {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

app.post("/register", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  if (inputEmail === "" && inputPassword === "") {
    res.status(400).send('Please enter an email and password');
  } else if (inputPassword === "" || inputEmail === "") {
    res.status(400).send('Please enter both a username and password');
  } else if (findUser(req.body.email)) {
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
  const currentUser = req.session.user_id;
  if (currentUser) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const userFound = findUser(inputEmail);
  const userPassword = userFound.password;

  if (!inputEmail || !inputPassword) {
    res.status(400).send('Please fill in both email and password fields. <a href = "/login">Try again.</a>');
  } else {
      if (userFound && bcrypt.compareSync(inputPassword, userPassword)) {
        req.session.user_id = userFound.id;
        res.redirect("/urls");
      } else {
        res.status(400).send('Incorrect credentials. <a href = "/login">Please try again.</a>');
      }
  }
});


// Logout Page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// URL Index
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  if (userChecker(userId)) {
    let userURLs = {};
    for (const url in urlDatabase) {
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
  const userId = req.session.user_id;
  const longURL = req.body.longURL;
  const randomString = generateRandomString();
  urlDatabase[randomString] = { longURL: longURL, createdBy: userId };
  res.redirect("/urls/" + randomString);
});


// Create a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    const templateVars = { user: users[userId], urls: urlDatabase };
    res.render("urls_new", templateVars);
  } else {
      res.redirect("/login");
  }
});


// Show URL
app.get("/u/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlFound = urlChecker(shortURL);

  if (urlFound === false) {
    res.status(404).send('This URL does not exist');
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
});


// Update URL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id;
  const urlFound = urlChecker(shortURL);

  if (urlFound === false) {
    res.status(404).send('This URL does not exist');
  } else if (userId === undefined) {
    res.redirect('/');
  } else if (userId !== urlDatabase[shortURL].createdBy) {
    res.status(403).send("You do not have access to this URL");
  }
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


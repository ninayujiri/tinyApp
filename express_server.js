const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");


// Middleware
var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: 'some-long-secret',
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcrypt');


// Functions
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
};

// function urlsForUser(id) {

// };


// Databases
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    createdBy: 'userRandomID'},
  '9sm5xK': {
    longURL: "http://www.google.com",
    createdBy: 'user2RandomID'}
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


// Root Page
app.get("/", (req, res) => {
  res.end("Hello!");
});


// Registration Page
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(inputPassword, 10);
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
      users[id] = { id: id, email: req.body.email, password: hashedPassword };
      // res.cookie('user_id', users[id].id);
      req.session.user_id = users[id].id;
      console.log("old: ", users[id].id);
      console.log("just id: ", id);
      res.redirect("/urls");
    }
  }
  console.log("users: ", users);
});







app.post('/register', (req, res) => {
  // checks if email or password is empty
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Email or password empty. <a href="/register">Go Back</a>');
  } else if (regChecker(req.body.email)) {
    res.status(400).send('Email already in database. Forgot? Well too bad. Make a new one. <a href="/register">Go Back</a>');
  } else {
    // generates a new id and assigns it into database
    let newUserId = generateRandomNumber();
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = newUserId;
    res.redirect('/urls');
  }
});








// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  let userFound = findUser(inputEmail);
  const hashedPassword = bcrypt.hashSync(inputPassword, 10);

  if (userFound && bcrypt.compareSync(inputPassword, hashedPassword)) {
    // res.cookie('user_id', userFound.id);
    res.session.user_id = userFound.id;
    res.redirect("/");
  } else {
    res.status(400).send('Incorrect credentials. <a href = "/login">Please try again.</a>');
  }
});


// Logout Page
app.post("/logout", (req, res) => {
  // res.clearCookie('user_id');
  req.session.user_id = null;
  res.redirect("/urls");
});


// URL Index
app.get("/urls", (req, res) => {
  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  // let userId = req.cookies["user_id"];
  let userId = req.session.user_id;
  urlDatabase[randomString] = { longURL: req.body.longURL, createdBy: userId };
  res.redirect("/urls/" + randomString);
});


// Create a new URL
app.get("/urls/new", (req, res) => {
  // const userId = req.cookies["user_id"];
  // const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  // let currentUser = req.cookies.user_id;
  let currentUser = req.session.user_id;

  if (!currentUser) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});


// Show URL
app.get("/u/:shortURL", (req, res) => {
  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;
  const templateVars = { user: users[userId], urls: urlDatabase };
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// Update URL
app.get("/urls/:id", (req, res) => {
  // const userId = req.cookies["user_id"];
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


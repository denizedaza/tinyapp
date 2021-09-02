const express = require("express");
const cookieParser = require("cookie-parser");
const { generateRandomString, ifEmailExistsInUser, authenticateUser, urlsForUser, getUserByEmail } = require("./helpers");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const salt = bcrypt.genSaltSync(10);
const user1Password = bcrypt.hashSync("purple-monkey-dinosaur", salt);
const user2Password = bcrypt.hashSync("dishwasher-funk", salt);

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aj48lw"
  },
  psm5xK: {
    longURL: "http://www.google.com",
    userID: "aj48lw"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: user1Password
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: user2Password
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    // urls: urlDatabase,
    //filtered the urls for the logged in user
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };

  if (!userId) {
    res.status(403).send("<h1>You must be logged in or register to access URLs</h1>");
  }

  res.render("urls_index", templateVars);

  console.log(req.body);  // Log the POST request body to the console
  const shortUrl = generateRandomString();
  res.redirect(`/urls/${shortUrl}`);
  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = { 
    user: users[userId]
  };
  
  if (!userId) {
    res.status(403).send("You must be a registered user to add new URLs");
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL
  const templateVars = { 
    shortURL, 
    longURL,
    urlUserId: urlDatabase[req.params.shortURL].userID,
    user: users[userId]
  };

  const usersUrl = urlsForUser(userId, urlDatabase);
  //create boolean variable to show if the url belong to the user or not
const urlBelongToUser = usersUrl[req.params.shortURL] && usersUrl[req.params.shortURL].userID === userId

  if (!urlBelongToUser) {
    res.status(403).send("<h1>You must be logged in or register to access URLs</h1>");
  }

  if (!userId) {
    res.status(403).send("<h1>You must be logged in or register to access URLs</h1>");
  }

  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longUrl = urlDatabase[req.params.shortURL].longURL;
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(longUrl);
  } else {
    res.status(403).send("The short URL you are trying to access does not exist");
  }

})

//accept registration info
app.get("/register", (req, res) => {
  // if (req.cookies["user_id"]) {
  //   res.redirect("/urls");
  // }
  const templateVars = {
      // email = req.params.email,
      // user: users[req.cookies["user_id"]]
      user: req.session.user_id
    }
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  const templateVars = {
    // email = req.params.email,
    user: users[req.session.user_id]
  }
  res.render("urls_login", templateVars);
})

//POST routes

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL] && req.session.user_id === urlDatabase[shortURL].userID){
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
  res.status(403).send("You need to log in to delete URLs");
});

app.post("/urls/:id", (req, res) => {
  const shortUrlId = req.params.id;
  if (urlDatabase[shortUrlId] && req.session.user_id === urlDatabase[shortUrlId].userID){
    urlDatabase[shortUrlId].longURL = req.body.newURL;
    res.redirect("/urls");
  }
  res.status(403).send("You need to log in to edit URLs");
});

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString();
  const longUrl = req.body.longURL;

  urlDatabase[shortUrl] = {
    longURL: longUrl,
    userID: req.session.user_id
  };

  res.redirect(`/urls/${shortUrl}`);

  // if (!req.session.user_id) {
  //   res.status(403).send("<h1>You must be logged in to view this page. Please login or register first</h1>");
  // }
});

//login 
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!ifEmailExistsInUser(email, users)) {
    res.status(403).send("There is no account associated with this email address");
  }

  const user = authenticateUser(email, password, users);

  if (user) {
    // res.cookie("user_id", user.id);
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect email or password information");
  }


  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;

  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  //if the email or password are empty strings, send back 400 status error
  if ( !email || !password ) {
    res.status(400).send("Please include both a valid email and a password");
  }

  if (ifEmailExistsInUser(email, users)) {
    res.status(400).send("An account already exists with this email address")
  }

  const newUser = {
    id, 
    email, 
    password
  };

  users[id] = newUser;

  // res.cookie("user_id", id);
  req.session.user_id = id;
  console.log("users obj:", users);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
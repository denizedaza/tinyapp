const express = require("express");
const { generateRandomString, ifEmailExistsInUser, authenticateUser, urlsForUser } = require("./helpers");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

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
};

app.get("/", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.redirect("/login");
  }
  res.redirect("/urls");

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;

  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };

  if (!userId) {
    res.status(403).send("<h1>You must be <a href=\"/login\">logged in</a> or <a href=\"/register\">registered</a> to access URLs</h1>");
    return;
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId]
  };

  if (!userId) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("<h1>You must be logged in or register to access URLs</h1>");
  }

  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(403).send("The short URL you are trying to access does not exist");
  }

  const longURL = urlDatabase[shortURL].longURL;

  const templateVars = {
    shortURL,
    longURL,
    urlUserId: urlDatabase[shortURL].userID,
    user: users[userId]
  };

  const usersUrl = urlsForUser(userId, urlDatabase);
  // boolean value for whether the shortURL exists for the user and if the user signed in matches the userID found for this shortURL
  const urlBelongToUser = usersUrl[shortURL] && usersUrl[shortURL].userID === userId;

  if (!urlBelongToUser) {
    return res.status(403).send("<h1>You are not authorized to edit this URL</h1>");
  }

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(403).send("The short URL you are trying to access does not exist");
    return;
  }

  let longURLInput = urlDatabase[shortURL].longURL;

  // checking if user only types website without address heads (?) (ie only 'youtube.com'); otherwise will get 'undefined' error on longURL
  const httpWebAddr = "http://www.";
  const webAddr = "http://";

  if (!longURLInput.includes(httpWebAddr)) {
    longURLInput = httpWebAddr.concat(longURLInput);
  }
  if (!longURLInput.includes(webAddr)) {
    longURLInput = webAddr.concat(longURLInput);
  }
  return res.redirect(longURLInput);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: req.session.user_id
  };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render("urls_login", templateVars);
});


//-------- POST routes ----------- 
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (urlDatabase[shortURL] && req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
  res.status(403).send("You need to log in to delete URLs");
});

app.post("/urls/:id", (req, res) => {
  const shortUrlId = req.params.id;
  if (urlDatabase[shortUrlId] && req.session.user_id === urlDatabase[shortUrlId].userID) {
    urlDatabase[shortUrlId].longURL = req.body.longURL;
    return res.redirect("/urls");
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
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!ifEmailExistsInUser(email, users)) {
    return res.status(403).send("There is no account associated with this email address");
  }

  const user = authenticateUser(email, password, users);

  if (user) {
    req.session.user_id = user.id;
    return res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect email or password information");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, salt);

  if (!email || !password) {
    return res.status(400).send("Please include both a valid email and a password");
  }

  if (ifEmailExistsInUser(email, users)) {
    return res.status(400).send("An account already exists with this email address");
  }

  const newUser = {
    id,
    email,
    password
  };

  users[id] = newUser;

  req.session.user_id = id;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
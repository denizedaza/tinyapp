const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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
}

const ifEmailExistsInUser = (email, userDatabase) => {
  for(const user in userDatabase) {
    if(userDatabase[user].email === email) {
      return userDatabase[user];
    }
  }
  return false;
};

const authenticateUser = (email, password, database) => {
  const userFound = ifEmailExistsInUser(email, database);

  if (userFound && userFound.password === password) {
    return userFound;
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);

  console.log(req.body);  // Log the POST request body to the console
  const shortUrl = generateRandomString();
  res.redirect(`/urls/${shortUrl}`);
  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
  }
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longUrl = urlDatabase[req.params.shortURL];
  res.redirect(longUrl);
})

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

//accept registration info
app.get("/register", (req, res) => {
  
  const templateVars = {
      // email = req.params.email,
      user: users[req.cookies["user_id"]]
    }
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    // email = req.params.email,
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_login", templateVars);
})

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortUrlId = req.params.id;
  urlDatabase[shortUrlId].longURL = req.body.newURL;
  res.redirect("/urls");
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
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect email or password information");
  }


  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");

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

  res.cookie("user_id", id);
  console.log("users obj:", users);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
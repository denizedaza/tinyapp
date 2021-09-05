const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

const ifEmailExistsInUser = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user];
    }
  }
};

const authenticateUser = (email, password, database) => {
  const userFound = ifEmailExistsInUser(email, database);
  const hashedPassword = bcrypt.hashSync(password, salt);

  if (userFound) {
    if (bcrypt.compareSync(userFound.password, hashedPassword)) {
      return userFound;
    }
    return;
  }
};

const urlsForUser = (id, database) => {
  const userUrls = {};
  for (const shortUrl in database) {
    if (database[shortUrl].userID === id) {
      userUrls[shortUrl] = database[shortUrl];
    }
  }
  return userUrls;
};

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user].id;
    }
  }
}

module.exports = {
  generateRandomString,
  ifEmailExistsInUser,
  authenticateUser,
  urlsForUser,
  getUserByEmail
};
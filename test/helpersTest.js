const { assert } = require('chai');

const { getUserByEmail, generateRandomString, ifEmailExistsInUser, authenticateUser, urlsForUser, } = require('../helpers.js');

const testUsers = {
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

const testDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aj48lw"
  },
  psm5xK: {
    longURL: "http://www.google.com",
    userID: "aj48lw"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    
    assert.deepStrictEqual(user, expectedOutput);
  });
  it('should return undefined for a non-existent email', function() {
    const user = getUserByEmail("userTest@example.com", testUsers);
    
    assert.isUndefined(user);
  });
});

describe('generateRandomString', function() {
  it('should generate a string of six characters', function() {
    const randomStringLength = generateRandomString().length;
    const expectedOutput = 6;

    assert.equal(randomStringLength, expectedOutput);
  });
  it('should not generate identical strings when called multiple times', function() {
    const string1 = generateRandomString();
    const string2 = generateRandomString();

    assert.notEqual(string1, string2);
  });
});

describe('ifEmailExistsInUser', function() {
  it('should return user object if email exists in user database', function() {
    const userObj = ifEmailExistsInUser("user2@example.com", testUsers);
    const expectedOutput = {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    };

    assert.deepEqual(userObj, expectedOutput);
  });
  it('should return undefined when given an email that does not exist in the user database', function() {
    const result = ifEmailExistsInUser("abc@test.com", testUsers);

    assert.isUndefined(result);
  })
});

describe('authenticateUser', function() {
  it('should return an object if given the correct credentials for logging in', function() {
    const user = authenticateUser("user@example.com", "purple-monkey-dinosaur", testUsers);
    const expectedOutput = {
        id: "userRandomID", 
        email: "user@example.com", 
        password: "purple-monkey-dinosaur"
    };

    assert.deepEqual(user, expectedOutput);
  });
  it('should return undefined if given incorrect login credentials (incorrect email, correct password)', function() {
    const user = authenticateUser("abc@example.com", "purple-monkey-dinosaur", testUsers);
    
    assert.isUndefined(user);
  });
  it('should return undefined if given incorrect login credentials (correct email, incorrect password)', function() {
    const user = authenticateUser("user2@example.com", "ice-cream-soda", testUsers);
    
    assert.isUndefined(user);
  });
});

describe('urlsForUser', function() {
  it('should return an object of urls for a specific user given the correct user ID', function() {
    const testUser = urlsForUser("aj48lw", testDatabase);
    const expectedOutput = {
      b2xVn2: {
        longURL: "http://www.lighthouselabs.ca",
        userID: "aj48lw"
      },
      psm5xK: {
        longURL: "http://www.google.com",
        userID: "aj48lw"
      }
    };

    assert.deepEqual(testUser, expectedOutput);
  });
  it('should return an empty object if no urls exist for a given user ID', function() {
    const hasNoUrls = urlsForUser("fakeID-notOver21", testDatabase);
    const expectedOutput = {};

    assert.deepEqual(hasNoUrls, expectedOutput);
  });
})
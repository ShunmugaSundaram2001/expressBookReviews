const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const auth_users = express.Router();
let books = require("./booksdb.js");
const public_users = express.Router();
const regd_users = express.Router();

function getBooks() {
    return new Promise((resolve, reject) => {
        axios.get('http://your_api_url/books') // Replace 'http://your_api_url/books' with your API endpoint to fetch books
            .then(response => {
                resolve(response.data.books);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function getBookDetailsByISBN(isbn) {
    return new Promise((resolve, reject) => {
        axios.get(`http://your_api_url/books/isbn/${isbn}`) // Replace 'http://your_api_url/books/isbn/${isbn}' with your API endpoint to fetch book details by ISBN
            .then(response => {
                resolve(response.data.book);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function getBooksByAuthor(author) {
    return new Promise((resolve, reject) => {
        axios.get(`http://your_api_url/books/author/${author}`) // Replace 'http://your_api_url/books/author/${author}' with your API endpoint to fetch book details by author
            .then(response => {
                resolve(response.data.books);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function getBooksByTitle(title) {
    return new Promise((resolve, reject) => {
        axios.get(`http://your_api_url/books/title/${title}`) // Replace 'http://your_api_url/books/title/${title}' with your API endpoint to fetch book details by title
            .then(response => {
                resolve(response.data.books);
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Get book details based on title using async-await with Axios
public_users.get('/title/:title', async (req, res) => {
    const title = req.params.title;
    try {
        const booksByTitle = await getBooksByTitle(title);
        res.status(200).json({ books: booksByTitle });
    } catch (error) {
        res.status(500).json({ message: "Error fetching books by title." });
    }
});


// Get book details based on author using async-await with Axios
public_users.get('/author/:author', async (req, res) => {
    const author = req.params.author;
    try {
        const booksByAuthor = await getBooksByAuthor(author);
        res.status(200).json({ books: booksByAuthor });
    } catch (error) {
        res.status(500).json({ message: "Error fetching books by author." });
    }
});


// Get book details based on ISBN using async-await with Axios
public_users.get('/isbn/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    try {
        const bookDetails = await getBookDetailsByISBN(isbn);
        res.status(200).json({ book: bookDetails });
    } catch (error) {
        res.status(500).json({ message: "Error fetching book details." });
    }
});

// Get the list of books available in the shop using async-await with Axios
public_users.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        res.status(200).json({ books });
    } catch (error) {
        res.status(500).json({ message: "Error fetching books." });
    }
});


// Get the list of books available in the shop
public_users.get('/', function (req, res) {
  const bookList = Object.values(books);
  return res.status(200).json({ books: bookList });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];
  if (book) {
    return res.status(200).json({ book });
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const { author } = req.params;
  const authorBooks = Object.values(books).filter(book => book.author === author);
  if (authorBooks.length > 0) {
    return res.status(200).json({ books: authorBooks });
  } else {
    return res.status(404).json({ message: "Books by the author not found" });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const { title } = req.params;
  const titleBooks = Object.values(books).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
  if (titleBooks.length > 0) {
    return res.status(200).json({ books: titleBooks });
  } else {
    return res.status(404).json({ message: "Books with the title not found" });
  }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (!book) {
        return res.status(404).json({ message: "Book with the provided ISBN not found." });
    }

    const bookReviews = book.reviews;

    return res.status(200).json({ bookReviews });
});

let users = {};

public_users.post('/register', function (req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required for registration." });
    }

    if (users[username]) {
        return res.status(409).json({ message: "Username already exists. Please choose a different username." });
    }

    // If everything is fine, register the user
    users[username] = password;
    return res.status(201).json({ message: "User registered successfully." });
});


public_users.post('/login', function (req, res) {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required for login." });
    }

    // Check if the username exists and password matches
    if (!users[username] || users[username] !== password) {
        return res.status(401).json({ message: "Invalid username or password." });
    }

    // Sign a JWT token for the user
    const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });

    // Set the token in response headers or body
    return res.status(200).json({ message: "Login successful.", token });
});

public_users.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
}));

public_users.post('/review/:isbn', function (req, res) {
    const { isbn } = req.params;
    const review = req.query.review;

    // Check if the user is logged in
    if (!req.session.username) {
        return res.status(401).json({ message: "You must be logged in to add or modify a review." });
    }

    // Check if the ISBN exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Check if the review for the ISBN exists for the user
    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    if (!books[isbn].reviews[req.session.username]) {
        // Add a new review for the user
        books[isbn].reviews[req.session.username] = review;
        return res.status(201).json({ message: "Review added successfully." });
    } else {
        // Modify the existing review for the user
        books[isbn].reviews[req.session.username] = review;
        return res.status(200).json({ message: "Review modified successfully." });
    }
});

let bookReviews = {}; // Assuming book reviews are stored in an object

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.username; // Assuming username is stored in the session

    // Check if the user has reviewed this book
    if (bookReviews[isbn] && bookReviews[isbn][username]) {
        delete bookReviews[isbn][username];
        return res.status(200).json({ message: "Review deleted successfully." });
    } else {
        return res.status(404).json({ message: "Review not found." });
    }
});


module.exports = regd_users;
module.exports.general = public_users;

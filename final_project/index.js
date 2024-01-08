const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const genl_routes = require('./router/general.js').general;
const books = require('./router/booksdb.js'); // Import books data from booksdb.js

const app = express();

app.use(express.json());

app.use("/books", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true })); // Change route to /books

app.use("/books/auth/*", function auth(req, res, next) {
    // Your authentication logic here
    next();
});

const PORT = 5000;

app.use("/books", genl_routes); // Use general routes

app.get("/", (req, res) => {
    res.send("Welcome! This is the root endpoint.");
});

app.get("/books", (req, res) => {
    res.json(books); // Return books data
});

app.listen(PORT, () => console.log("Server is running"));

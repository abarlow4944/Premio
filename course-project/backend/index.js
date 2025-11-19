#!/usr/bin/env node
'use strict';

require('dotenv').config();

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();


const express = require("express");
const auth = require("./routes/auth.js");
const events = require("./routes/events.js");
const promo = require("./routes/promo.js");
const transactions = require("./routes/transaction.js");
const users = require("./routes/user.js");

const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



app.use(express.json());

// ADD YOUR WORK HERE
// mount routers
app.use("/auth", auth);
app.use("/events", events);
app.use("/promotions", promo);
app.use("/transactions", transactions);
app.use("/users", users);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

//////////////////////////////////////////////////////////////////////////// SERVER STUFF
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});
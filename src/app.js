const express = require("express");

const app = express();

// This is known as request handler
app.use("/", (req, res) => {
  res.send("Hello from server home");
});

app.use("/test", (req, res) => {
  res.send("hello from server");
});

app.use("/hello", (req, res) => {
  res.send("hello hello");
});

app.listen(3000);

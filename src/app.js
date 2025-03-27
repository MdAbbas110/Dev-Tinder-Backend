const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

app.post("/signup", (req, res) => {
  const userObj = {
    firstName: "Abbas",
    lastName: "Ali",
    email: "meerabbas.gmail.com",
    password: "123456",
  };

  // creating a new user with this data. New instance of the user model
  const user = new User(userObj);
});

connectDB()
  .then(() => {
    console.log("database connected");
    app.listen(3000, () => {
      console.log(
        "server started accepting req when db connect connects properly"
      );
    });
  })
  .catch((err) => console.log(err, "error in connecting db"));

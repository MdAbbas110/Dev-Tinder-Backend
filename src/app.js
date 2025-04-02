const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");

const app = express();
app.use(express.json());
app.use(cookieParser());

// Using all the routes defined
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);

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

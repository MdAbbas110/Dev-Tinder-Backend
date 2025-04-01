const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const cookieParser = require("cookie-parser");
const { validateSignUpData } = require("./utils/validation");
const { userAuth } = require("./middlewares/auth");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/signup", async (req, res) => {
  // first step is to perform the data validation form the req.body
  const { firstName, lastName, emailId, password } = req.body;
  try {
    validateSignUpData(req);
    // then we will encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);
    // then we will create the instance of the user model to store it in db.

    // created the new instance of the user model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });
    const dbPush = await user.save();
    res.json({
      user: dbPush._id,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).send("Error :" + error.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!validator.isEmail(emailId))
      throw new Error("Email or password is not valid");

    const user = await User.findOne({ emailId: emailId });
    if (!user) throw new Error("Revalidate the email or password");

    const isPasswordValid = user.validatePassword(password);

    if (isPasswordValid) {
      const token = user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 360000),
      });
      res.send("login successful token send");
      // add the token to cookies and send the response
    } else {
      throw new Error("Failed to login check email or password");
    }
  } catch (error) {
    res.status(500).send("Error :" + error.message);
  }
});

app.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("Error :" + error.message);
  }
});

app.post("/send-connect", userAuth, async (req, res) => {
  console.log("sending connect req");
  res.send("connect sent");
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

const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  // first step is to perform the data validation form the req.body

  // then we will encrypt the password
  // then we will create the instance of the user model to store it in db.

  const userObj = req.body;

  try {
    // created the new instance of the user model
    const user = new User(userObj);
    const dbPush = await user.save();
    res.json({
      user: dbPush._id,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//Get a single user
app.get("/user", async (req, res) => {
  const userEmail = req.body.email;

  try {
    const user = await User.findOne({ email: userEmail });
    user ? res.send(user) : res.send("User not found");
  } catch (error) {
    res.send("Internal server error to find");
  }
});

// THis feed api will get all the data
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    res.send("Internal server error to find");
  }
});

//Delete the id by userID
app.delete("/delete", async (req, res) => {
  const userId = req.body.userId;
  try {
    await User.findByIdAndDelete(userId);
    res.send("User deleted successfully");
  } catch (error) {
    res.send("Internal server error not deleted");
  }
});

//update the data of user
app.patch("/update/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;

  try {
    const ALLOWED_UPDATES = ["photoUrl", "about", "age", "gender", "skills"];
    const isUpdateAllowed = Object.keys(data).every((k) =>
      ALLOWED_UPDATES.includes(k)
    );

    if (!isUpdateAllowed) {
      throw new Error("Update not allowed on this field");
    }

    if (data.skills.length > 10)
      throw new Error("Skills should be less than 10");

    const user = await User.findByIdAndUpdate({ _id: userId }, data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.json(user);
  } catch (error) {
    res.send("Internal server error:" + error.message);
  }
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

const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  // job of this middleware is to read the cookies form req cookies

  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized User",
      });
    }

    const decodedObj = await jwt.verify(token, "DEV@TINDER$007");

    const { _id } = decodedObj;
    if (!_id) throw new Error("User not found");

    const user = await User.findById({ _id });
    if (!user) throw new Error("Failed to load the user");

    req.user = user;
    next();
  } catch (error) {
    res.status(400).send("Error: " + error.message);
  }
};

module.exports = { userAuth };

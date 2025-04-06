const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");

const profileRouter = express.Router();

profileRouter.get("/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      message: "User Profile",
      data: user,
    });
  } catch (error) {
    res.status(400).send("Error :" + error.message);
  }
});

profileRouter.patch("/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid edit request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      message: loggedInUser.firstName + " your profile information edited",
      data: loggedInUser,
    });
  } catch (error) {
    res.status(400).send("Error : " + error);
  }
});

profileRouter.post("/reset/password", userAuth, async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const isValidPassword = await bcrypt.compare(
      oldPassword,
      req.user.password
    );

    if (!isValidPassword)
      res.status(400).json({ error: "Incorrect old password" });

    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Enter a strong new password" });
    }

    if (newPassword !== confirmPassword)
      res.json({ error: "New password and confirm password must match" });

    req.user.password = newPassword;
    await req.user.save();

    res.status(200).json({ message: "Password successfully updated" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

profileRouter.post("/forgot/password", userAuth, (req, res) => {
  const { emailId } = req.body;
});

module.exports = profileRouter;

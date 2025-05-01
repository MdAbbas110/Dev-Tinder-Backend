const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { validateSignUpData } = require("../utils/validation");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    // Destructure all possible fields from req.body
    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      photoUrl,
      about,
      skills,
    } = req.body;

    // Validate signup data
    validateSignUpData(req);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user object with all possible fields
    const userData = {
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      // Only include optional fields if they're provided
      ...(age && { age: Number(age) }),
      ...(gender && { gender }),
      ...(photoUrl && { photoUrl }),
      ...(about && { about }),
      ...(skills && { skills }),
    };

    // Create and save user
    const user = new User(userData);
    const savedUser = await user.save();

    // Generate JWT token using your schema method
    const { token, expiresAt } = await savedUser.getJWT();

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(expiresAt), // Use the expiration timestamp
    });

    // Send structured response
    res.status(201).json({
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    // Proper error handling with specific status codes
    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (error.code === 11000) {
      // MongoDB duplicate key error
      statusCode = 409;
      errorMessage = "Email already exists";
    } else if (error.name === "ValidationError") {
      // Mongoose validation error
      statusCode = 400;
      errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
    } else if (error.name === "SignUpValidationError") {
      // Your custom validation error
      statusCode = 400;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        message: errorMessage,
        code: statusCode,
      },
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId))
      throw new Error("Email or password is not valid");

    const user = await User.findOne({ emailId: emailId });

    if (!user) throw new Error("Revalidate the email or password");

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const { token, expiresAt } = await user.getJWT();

      res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(expiresAt), // Use the expiration timestamp
      });

      res.status(200).json({
        success: true,
        data: user,
      });
      // added the token to cookies and send the response
    } else {
      throw new Error("Failed to login check email or password");
    }
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout Successful!!");
});

module.exports = authRouter;

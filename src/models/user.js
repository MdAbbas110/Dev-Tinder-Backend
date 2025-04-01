//User schema what field user will have in database
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minLength: 4, maxLength: 30 },

    lastName: { type: String },

    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is not valid");
        }
      },
    },

    password: {
      type: String,
      required: true,
    },

    age: { type: Number, min: 18 },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "others"].includes(value)) {
          throw new Error("Gender data is not valid");
        }
      },
    },

    photoUrl: {
      type: String,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Photo URL is not valid");
        }
      },
      default:
        "https://thumbs.dreamstime.com/b/blank-grey-scale-profile-picture-placeholder-suitable-representing-user-avatar-contact-generic-style-short-hair-335067558.jpg",
    },

    about: { type: String, default: "fallback default user info" },

    skills: { type: [String] },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, "DEV@TINDER$007", {
    expiresIn: "7d",
  });
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    user.password
  );

  return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);

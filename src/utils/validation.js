const validator = require("validator");

const validateSignUpData = (req) => {
  // first will extract the data form the req body
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName)
    throw new Error("First name and last name are required");
  else if (!validator.isEmail(emailId)) throw new Error("Email is not valid");
  else if (!validator.isStrongPassword(password))
    throw new Error("Please enter a strong password");
};

const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "age",
    "skills",
    "gender",
    "photoUrl",
    "about",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );

  return isEditAllowed;
};

const validateResetPasswordData = (req) => {
  const allowedEditFields = ["password"];
};

module.exports = {
  validateSignUpData,
  validateEditProfileData,
};

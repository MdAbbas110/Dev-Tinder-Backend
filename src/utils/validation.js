const validator = require("validator");

// Improved validation function
const validateSignUpData = (req) => {
  const { firstName, emailId, password } = req.body;

  if (!firstName || firstName.length < 4 || firstName.length > 30) {
    throw new SignUpValidationError(
      "First name must be between 4 and 30 characters"
    );
  }

  if (!emailId || !validator.isEmail(emailId)) {
    throw new SignUpValidationError("Valid email is required");
  }

  if (!password || password.length < 6) {
    throw new SignUpValidationError(
      "Password must be at least 6 characters long"
    );
  }

  // Add password strength validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new SignUpValidationError(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    );
  }

  return true;
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

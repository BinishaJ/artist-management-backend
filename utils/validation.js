const Joi = require("joi");

// Schema for registration
const registerSchema = (data) => {
  const schema = Joi.object({
    first_name: Joi.string().required().max(255).messages({
      "any.empty": "First Name is required!",
      "any.required": "First Name is required!",
    }),
    last_name: Joi.string().required().max(255).messages({
      "any.empty": "Last Name is required!",
      "any.required": "Last Name is required!",
    }),
    email: Joi.string().email().required().max(255).messages({
      "string.email": "Enter a valid email!",
      "any.empty": "Email is required!",
      "any.required": "Email is required!",
    }),
    password: Joi.string().min(8).required().max(500).messages({
      "string.min": "Password must be at least 8 characters!",
      "any.empty": "Password is required!",
      "any.required": "Password is required!",
    }),
    phone: Joi.string().required().max(20).messages({
      "any.empty": "Phone is required!",
      "any.required": "Phone is required!",
    }),
    dob: Joi.date().iso().required().messages({
      "date.base": "Date of Birth must be a valid date!",
      "any.empty": "Date of Birth is required!",
      "any.required": "Date of Birth is required!",
    }),
    gender: Joi.string().valid("m", "f", "o").required().messages({
      "any.only": "Gender must be 'm', 'f', or 'o'!",
      "any.empty": "Gender is required!",
      "any.required": "Gender is required!",
    }),
    address: Joi.string().required().max(255).messages({
      "any.empty": "Address is required!",
      "any.required": "Address is required!",
    }),
  });
  return schema.validate(data);
};

// Schema for login
const loginSchema = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().max(255).messages({
      "string.email": "Enter a valid email!",
      "any.empty": "Email is required!",
      "any.required": "Email is required!",
    }),
    password: Joi.string().required().max(500).messages({
      "any.empty": "Password is required!",
      "any.required": "Password is required!",
    }),
  });
  return schema.validate(data);
};

// Schema for updating user
const userUpdateSchema = (data) => {
  const schema = Joi.object({
    first_name: Joi.string().max(255),
    last_name: Joi.string().max(255),
    phone: Joi.string().max(20),
    dob: Joi.date().iso().messages({
      "date.base": "Date of Birth must be a valid date!",
    }),
    gender: Joi.string().valid("m", "f", "o").messages({
      "any.only": "Gender must be 'm', 'f', or 'o'!",
    }),
    address: Joi.string().max(255),
  });
  return schema.validate(data);
};

// Schema for artist
const artistSchema = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().max(255).messages({
      "any.empty": "Name is required!",
      "any.required": "Name is required!",
    }),
    dob: Joi.date().iso().required().messages({
      "date.base": "Date of Birth must be a valid date!",
      "any.empty": "Date of Birth is required!",
      "any.required": "Date of Birth is required!",
    }),
    gender: Joi.string().valid("m", "f", "o").required().messages({
      "any.only": "Gender must be 'm', 'f', or 'o'!",
      "any.empty": "Gender is required!",
      "any.required": "Gender is required!",
    }),
    address: Joi.string().required().max(255).messages({
      "any.empty": "Address is required!",
      "any.required": "Address is required!",
    }),
    first_release_year: Joi.number()
      .integer()
      .min(1000)
      .max(new Date().getFullYear())
      .required()
      .messages({
        "number.integer": "Release year must be a valid year",
        "number.min": "Release year must be a valid year",
        "number.max":
          "Release year must be less than or equal to the current year",
        "number.base": "Release year must be a valid year",
        "any.empty": "Release year is required!",
        "any.required": "Release year is required!",
      }),
    no_of_albums_released: Joi.number().integer().required().messages({
      "any.empty": "Number of albums released is required!",
      "any.required": "Number of albums released  is required!",
    }),
  });
  return schema.validate(data);
};

// Schema for artist update
const updateArtistSchema = (data) => {
  const schema = Joi.object({
    dob: Joi.date().iso().messages({
      "date.base": "Date of Birth must be a valid date!",
    }),
    gender: Joi.string().valid("m", "f", "o").messages({
      "any.only": "Gender must be 'm', 'f', or 'o'!",
    }),
    address: Joi.string().max(255),
    first_release_year: Joi.number()
      .integer()
      .min(1000)
      .max(new Date().getFullYear())
      .messages({
        "number.integer": "Release year must be a valid year",
        "number.min": "Release year must be a valid year",
        "number.max":
          "Release year must be less than or equal to the current year",
        "number.base": "Release year must be a valid year",
      }),
    no_of_albums_released: Joi.number().integer(),
  });
  return schema.validate(data);
};

// Schema for song
const songSchema = (data) => {
  const schema = Joi.object({
    artist_id: Joi.number().integer().required().messages({
      "any.empty": "Artist ID is required!",
      "any.required": "Artist ID is required!",
      "number.base": "Artist ID must be a number",
      "number.integer": "Artist ID must be a number",
    }),
    title: Joi.string().required().max(255).messages({
      "any.empty": "Title is required!",
      "any.required": "Title is required!",
    }),
    album_name: Joi.string().required().max(255).messages({
      "any.empty": "Album Name is required!",
      "any.required": "Album Name is required!",
    }),
    genre: Joi.string()
      .valid("rnb", "country", "classic", "rock", "jazz")
      .required()
      .messages({
        "any.only":
          "Genre must be 'rnb', 'country', 'classic', 'rock', 'jazz'!",
        "any.empty": "Genre is required!",
        "any.required": "Genre is required!",
      }),
  });
  return schema.validate(data);
};

module.exports = {
  registerSchema,
  loginSchema,
  userUpdateSchema,
  artistSchema,
  updateArtistSchema,
  songSchema,
};

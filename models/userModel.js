const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default:
        'https://gravatar.com/avatar/264cf395ab3bb310cd6747b71dd5f744?s=400&d=robohash&r=x',
    },

    role: {
      type: String,
      default: 'user',
    },

    gender: {
      type: String,
      default: 'male',
    },
    mobile: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    story: {
      type: String,
      default: '',
      maxlength: 200,
    },
    website: {
      type: String,
      default: '',
    },

    followers: [
      {
        type: mongoose.Types.ObjectId, // retrieve uuid of a user object
        ref: 'user',
      },
    ],
    following: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'user',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('user', userSchema);

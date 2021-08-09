const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authCtrl = {
  register: async (req, res) => {
    try {
      // destructure user fields from the request body
      const { fullname, username, email, password, gender } = req.body;
      console.log(fullname);
      console.log(username);
      let newUserName = username.toLowerCase().replace('/ /g', '');
      console.log(newUserName);
      // find username in db to see if it exists using findOne query
      const userName = await Users.findOne({ username: newUserName });
      if (userName) {
        return res.status(400).json({ msg: 'This username already exists' });
      }
      // find user's email in db to see if it exists and if it does send a message that user email already exists
      const userEmail = await Users.findOne({ email });
      if (userEmail) {
        return res.status(400).json({ msg: 'This email already exists' });
      }

      // enforce password constraints
      if (password.length < 6) {
        return res
          .status(400)
          .json({ msg: 'Password must be at least six characters' });
      }

      // hash the password
      const passwordHash = await bcrypt.hash(password, 12);

      // create a new schema for the new user
      const newUser = new Users({
        fullname,
        username: newUserName,
        email,
        password: passwordHash,
        gender,
      });

      //create access and refresh tokens
      const access_token = createAccessToken({ id: newUser });
      const refresh_token = createRefreshToken({ id: newUser._id });

      //set a refresh token in order to generate new access token when required
      res.cookie('refreshtoken', refresh_token, {
        httpOnly: true,
        path: '/api/refresh_token',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Then save the user into the db
      await newUser.save();

      //send response
      res.json({
        msg: 'Register Successful!!!',
        access_token,
        user: {
          ...newUser._doc,
          password: '',
        },
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  login: async (req, res) => {
    try {
      // Extract email and password from request body
      const { email, password } = req.body;

      // Find user by email and populate user's followers and following with the avatar username fullname and followers following fields
      const user = await Users.findOne({ email }).populate(
        'followers following',
        'avatar username fullname followers following'
      );

      // User validation checks
      if (!user) {
        return res.status(400).json({ msg: "This email doesn't exist" });
      }

      // comparing passwords to see if they match with the user's password field
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Password is incorrect' });
      }

      // generating access_token and refresh_token
      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      //storing a refresh token to a cookie
      res.cookie('refreshtoken', refresh_token, {
        httpOnly: true,
        path: '/api/refresh_token',
        maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
      });

      // sending response
      res.json({
        msg: 'Login Successful!!!',
        access_token,
        user: {
          ...user._doc,
          password: '',
        },
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  logout: async (req, res) => {
    try {
      // clear refresh token
      res.clearCookie('refreshtoken', { path: 'api/refresh_token' });
      return res.json({ msg: 'Logged out!!!' });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  generateAccessToken: async (req, res) => {
    try {
      // Retrieve refresh token from the cookies member in request
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) return res.status(400).json({ msg: 'Please login now' });

      // verify the refresh token
      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) return result.status(400).json({ msg: 'Please login now' });

          // finds users by it's id
          const user = await Users.findById(result.id)
            .select('-password')
            .populate(
              'followers following',
              'avatar username fullname followers following'
            );

          if (!user)
            return result.status(400).json({ msg: "This user doesn't exist" });

          // generates a new access token with that id as the parameter
          const access_token = createAccessToken({ id: result.id });

          // returns the new access token associated with that particular user
          res.json({
            access_token,
            user,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

// helper functions to create access and refresh tokens
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1d',
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = authCtrl;

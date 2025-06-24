require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // Body parser to handle JSON requests

// --- MongoDB Connection ---
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit process with failure
  });

// --- User Schema and Model ---
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Remove whitespace from both ends of a string
    minlength: 3 // Minimum username length
  },
  password: {
    type: String,
    required: true,
    minlength: 6 // Minimum password length
  },
  // You can add more fields here later, e.g., score, level, skills, etc.
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// --- Routes ---

// @route   POST /api/register
// @desc    Register a new user
// @access  Public
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Username already taken. Please choose a different one.' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create new user instance
    user = new User({
      username,
      password: hashedPassword,
    });

    // 4. Save user to database
    await user.save();

    // 5. Respond with success
    res.status(201).json({ msg: 'Registration successful! You can now log in.' });

  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.code === 11000) { // Duplicate key error (for unique username)
      return res.status(400).json({ msg: 'Username already exists.' });
    }
    res.status(500).send('Server Error during registration.');
  }
});

// @route   POST /api/login
// @desc    Authenticate user & get token (conceptual)
// @access  Public
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials (username not found)' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials (incorrect password)' });
    }

    // 3. Respond with success (In a real app, you'd generate a JWT token here)
    // For now, we'll just send a success message and the username.
    res.json({ msg: 'Logged in successfully!', username: user.username });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server Error during login.');
  }
});

// Basic test route
app.get('/', (req, res) => {
  res.send('Mathrix Backend API is running!');
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//This is to connect it to the database
const User = require('c:/Users/samir/Downloads/lockbox-backend/models/user');
const mongoose = require('mongoose');

mongoose
  .connect('mongodb://127.0.0.1:27017/lockbox', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

app.use(express.json());

// Route for the home page
app.get('/', (req, res) => {
  res.send('LockBox backend is running!');
});

// Registration Route
app.post(
  '/register',
  // Validation for the input data
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  // Handle registration
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  }
);

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'User not found!' });
  }

  // Compare the password with the hashed password stored in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid credentials!' });
  }

  res.status(200).json({ message: 'Login successful!' });
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

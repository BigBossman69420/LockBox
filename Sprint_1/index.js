// Load environment variables
require('dotenv').config();

// Core dependencies
const { encrypt, decrypt } = require('./utils/encryption.js');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const cors = require('cors');

// Models & Middleware
const User = require('./models/user.js');
const Credential = require('./models/credential.js');
const authenticate = require('./middleware/authenticate.js');

// Config
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../Website')));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/lockbox', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

app.post(
  '/register',
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists!' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials!' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Credentials (Vault)
app.get('/vault', authenticate, async (req, res) => {
  try {
    const credentials = await Credential.find({ userId: req.user.id });

    const decryptedCredentials = credentials.map(cred => ({
      _id: cred._id,
      site: cred.site,
      username: cred.username,
      password: decrypt(cred.password), // 🔓 Decrypt password
    }));

    res.json(decryptedCredentials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching credentials' });
  }
});
// Add Credential
app.post('/credentials', authenticate, async (req, res) => {
  const { site, username, password } = req.body;

  if (!site || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const encryptedPassword = encrypt(password); // 🔐 Encrypt password

    const newCredential = new Credential({
      site,
      username,
      password: encryptedPassword,
      userId: req.user.id,
    });

    await newCredential.save();
    res.status(201).json({ message: 'Credential added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});

app.delete('/credentials/:id', authenticate, async (req, res) => {
  const credentialId = req.params.id;

  try {
    const deleted = await Credential.findOneAndDelete({
      _id: credentialId,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Credential not found or unauthorized' });
    }

    res.json({ message: 'Credential deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});
app.put('/credentials/:id', authenticate, async (req, res) => {
  const credentialId = req.params.id;
  const { site, username, password } = req.body;

  try {
    const encryptedPassword = encrypt(password); // Encrypt before update

    const updated = await Credential.findOneAndUpdate(
      { _id: credentialId, userId: req.user.id },
      { site, username, password: encryptedPassword },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Credential not found or unauthorized' });
    }

    res.json({ message: 'Credential updated successfully.', credential: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Protected Example Route
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: 'This is protected data!', user: req.user });
});

function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Password Generator
// GET /generate-password?length=16
app.get('/generate-password', authenticate, (req, res) => {
  const { length = 12 } = req.query;
  const pwd = generatePassword(parseInt(length, 10));
  res.json({ password: pwd });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

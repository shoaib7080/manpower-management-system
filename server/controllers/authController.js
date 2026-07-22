import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ROLE_LEVELS } from '../config/constants.js';
import User from '../models/User.js';

// Helper: Sign JWT Token
const generateToken = (id, level) => {
  return jwt.sign({ id, level }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        token: generateToken(user._id, user.level),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// @desc    Register a new user (Restricted to Level 1 Admin)
// @route   POST /api/auth/register
// @access  Protected (Admin Level 1 Only)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, level } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      level: level || ROLE_LEVELS.PROJECT_ENGINEER, // Defaults to Level 2 Engineer
    });

    res.status(201).json({
      message: `User ${user.name} created successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'User registration failed', error: error.message });
  }
};
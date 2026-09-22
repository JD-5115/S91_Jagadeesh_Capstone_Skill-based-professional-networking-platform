const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Post = require('./models/Post');

require('dotenv').config({ path: path.join(__dirname, 'atlas-credentials.env') });

const app = express();
app.use(cors());
app.use(express.json());

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
};

const normalizeUsername = (username) => username.trim().toLowerCase();
const jwtSecret = process.env.JWT_SECRET || 'skilllink-development-secret';

const findUser = (username) => User.findOne({ username: normalizeUsername(username) });

const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'A valid access token is required.' });
  try {
    req.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: 'The access token is invalid or expired.' });
  }
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name?.trim() || !username?.trim() || !password || password.length < 6) {
      return res.status(400).json({ message: 'Name, username, and a password of at least 6 characters are required.' });
    }

    const normalizedUsername = normalizeUsername(username);
    if (await User.findOne({ username: normalizedUsername })) {
      return res.status(409).json({ message: 'That username is already registered. Please choose another.' });
    }

    await User.create({
      username: normalizedUsername,
      email: normalizedUsername,
      password: hashPassword(password),
      bio: name.trim(),
    });
    return res.status(201).json({ message: 'Account created. You can now log in.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That username is already registered. Please choose another.' });
    console.error('Signup failed:', error.message);
    return res.status(500).json({ message: 'Unable to create the account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password) return res.status(400).json({ message: 'Username and password are required.' });
    const user = await findUser(username);
    if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ message: 'Invalid username or password.' });
    const token = jwt.sign({ sub: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: '1h' });
    return res.json({ token, username: user.username, bio: user.bio, skills: user.skills });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ message: 'Unable to log in right now.' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username bio skills connections createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(users);
  } catch (error) {
    console.error('Users lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to load users right now.' });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await findUser(req.params.username)
      .select('-password -email')
      .populate('connections', 'username bio skills')
      .populate('posts', 'title description createdAt');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(user);
  } catch (error) {
    console.error('Profile lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to load the profile right now.' });
  }
});

app.put('/api/users/:username', requireAuth, async (req, res) => {
  try {
    if (req.auth.username !== normalizeUsername(req.params.username)) return res.status(403).json({ message: 'You can only update your own profile.' });
    const updates = {};
    if (typeof req.body.bio === 'string') updates.bio = req.body.bio.trim();
    if (Array.isArray(req.body.skills)) updates.skills = req.body.skills.filter((skill) => typeof skill === 'string' && skill.trim()).map((skill) => skill.trim());
    const user = await findUser(req.params.username);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    Object.assign(user, updates);
    await user.save();
    return res.json({ username: user.username, bio: user.bio, skills: user.skills });
  } catch (error) {
    console.error('Profile update failed:', error.message);
    return res.status(500).json({ message: 'Unable to update the profile right now.' });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username bio').sort({ createdAt: -1 });
    return res.json(posts);
  } catch (error) {
    console.error('Post lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to load posts right now.' });
  }
});

app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const { title, description, username } = req.body;
    if (!title?.trim() || !description?.trim() || !username?.trim()) {
      return res.status(400).json({ message: 'Title, description, and username are required.' });
    }
    const author = await findUser(username);
    if (!author) return res.status(404).json({ message: 'Author not found.' });
    if (req.auth.sub !== author._id.toString()) return res.status(403).json({ message: 'You can only create posts as yourself.' });
    const post = await Post.create({ title: title.trim(), description: description.trim(), author: author._id });
    return res.status(201).json(await post.populate('author', 'username bio'));
  } catch (error) {
    console.error('Post creation failed:', error.message);
    return res.status(500).json({ message: 'Unable to create the post right now.' });
  }
});

app.put('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.title === 'string' && req.body.title.trim()) updates.title = req.body.title.trim();
    if (typeof req.body.description === 'string' && req.body.description.trim()) updates.description = req.body.description.trim();
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'A title or description is required.' });

    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) return res.status(404).json({ message: 'Post not found.' });
    if (req.auth.sub !== existingPost.author.toString()) return res.status(403).json({ message: 'You can only update your own posts.' });
    const post = await Post.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('author', 'username bio');
    return res.json(post);
  } catch (error) {
    console.error('Post update failed:', error.message);
    return res.status(500).json({ message: 'Unable to update the post right now.' });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) return res.status(404).json({ message: 'Post not found.' });
    if (req.auth.sub !== existingPost.author.toString()) return res.status(403).json({ message: 'You can only delete your own posts.' });
    const post = await Post.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Post deletion failed:', error.message);
    return res.status(500).json({ message: 'Unable to delete the post right now.' });
  }
});

app.post('/api/users/:username/connections', requireAuth, async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (req.auth.username !== normalizeUsername(req.params.username)) return res.status(403).json({ message: 'You can only manage your own connections.' });
    const user = await findUser(req.params.username);
    const targetUser = targetUsername ? await findUser(targetUsername) : null;
    if (!user || !targetUser) return res.status(404).json({ message: 'Both users must exist.' });
    if (user.id === targetUser.id) return res.status(400).json({ message: 'You cannot connect with yourself.' });

    await Promise.all([
      User.updateOne({ _id: user._id }, { $addToSet: { connections: targetUser._id } }),
      User.updateOne({ _id: targetUser._id }, { $addToSet: { connections: user._id } }),
    ]);
    return res.status(201).json({ message: 'Connection created.' });
  } catch (error) {
    console.error('Connection creation failed:', error.message);
    return res.status(500).json({ message: 'Unable to create the connection right now.' });
  }
});

// Example route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!mongoUri) throw new Error('MONGO_URI or MONGODB_URI is not configured.');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});

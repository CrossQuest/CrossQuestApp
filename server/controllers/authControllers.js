const User = require('../models/User');

exports.registerUser = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    // Request needs a body
    if (!req.body) {
      return res.status(400).send({ message: 'Username and password required' });
    }

    // Body needs a username, password, name, and email
    const { username, password, name, email } = req.body;
    console.log('Extracted fields:', { username, name, email, password: password ? '***' : 'undefined' });
    
    if (!username || !password || !name || !email) {
      return res.status(400).send({ message: 'Username, password, name, and email required' });
    }

    // User.create will handle hashing the password and storing in the database
    // Temporarily use empty strings for name and email until database is updated
    console.log('Creating user with:', { username, name, email });
    const user = await User.create(username, password, name || '', email || '');
    console.log('User created:', user);

    // Add the user id to the cookie and send the user data back
    req.session.userId = user.id;
    console.log('Session userId set:', req.session.userId);
    console.log('Session after setting userId:', req.session);
    
    res.send(user);
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific database errors
    if (error.code === '23505' && error.constraint === 'users_username_unique') {
      return res.status(400).send({ message: 'Username already exists. Please choose a different username.' });
    }
    
    res.status(500).send({ message: 'Registration failed', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  // Request needs a body
  if (!req.body) {
    return res.status(400).send({ message: 'Username and password required' });
  }

  // Body needs a username and password
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ message: 'Username and password required' });
  }

  // Username must be valid
  const user = await User.findByUsername(username);
  if (!user) {
    return res.status(404).send({ message: 'User not found.' });
  }

  // Password must match
  const isPasswordValid = await user.isValidPassword(password);
  if (!isPasswordValid) {
    return res.status(401).send({ message: 'Invalid credentials.' });
  }

  // Add the user id to the cookie and send the user data back
  req.session.userId = user.id;
  res.send(user);
};


exports.showMe = async (req, res) => {
  console.log('showMe called - session:', req.session);
  console.log('showMe called - userId:', req.session.userId);
  
  // no cookie with an id => Not authenticated.
  if (!req.session.userId) {
    console.log('No userId in session - returning 401');
    return res.status(401).send({ message: "User must be authenticated." });
  }

  // cookie with an id => here's your user info!
  const user = await User.find(req.session.userId);
  console.log('User found:', user);
  res.send(user);
};

exports.logoutUser = (req, res) => {
  req.session = null; // "erase" the cookie
  res.status(204).send({ message: "User logged out." });
};
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;

export const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, wholesaler = false } = req.query;

    const offset = (page - 1) * limit;
    const filterWholesaler = wholesaler === 'true';

    const users = await User.searchUsers(search, parseInt(limit), parseInt(offset), filterWholesaler);
    const totalCount = await User.getUsersCount(search, filterWholesaler);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, phone, password, is_wholesaler } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = await User.create({ 
      name, 
      phone, 
      password: hashedPassword, 
      is_wholesaler
    });
    
    res.status(201).json(newUser[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, saltRounds);
    }
    
    const updatedUser = await User.update(id, updates);
    res.json(updatedUser[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const toggleWholesaler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.getById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await User.update(id, { is_wholesaler: !user.is_wholesaler });
    res.json(updatedUser[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

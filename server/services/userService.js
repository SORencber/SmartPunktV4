const User = require('../models/User');

class UserService {
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await User.findOne({ email }).populate('branchId');
    } catch (error) {
      throw error;
    }
  }

  async findUserById(id) {
    try {
      return await User.findById(id).populate('branchId');
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      return await User.findByIdAndUpdate(id, updateData, { new: true }).populate('branchId');
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return await User.find().populate('branchId');
    } catch (error) {
      throw error;
    }
  }

  async updateLastLogin(id) {
    try {
      return await User.findByIdAndUpdate(id, { lastLogin: new Date() }, { new: true });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
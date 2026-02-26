const db = require('../../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await db.query(
        'SELECT id, email, name, company, role FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    const { email, password, name, company } = userData;
    
    try {
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert user
      const result = await db.query(
        `INSERT INTO users (email, password_hash, name, company) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, company, role`,
        [email, passwordHash, name, company]
      );
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  // Update user
  static async update(id, updates) {
    const { name, company } = updates;
    
    try {
      const result = await db.query(
        `UPDATE users 
         SET name = $2, company = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, name, company, role`,
        [id, name, company]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

module.exports = UserModel;

const db = require('../../config/database');

class ProjectModel {
  // Get all projects for a user
  static async findByUserId(userId) {
    try {
      const result = await db.query(
        `SELECT * FROM projects 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding projects:', error);
      throw error;
    }
  }

  // Get single project
  static async findById(id, userId) {
    try {
      const result = await db.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding project:', error);
      throw error;
    }
  }

  // Create new project
  static async create(projectData) {
    const { user_id, name, campaign_name, industry, project_type, description, settings } = projectData;
    
    try {
      const result = await db.query(
        `INSERT INTO projects 
         (user_id, name, campaign_name, industry, project_type, description, settings) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [user_id, name, campaign_name, industry, project_type, description, settings || {}]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Update project
  static async update(id, userId, updates) {
    const { name, campaign_name, industry, project_type, description, status, settings } = updates;
    
    try {
      const result = await db.query(
        `UPDATE projects 
         SET name = COALESCE($3, name),
             campaign_name = COALESCE($4, campaign_name),
             industry = COALESCE($5, industry),
             project_type = COALESCE($6, project_type),
             description = COALESCE($7, description),
             status = COALESCE($8, status),
             settings = COALESCE($9, settings),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId, name, campaign_name, industry, project_type, description, status, settings]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Delete project
  static async delete(id, userId) {
    try {
      const result = await db.query(
        'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
}

module.exports = ProjectModel;

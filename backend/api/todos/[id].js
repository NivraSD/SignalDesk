// In-memory storage (shared with index.js - in production this would be a database)
let todos = [
  { 
    id: 1, 
    title: 'Welcome to SignalDesk', 
    description: 'Explore the platform features',
    status: 'pending',
    priority: 'medium',
    project_id: 1,
    user_id: 1,
    created_at: new Date().toISOString(),
    due_date: null
  }
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  const todoId = parseInt(id);
  
  if (!todoId || isNaN(todoId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid todo ID'
    });
  }
  
  const todoIndex = todos.findIndex(t => t.id === todoId);
  
  // GET - Get single todo
  if (req.method === 'GET') {
    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      todo: todos[todoIndex]
    });
  }
  
  // PUT - Update todo
  if (req.method === 'PUT') {
    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    const { title, description, status, priority, due_date, project_id } = req.body;
    
    if (title && typeof title === 'string') {
      todos[todoIndex].title = title.trim();
    }
    if (description !== undefined) {
      todos[todoIndex].description = description;
    }
    if (status !== undefined) {
      todos[todoIndex].status = status;
      // Mark completion time if status changes to completed
      if (status === 'completed' && todos[todoIndex].status !== 'completed') {
        todos[todoIndex].completed_at = new Date().toISOString();
      }
    }
    if (priority !== undefined) {
      todos[todoIndex].priority = priority;
    }
    if (due_date !== undefined) {
      todos[todoIndex].due_date = due_date;
    }
    if (project_id !== undefined) {
      todos[todoIndex].project_id = project_id ? parseInt(project_id) : null;
    }
    
    todos[todoIndex].updated_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      todo: todos[todoIndex],
      message: 'Todo updated successfully'
    });
  }
  
  // DELETE - Delete todo
  if (req.method === 'DELETE') {
    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    const deletedTodo = todos.splice(todoIndex, 1)[0];
    
    return res.status(200).json({
      success: true,
      message: 'Todo deleted successfully',
      todo: deletedTodo
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
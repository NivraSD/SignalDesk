// In-memory storage for demo (replace with database in production)
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
let nextTodoId = 2;

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET - List all todos
  if (req.method === 'GET') {
    const { project_id } = req.query;
    
    let filteredTodos = todos;
    if (project_id) {
      filteredTodos = todos.filter(t => t.project_id === parseInt(project_id));
    }
    
    return res.status(200).json({
      success: true,
      todos: filteredTodos
    });
  }
  
  // POST - Create new todo
  if (req.method === 'POST') {
    const { title, description, status, priority, project_id, due_date } = req.body;
    
    // Validation
    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Todo title is required'
      });
    }
    
    const newTodo = {
      id: nextTodoId++,
      title: title.trim(),
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      project_id: project_id ? parseInt(project_id) : null,
      user_id: 1, // Demo user
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: due_date || null,
      completed_at: null
    };
    
    todos.push(newTodo);
    
    return res.status(201).json({
      success: true,
      todo: newTodo,
      message: 'Todo created successfully'
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
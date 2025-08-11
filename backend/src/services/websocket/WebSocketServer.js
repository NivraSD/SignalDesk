// WebSocket Server for Real-Time Features
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Redis = require('redis');

class WebSocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.redis = null;
    this.rooms = new Map(); // Room management
    this.userSessions = new Map(); // User session tracking
    this.contextSessions = new Map(); // AI context sessions
    
    this.initializeRedis();
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupHeartbeat();
  }

  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      await this.redis.connect();
      console.log('✅ Redis connected for WebSocket server');

      // Subscribe to Redis pub/sub for cross-server communication
      const subscriber = this.redis.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe('signaldesk:updates', (message) => {
        this.broadcastUpdate(JSON.parse(message));
      });
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      // Continue without Redis (single-server mode)
    }
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.userId;
        socket.user = decoded;
        
        // Track user session
        this.userSessions.set(socket.userId, {
          socketId: socket.id,
          connectedAt: new Date(),
          lastActivity: new Date()
        });

        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 User ${socket.userId} connected via WebSocket`);

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Join project rooms
      socket.on('join:project', async (projectId) => {
        await this.joinProjectRoom(socket, projectId);
      });

      // Leave project room
      socket.on('leave:project', async (projectId) => {
        await this.leaveProjectRoom(socket, projectId);
      });

      // MemoryVault real-time updates
      socket.on('memoryvault:update', async (data) => {
        await this.handleMemoryVaultUpdate(socket, data);
      });

      // AI Assistant context sync
      socket.on('ai:context:sync', async (data) => {
        await this.handleAIContextSync(socket, data);
      });

      // Campaign orchestrator events
      socket.on('campaign:task:update', async (data) => {
        await this.handleCampaignTaskUpdate(socket, data);
      });

      // Monitoring live feed
      socket.on('monitoring:subscribe', async (targets) => {
        await this.subscribeToMonitoring(socket, targets);
      });

      // Collaboration features
      socket.on('collaboration:cursor', (data) => {
        this.handleCollaborationCursor(socket, data);
      });

      socket.on('collaboration:selection', (data) => {
        this.handleCollaborationSelection(socket, data);
      });

      // Real-time notifications
      socket.on('notification:read', async (notificationId) => {
        await this.markNotificationRead(socket, notificationId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`WebSocket error for user ${socket.userId}:`, error);
      });

      // Send initial state
      this.sendInitialState(socket);
    });
  }

  async joinProjectRoom(socket, projectId) {
    const roomName = `project:${projectId}`;
    socket.join(roomName);
    
    // Track room membership
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(socket.userId);

    // Notify others in the room
    socket.to(roomName).emit('user:joined', {
      userId: socket.userId,
      projectId,
      timestamp: new Date()
    });

    // Send current room state
    const roomState = await this.getProjectRoomState(projectId);
    socket.emit('room:state', roomState);

    console.log(`User ${socket.userId} joined project ${projectId}`);
  }

  async leaveProjectRoom(socket, projectId) {
    const roomName = `project:${projectId}`;
    socket.leave(roomName);
    
    // Update room membership
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(socket.userId);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }

    // Notify others
    socket.to(roomName).emit('user:left', {
      userId: socket.userId,
      projectId,
      timestamp: new Date()
    });
  }

  async handleMemoryVaultUpdate(socket, data) {
    const { projectId, action, itemId, content } = data;
    
    // Validate permissions
    if (!await this.validateProjectAccess(socket.userId, projectId)) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Broadcast to project room
    this.io.to(`project:${projectId}`).emit('memoryvault:changed', {
      action,
      itemId,
      content,
      userId: socket.userId,
      timestamp: new Date()
    });

    // Publish to Redis for cross-server sync
    if (this.redis) {
      await this.redis.publish('signaldesk:updates', JSON.stringify({
        type: 'memoryvault:update',
        projectId,
        data: { action, itemId, content, userId: socket.userId }
      }));
    }
  }

  async handleAIContextSync(socket, data) {
    const { sessionId, context, feature } = data;
    
    // Store context session
    this.contextSessions.set(sessionId, {
      userId: socket.userId,
      context,
      feature,
      timestamp: new Date()
    });

    // Sync with other user sessions
    const userRoom = `user:${socket.userId}`;
    socket.to(userRoom).emit('ai:context:updated', {
      sessionId,
      context,
      feature
    });

    // Persist to Redis
    if (this.redis) {
      await this.redis.setex(
        `ai:context:${sessionId}`,
        3600, // 1 hour TTL
        JSON.stringify({ userId: socket.userId, context, feature })
      );
    }
  }

  async handleCampaignTaskUpdate(socket, data) {
    const { campaignId, taskId, status, progress } = data;
    
    // Broadcast to all users watching this campaign
    this.io.to(`campaign:${campaignId}`).emit('campaign:task:progress', {
      taskId,
      status,
      progress,
      updatedBy: socket.userId,
      timestamp: new Date()
    });

    // Update orchestrator state
    this.io.emit('orchestrator:update', {
      type: 'task',
      campaignId,
      taskId,
      status
    });
  }

  async subscribeToMonitoring(socket, targets) {
    // Subscribe to monitoring updates for specific targets
    targets.forEach(target => {
      socket.join(`monitoring:${target}`);
    });

    // Send current monitoring state
    const monitoringState = await this.getMonitoringState(targets);
    socket.emit('monitoring:state', monitoringState);
  }

  handleCollaborationCursor(socket, data) {
    const { projectId, position, selection } = data;
    
    // Broadcast cursor position to others in the project
    socket.to(`project:${projectId}`).emit('collaboration:cursor:update', {
      userId: socket.userId,
      position,
      selection,
      timestamp: new Date()
    });
  }

  handleCollaborationSelection(socket, data) {
    const { projectId, elementId, selected } = data;
    
    // Broadcast selection state
    socket.to(`project:${projectId}`).emit('collaboration:selection:update', {
      userId: socket.userId,
      elementId,
      selected,
      timestamp: new Date()
    });
  }

  async markNotificationRead(socket, notificationId) {
    // Mark notification as read and update all user sessions
    const userRoom = `user:${socket.userId}`;
    this.io.to(userRoom).emit('notification:marked_read', {
      notificationId,
      timestamp: new Date()
    });
  }

  handleDisconnect(socket) {
    console.log(`👤 User ${socket.userId} disconnected`);
    
    // Clean up user session
    this.userSessions.delete(socket.userId);
    
    // Notify rooms about user disconnect
    this.rooms.forEach((users, roomName) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        socket.to(roomName).emit('user:disconnected', {
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    });
  }

  async sendInitialState(socket) {
    // Send initial data when user connects
    const state = {
      userId: socket.userId,
      connectedAt: new Date(),
      activeUsers: Array.from(this.userSessions.keys()),
      features: {
        memoryvault: true,
        ai_assistant: true,
        campaign_orchestrator: true,
        real_time_monitoring: true
      }
    };

    socket.emit('initial:state', state);
  }

  setupHeartbeat() {
    // Heartbeat to detect stale connections
    setInterval(() => {
      this.io.emit('heartbeat', { timestamp: new Date() });
      
      // Clean up stale sessions
      const now = Date.now();
      this.userSessions.forEach((session, userId) => {
        if (now - session.lastActivity > 30000) { // 30 seconds
          const socket = this.io.sockets.sockets.get(session.socketId);
          if (socket && !socket.connected) {
            this.userSessions.delete(userId);
          }
        }
      });
    }, 15000); // Every 15 seconds
  }

  // Utility methods
  async validateProjectAccess(userId, projectId) {
    // Check if user has access to project
    // This should query the database
    return true; // Placeholder
  }

  async getProjectRoomState(projectId) {
    // Get current state of project room
    return {
      projectId,
      activeUsers: Array.from(this.rooms.get(`project:${projectId}`) || []),
      timestamp: new Date()
    };
  }

  async getMonitoringState(targets) {
    // Get current monitoring state for targets
    return {
      targets,
      data: {}, // Placeholder
      timestamp: new Date()
    };
  }

  broadcastUpdate(message) {
    // Broadcast updates from Redis pub/sub
    const { type, projectId, data } = message;
    
    switch (type) {
      case 'memoryvault:update':
        this.io.to(`project:${projectId}`).emit('memoryvault:changed', data);
        break;
      case 'campaign:update':
        this.io.to(`campaign:${data.campaignId}`).emit('campaign:updated', data);
        break;
      case 'monitoring:alert':
        this.io.to(`monitoring:${data.target}`).emit('monitoring:alert', data);
        break;
    }
  }

  // Public methods for external use
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToProject(projectId, event, data) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  emitToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = WebSocketServer;
# SignalDesk MCP Servers

Model Context Protocol (MCP) servers for SignalDesk platform, providing Claude with direct access to your PR intelligence system.

## 🚀 Overview

These MCP servers enable Claude to:
- **Search and manage your MemoryVault** knowledge base
- **Plan and orchestrate PR campaigns** with timeline management
- **Discover journalists and track media outreach**
- **Monitor media coverage** and competitor activity

## 📦 Available Servers

### 1. signaldesk-memory
Provides semantic search and knowledge management for MemoryVault.

**Tools:**
- `search_memory` - Search knowledge base with semantic or keyword search
- `add_to_memory` - Add new information to MemoryVault
- `get_memory_context` - Get related context for topics
- `list_memory_categories` - Browse categories

### 2. signaldesk-campaigns  
Campaign planning, timeline management, and orchestration.

**Tools:**
- `create_campaign` - Create new PR campaigns with objectives
- `add_campaign_task` - Add tasks with dependencies
- `get_campaign_status` - Track campaign progress
- `analyze_campaign_timeline` - Identify conflicts and opportunities
- `orchestrate_campaign_execution` - Automate campaign workflows
- `generate_campaign_report` - Create performance reports

### 3. signaldesk-media
Journalist discovery, media list building, and outreach tracking.

**Tools:**
- `find_journalists` - Discover relevant journalists by beat
- `analyze_journalist` - Get detailed journalist analysis
- `create_media_list` - Build targeted media lists
- `monitor_coverage` - Track media mentions
- `generate_pitch` - Create personalized pitches
- `track_outreach` - Log and report on outreach efforts

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Claude Desktop app

### Quick Setup

1. **Run the setup script:**
```bash
cd mcp-servers
chmod +x setup.sh
./setup.sh
```

2. **Configure your database:**
Update `DATABASE_URL` in `claude-desktop-config.json`:
```json
"env": {
  "DATABASE_URL": "postgresql://postgres:password@localhost:5432/signaldesk"
}
```

3. **Initialize database tables:**
```bash
psql -U postgres -d signaldesk -f init-mcp-tables.sql
```

4. **Add to Claude Desktop:**

Copy the configuration from `claude-desktop-config.json` to your Claude Desktop config:

**Mac:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%/Claude/claude_desktop_config.json
```

5. **Restart Claude Desktop**

## 🔧 Development

### Building from Source
```bash
cd signaldesk-memory
npm install
npm run build
```

### Running in Development Mode
```bash
npm run dev
```

### Testing a Server
```bash
node dist/index.js
```

## 📝 Usage Examples

Once configured, you can use these capabilities in Claude Desktop:

### Memory Search
"Search my MemoryVault for information about our Q3 product launch"

### Campaign Planning
"Create a campaign for our new AI feature announcement targeting tech media"

### Journalist Discovery
"Find journalists who cover artificial intelligence at major tech publications"

### Media Monitoring
"Show me coverage of our competitors in the last 7 days"

## 🔗 Integration with SignalDesk Platform

These MCP servers connect directly to your SignalDesk database and can:
- Access the same data as your web platform
- Maintain consistency across all touchpoints
- Provide Claude with full context of your PR activities

### Environment Variables

Each server can be configured with:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For intelligent features (media server)
- `NODE_ENV` - Set to 'production' for SSL connections

## 🐛 Troubleshooting

### Server won't start
- Check Node.js version (18+)
- Verify database connection
- Run `npm install` and `npm run build`

### Claude doesn't see the servers
- Restart Claude Desktop after config changes
- Check config file syntax (valid JSON)
- Verify file paths are absolute

### Database errors
- Ensure tables are created (run init-mcp-tables.sql)
- Check DATABASE_URL format
- Verify PostgreSQL is running

## 📚 API Integration

To integrate these MCP servers with your SignalDesk backend:

```javascript
// Example: Sync MemoryVault with MCP
app.post('/api/memoryvault/sync', async (req, res) => {
  const items = await getMemoryVaultItems(req.user.id);
  // Items are automatically available to MCP server
  res.json({ synced: items.length });
});
```

## 🚀 Next Steps

1. **Extend servers** with additional tools as needed
2. **Add webhook support** for real-time updates
3. **Implement caching** for frequently accessed data
4. **Add authentication** for multi-user support

## 📄 License

Part of the SignalDesk platform - proprietary software.

---

**Need help?** Check the SignalDesk documentation or reach out to the development team.
# SignalDesk API Documentation

## 🌐 API Overview

- **Base URL**: `http://localhost:5001`
- **Authentication**: JWT Bearer token (demo mode currently)
- **Content-Type**: `application/json`
- **CORS**: Enabled for `http://localhost:3000`

## 🔑 Authentication

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "demo@signaldesk.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "email": "demo@signaldesk.com",
    "name": "Demo User"
  }
}
```

### Verify Token

```http
GET /auth/verify
Authorization: Bearer {token}

Response:
{
  "user": {
    "id": "1",
    "email": "demo@signaldesk.com",
    "name": "Demo User"
  }
}
```

## 📁 Projects

### Get All Projects

```http
GET /projects
Authorization: Bearer {token}

Response:
{
  "projects": [
    {
      "id": "1",
      "name": "Demo Project",
      "description": "A demo project",
      "client": "Demo Client",
      "createdAt": "2024-01-11T10:00:00.000Z",
      "settings": {
        "aiModel": "claude-3-5-sonnet-20241022",
        "tone": "professional"
      }
    }
  ]
}
```

### Create Project

```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Campaign",
  "description": "Q1 2024 Product Launch",
  "client": "TechCorp"
}

Response:
{
  "project": {
    "id": "2",
    "name": "New Campaign",
    "description": "Q1 2024 Product Launch",
    "client": "TechCorp",
    "createdAt": "2024-01-11T10:00:00.000Z",
    "settings": {
      "aiModel": "claude-3-5-sonnet-20241022",
      "tone": "professional"
    }
  }
}
```

### Update Project

```http
PUT /projects/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "description": "Updated description"
}

Response:
{
  "project": {
    "id": "1",
    "name": "Updated Campaign Name",
    "description": "Updated description",
    // ... other fields
  }
}
```

### Delete Project

```http
DELETE /projects/:id
Authorization: Bearer {token}

Response:
{
  "message": "Project deleted"
}
```

## 🤖 AI Assistant

### Send Message

```http
POST /assistant/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Help me write a press release about our new product",
  "projectId": "1",
  "context": {
    "tone": "professional",
    "industry": "technology"
  }
}

Response:
{
  "response": "I'll help you create a professional press release...",
  "conversationId": "conv_123",
  "timestamp": "2024-01-11T10:00:00.000Z"
}
```

### Get Conversation History

```http
GET /assistant/conversations/:projectId
Authorization: Bearer {token}

Response:
{
  "conversations": [
    {
      "id": "conv_123",
      "messages": [
        {
          "role": "user",
          "content": "Help me write a press release",
          "timestamp": "2024-01-11T10:00:00.000Z"
        },
        {
          "role": "assistant",
          "content": "I'll help you create...",
          "timestamp": "2024-01-11T10:00:01.000Z"
        }
      ]
    }
  ]
}
```

## 📝 Content Management

### Get Project Content

```http
GET /content/project/:projectId
Authorization: Bearer {token}

Response:
{
  "content": [
    {
      "id": "1",
      "projectId": "1",
      "type": "press-release",
      "title": "Product Launch Announcement",
      "content": "...",
      "metadata": {
        "tone": "professional",
        "length": "medium"
      },
      "createdAt": "2024-01-11T10:00:00.000Z",
      "updatedAt": "2024-01-11T10:00:00.000Z"
    }
  ]
}
```

### Create Content

```http
POST /content
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "1",
  "type": "press-release",
  "title": "New Feature Announcement",
  "content": "We are excited to announce...",
  "metadata": {
    "tone": "professional",
    "keywords": ["innovation", "technology"],
    "targetAudience": "tech journalists"
  }
}

Response:
{
  "content": {
    "id": "2",
    "projectId": "1",
    "type": "press-release",
    "title": "New Feature Announcement",
    "content": "We are excited to announce...",
    "metadata": {
      "tone": "professional",
      "keywords": ["innovation", "technology"],
      "targetAudience": "tech journalists"
    },
    "createdAt": "2024-01-11T10:00:00.000Z",
    "updatedAt": "2024-01-11T10:00:00.000Z"
  }
}
```

### Update Content

```http
PUT /content/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}

Response:
{
  "content": {
    // Updated content object
  }
}
```

### Delete Content

```http
DELETE /content/:id
Authorization: Bearer {token}

Response:
{
  "message": "Content deleted successfully"
}
```

### Search Content

```http
GET /content/search/:projectId?q=launch
Authorization: Bearer {token}

Response:
{
  "content": [
    // Content items matching search query
  ]
}
```

## 👥 Media Contacts (To Be Implemented)

### Get Contacts

```http
GET /media/contacts/:projectId
Authorization: Bearer {token}

Response:
{
  "contacts": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@techcrunch.com",
      "organization": "TechCrunch",
      "position": "Senior Editor",
      "tags": ["tech", "startups"],
      "notes": "Covers AI and enterprise software"
    }
  ]
}
```

### Import Contacts (CSV)

```http
POST /media/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: contacts.csv
- projectId: "1"

Response:
{
  "imported": 25,
  "skipped": 2,
  "errors": [
    {
      "row": 15,
      "error": "Invalid email format"
    }
  ]
}
```

## 📊 Campaign Intelligence (To Be Implemented)

### Create Campaign

```http
POST /campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "1",
  "name": "Q1 Product Launch",
  "startDate": "2024-02-01",
  "endDate": "2024-03-31",
  "goals": [
    "Generate 50 media mentions",
    "Reach 1M impressions"
  ],
  "budget": 50000
}
```

## 🧠 MemoryVault (To Be Implemented)

### Upload Document

```http
POST /memory/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: brand-guidelines.pdf
- projectId: "1"
- type: "brand-guidelines"

Response:
{
  "document": {
    "id": "doc_123",
    "filename": "brand-guidelines.pdf",
    "type": "brand-guidelines",
    "size": 2048576,
    "processedAt": "2024-01-11T10:00:00.000Z"
  }
}
```

### Train AI on Documents

```http
POST /memory/train/:projectId
Authorization: Bearer {token}

Response:
{
  "status": "training_started",
  "documentsCount": 5,
  "estimatedTime": "5 minutes"
}
```

## 📈 Monitoring & Analytics (To Be Implemented)

### Get Media Mentions

```http
GET /monitoring/mentions/:projectId
Authorization: Bearer {token}

Response:
{
  "mentions": [
    {
      "id": "1",
      "source": "TechCrunch",
      "url": "https://techcrunch.com/...",
      "title": "SignalDesk Revolutionizes PR",
      "sentiment": "positive",
      "reach": 500000,
      "publishedAt": "2024-01-11T10:00:00.000Z"
    }
  ]
}
```

## 🚨 Crisis Management (To Be Implemented)

### Create Crisis Alert

```http
POST /crisis/alerts
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "1",
  "severity": "high",
  "title": "Negative Social Media Trend",
  "description": "Multiple negative mentions detected",
  "sources": ["twitter", "reddit"]
}
```

## 📄 Export & Reports (To Be Implemented)

### Generate Report

```http
POST /reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "1",
  "type": "campaign-summary",
  "format": "pdf",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}

Response:
{
  "reportId": "report_123",
  "status": "generating",
  "estimatedTime": "30 seconds"
}
```

### Export to Google Docs

```http
POST /export/google-docs
Authorization: Bearer {token}
Content-Type: application/json

{
  "contentId": "1",
  "googleAuth": {
    "accessToken": "ya29.a0..."
  }
}

Response:
{
  "documentUrl": "https://docs.google.com/document/d/..."
}
```

## 🔧 Error Responses

### Standard Error Format

```json
{
  "error": true,
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (no access to resource)
- `404` - Resource not found
- `422` - Validation error
- `500` - Internal server error

## 🛠️ Development Tips

### Testing with cURL

```bash
# Login
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"password"}'

# Get projects (with token)
curl -X GET http://localhost:5001/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing with Postman

1. Import this documentation
2. Set environment variable `{{baseUrl}}` = `http://localhost:5001`
3. Set `{{token}}` after login
4. Use Bearer Token authentication

### Frontend Integration

```javascript
// Using the api service
import api from "../services/api";

// Make API call
const response = await api.post("/assistant/chat", {
  message: "Hello",
  projectId: "1",
});
```

---

**Note**: Endpoints marked "To Be Implemented" are planned features. Currently working endpoints are Authentication, Projects, AI Assistant, and Content Management.

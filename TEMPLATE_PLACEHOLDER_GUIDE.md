# Template Placeholder Guide

**How to create DOCX templates for Memory Vault merge**

---

## Available Placeholders

When creating your .docx templates, use these placeholders by wrapping them in double curly braces:

### Content Placeholders
- `{{title}}` - Content title
- `{{content}}` - Main content text
- `{{contentType}}` - Type of content (press-release, social-post, etc.)

### Metadata Placeholders
- `{{date}}` - Current date (e.g., "10/24/2025")
- `{{dateTime}}` - Current date and time (e.g., "10/24/2025, 3:30 PM")
- `{{createdAt}}` - Original content creation date
- `{{folder}}` - Folder path (e.g., "Campaigns/Q4")

### Intelligence Placeholders
- `{{themes}}` - Comma-separated themes (e.g., "Technology, Innovation")
- `{{topics}}` - Comma-separated topics (e.g., "AI, Machine Learning")

### Template Info
- `{{templateName}}` - Name of the template being used

---

## Example Template

Here's what a press release template might look like in Word:

```
[COMPANY LETTERHEAD]

FOR IMMEDIATE RELEASE
Date: {{date}}

{{title}}

{{content}}

###

About [Company Name]
[Company boilerplate text here]

Media Contact:
[Contact information]

Document created: {{dateTime}}
Themes: {{themes}}
Topics: {{topics}}
```

---

## How to Create a Template

### Step 1: Open Microsoft Word

Create a new document or use an existing template.

### Step 2: Add Placeholders

Wherever you want dynamic content, type the placeholder exactly as shown above, including the double curly braces.

**Example:**
```
Title: {{title}}

Content:
{{content}}

Generated on: {{date}}
```

### Step 3: Format Your Template

- Apply your brand formatting (fonts, colors, headers)
- Add your logo
- Set margins and spacing
- Add any static text that should appear in every document

### Step 4: Save as .docx

Save your template as a `.docx` file (not .doc or .pdf).

### Step 5: Upload to Memory Vault

1. Go to Memory Vault → **Brand Assets** tab
2. Click **"Upload Asset"**
3. Select your .docx template
4. The system will automatically detect it as a template

---

## Using Your Template

1. Go to **Content Library** tab
2. Click on any content item
3. Click the green **"Export"** button
4. Switch to **"Merge Template"** tab
5. Select your template
6. Click **"Merge & Download"**

The merged .docx file will download with all placeholders replaced!

---

## Advanced Features

### Conditional Sections

If you want sections to only appear when data exists, you can use:

```
{{#themes}}
Key Themes: {{themes}}
{{/themes}}
```

This section will only appear if themes exist.

### Loops (for arrays)

If you have array data, you can loop through it:

```
{{#topics}}
- {{.}}
{{/topics}}
```

This will create a bullet point for each topic.

---

## Troubleshooting

### "Template merge failed" error

This usually means:
1. Your placeholders have typos (must match exactly: `{{title}}` not `{{Title}}`)
2. You used curly braces without double brackets
3. The file is corrupted or not a valid .docx

### Placeholders not replaced

Make sure you're using:
- Double curly braces: `{{title}}` ✅
- Not single: `{title}` ❌
- Not angle brackets: `<title>` ❌

### Content looks weird

- Make sure your placeholder has proper spacing
- Don't put placeholders inside tables or complex formatting
- Use paragraph-level placeholders for long content

---

## Example Templates

### Press Release Template
```
FOR IMMEDIATE RELEASE
{{date}}

{{title}}

{{content}}

For more information, visit [company website]
Media Contact: [contact info]

Metadata:
- Content Type: {{contentType}}
- Created: {{createdAt}}
- Themes: {{themes}}
- Topics: {{topics}}
```

### Social Media Post Template
```
[LOGO]

{{title}}

{{content}}

#{{themes}} #{{topics}}

Posted: {{date}}
```

### Internal Memo Template
```
MEMORANDUM

TO: [Recipient]
FROM: [Sender]
DATE: {{date}}
RE: {{title}}

{{content}}

---
Document Details:
Type: {{contentType}}
Folder: {{folder}}
Created: {{createdAt}}
```

---

## Supported File Formats

| Format | Merge Support | Export Only |
|--------|--------------|-------------|
| .docx | ✅ Full merge | ✅ |
| .pptx | 🚧 Coming soon | ✅ Text only |
| .pdf | ❌ | ✅ Text only |
| .txt | ❌ | ✅ |
| .md | ❌ | ✅ |

---

## Tips for Best Results

1. **Test your template** - Create a simple template first to test placeholders
2. **Use clear formatting** - Don't nest placeholders in complex formatting
3. **Keep it simple** - Start with basic placeholders, add complexity later
4. **Version your templates** - Upload new versions with dates in the filename
5. **Name descriptively** - Use names like "Press_Release_2025_v2.docx"

---

## Need Help?

If your template isn't working:
1. Check the browser console for error messages
2. Verify all placeholders use double curly braces
3. Try a simpler template first
4. Make sure the file is .docx format

---

**Ready to create your first template?**

Open Word, add some {{placeholders}}, save as .docx, upload to Brand Assets, and merge away! 🚀

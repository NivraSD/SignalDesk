import { NextRequest, NextResponse } from 'next/server'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

export async function POST(req: NextRequest) {
  try {
    const { contentId, title, content } = await req.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      )
    }

    console.log('📄 Generating Word document:', title)

    // Create a minimal blank DOCX template
    const blankDocxTemplate = createBlankDocx()

    // Load the template
    const zip = new PizZip(blankDocxTemplate)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // Get the document XML
    const documentXml = zip.files['word/document.xml'].asText()

    // Format content with title and metadata
    const formattedContent = `${title}

${content}

───────────────────────────────────────────
Generated from SignalDesk Memory Vault
${new Date().toLocaleString()}
───────────────────────────────────────────`

    // Convert content to Word XML paragraphs
    const paragraphs = formattedContent.split('\n').map(line => {
      // Check if this is the title (first line)
      const isTitle = line === title
      const isSeparator = line.startsWith('───')

      if (isTitle) {
        // Title styling - bold and larger
        return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
      } else if (isSeparator) {
        // Separator styling - gray and smaller
        return `<w:p><w:r><w:rPr><w:color w:val="999999"/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
      } else if (line.trim() === '') {
        // Empty line
        return `<w:p><w:r><w:t></w:t></w:r></w:p>`
      } else {
        // Normal text
        return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
      }
    }).join('')

    // Replace the body content
    const modifiedXml = documentXml.replace(
      /<w:body>.*<\/w:body>/s,
      `<w:body>${paragraphs}</w:body>`
    )

    zip.file('word/document.xml', modifiedXml)

    // Generate the document
    const buffer = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    console.log('✅ Word document generated')

    // Return Word document
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.docx"`,
      },
    })

  } catch (error) {
    console.error('❌ Word export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Word document: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Create a minimal blank DOCX template (base64 encoded zip)
function createBlankDocx(): Buffer {
  const zip = new PizZip()

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)

  // _rels/.rels
  zip.folder('_rels')
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  // word/document.xml
  zip.folder('word')
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`)

  // word/_rels/document.xml.rels
  zip.folder('word/_rels')
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`)

  return zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  })
}

// Telegram Budget Bot - receives expenses via text or screenshots
// Parses amounts, auto-categorizes with Claude, stores to Supabase, syncs to Google Sheets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BUDGET_BOT_TOKEN')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const GOOGLE_SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
const GOOGLE_SHEET_ID = Deno.env.get('BUDGET_GOOGLE_SHEET_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Parse service account - might not be available
let GOOGLE_SERVICE_ACCOUNT: any = null
try {
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    GOOGLE_SERVICE_ACCOUNT = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)
  }
} catch (e) {
  console.log('Google service account not configured - sheets sync disabled')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Categories for auto-classification
const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills & Utilities',
  'Health & Medical',
  'Travel',
  'Subscriptions',
  'Personal Care',
  'Home',
  'Other'
]

interface ParsedExpense {
  amount: number
  currency: string
  category: string
  description: string
}

// Parse text message for expense (e.g., "$45.50 lunch with team")
async function parseTextExpense(text: string): Promise<ParsedExpense | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extract expense info from this message. Return JSON only, no markdown.
Message: "${text}"

Categories: ${CATEGORIES.join(', ')}

Return format:
{"amount": 45.50, "currency": "USD", "category": "Food & Dining", "description": "lunch with team"}

If no valid expense found, return: {"error": "no expense found"}`
      }]
    })
  })

  const data = await response.json()
  const content = data.content?.[0]?.text || '{}'

  try {
    const parsed = JSON.parse(content)
    if (parsed.error) return null
    return parsed
  } catch {
    return null
  }
}

// Analyze image for expense using Claude Vision
async function parseImageExpense(imageBase64: string, mimeType: string): Promise<ParsedExpense | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: `This is a receipt or expense screenshot. Extract the expense info.
Return JSON only, no markdown.

Categories: ${CATEGORIES.join(', ')}

Return format:
{"amount": 45.50, "currency": "USD", "category": "Food & Dining", "description": "Starbucks coffee"}

If you can't determine an expense, return: {"error": "could not parse expense"}`
          }
        ]
      }]
    })
  })

  const data = await response.json()
  const content = data.content?.[0]?.text || '{}'

  try {
    const parsed = JSON.parse(content)
    if (parsed.error) return null
    return parsed
  } catch {
    return null
  }
}

// Get Google access token from service account
async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }

  // Encode JWT
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${headerB64}.${payloadB64}`

  // Import private key and sign
  const privateKeyPem = GOOGLE_SERVICE_ACCOUNT.private_key
  const pemContents = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${unsignedToken}.${signatureB64}`

  // Exchange for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

// Append row to Google Sheet (starts at row 3 to leave room for headers and totals)
async function appendToGoogleSheet(expense: ParsedExpense & { id: string, created_at: string, sender: string }): Promise<number> {
  if (!GOOGLE_SERVICE_ACCOUNT) {
    console.log('Sheets sync skipped - no service account')
    return 0
  }

  const accessToken = await getGoogleAccessToken()
  if (!accessToken) return 0

  // Format date nicely
  const date = new Date(expense.created_at)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const values = [[
    formattedDate,
    expense.sender,
    expense.amount,
    expense.category,
    expense.description
  ]]

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Budget!A7:E:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  )

  const data = await response.json()
  console.log('Sheets response:', JSON.stringify(data))

  // Extract row number from updatedRange like "Expenses!A5:E5"
  const range = data.updates?.updatedRange || ''
  const rowMatch = range.match(/!A(\d+):/)
  return rowMatch ? parseInt(rowMatch[1]) : 0
}

// Send message back to Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  })
}

// Download file from Telegram
async function downloadTelegramFile(fileId: string): Promise<{ base64: string, mimeType: string }> {
  // Get file path
  const fileInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`)
  const fileInfo = await fileInfoRes.json()
  const filePath = fileInfo.result.file_path

  // Download file
  const fileRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`)
  const arrayBuffer = await fileRes.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  // Determine mime type from extension
  const ext = filePath.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }

  return { base64, mimeType: mimeTypes[ext || ''] || 'image/jpeg' }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 })
  }

  try {
    const update = await req.json()
    const message = update.message

    if (!message) {
      return new Response('OK', { status: 200 })
    }

    const chatId = message.chat.id
    const messageId = message.message_id

    // Get sender name from Telegram user
    const sender = message.from?.first_name || message.from?.username || 'Unknown'
    const telegramUserId = message.from?.id

    let expense: ParsedExpense | null = null
    let sourceType = 'text'
    let rawMessage = ''

    // Handle text message
    if (message.text) {
      rawMessage = message.text

      // Handle commands
      if (message.text.startsWith('/')) {
        if (message.text === '/start') {
          await sendTelegramMessage(chatId,
            `*Budget Tracker Bot*\n\nSend me expenses like:\n• \`$45.50 lunch\`\n• \`25 uber\`\n• Or send a receipt screenshot!\n\nI'll auto-categorize and save to your spreadsheet.`)
          return new Response('OK', { status: 200 })
        }
        if (message.text === '/summary') {
          // Get this month's summary
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const { data: expenses } = await supabase
            .from('budget_expenses')
            .select('amount, category, sender_name')
            .gte('created_at', startOfMonth.toISOString())

          if (!expenses?.length) {
            await sendTelegramMessage(chatId, 'No expenses recorded this month.')
            return new Response('OK', { status: 200 })
          }

          const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

          // By person
          const byPerson = expenses.reduce((acc, e) => {
            const name = e.sender_name || 'Unknown'
            acc[name] = (acc[name] || 0) + parseFloat(e.amount)
            return acc
          }, {} as Record<string, number>)

          // By category
          const byCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
            return acc
          }, {} as Record<string, number>)

          let summary = `*This Month's Summary*\n\n*Total: $${total.toFixed(2)}*\n\n`

          summary += `*By Person:*\n`
          Object.entries(byPerson)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, amt]) => {
              summary += `  ${name}: $${amt.toFixed(2)}\n`
            })

          summary += `\n*By Category:*\n`
          Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, amt]) => {
              summary += `  ${cat}: $${amt.toFixed(2)}\n`
            })

          await sendTelegramMessage(chatId, summary)
          return new Response('OK', { status: 200 })
        }
        return new Response('OK', { status: 200 })
      }

      expense = await parseTextExpense(message.text)
    }

    // Handle photo
    else if (message.photo) {
      sourceType = 'image'
      // Get largest photo
      const photo = message.photo[message.photo.length - 1]
      const { base64, mimeType } = await downloadTelegramFile(photo.file_id)
      rawMessage = '[image]'
      expense = await parseImageExpense(base64, mimeType)
    }

    // No valid expense found
    if (!expense) {
      await sendTelegramMessage(chatId, "Couldn't parse an expense from that. Try something like `$25 coffee` or send a receipt photo.")
      return new Response('OK', { status: 200 })
    }

    // Save to database
    const { data: saved, error: dbError } = await supabase
      .from('budget_expenses')
      .insert({
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        source_type: sourceType,
        raw_message: rawMessage,
        telegram_message_id: messageId,
        telegram_chat_id: chatId,
        sender_name: sender,
        telegram_user_id: telegramUserId
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      await sendTelegramMessage(chatId, 'Error saving expense. Please try again.')
      return new Response('OK', { status: 200 })
    }

    // Sync to Google Sheets
    let sheetRowId = 0
    try {
      sheetRowId = await appendToGoogleSheet({
        ...expense,
        id: saved.id,
        created_at: new Date().toISOString(),
        sender
      })

      // Update sync status
      await supabase
        .from('budget_expenses')
        .update({ synced_to_sheets: true, sheets_row_id: sheetRowId })
        .eq('id', saved.id)
    } catch (sheetError) {
      console.error('Sheets error:', sheetError)
      // Continue anyway - expense is saved
    }

    // Confirm to user
    const syncStatus = sheetRowId ? '(synced to sheet)' : ''
    await sendTelegramMessage(chatId,
      `Saved: *$${expense.amount.toFixed(2)}* - ${expense.category}\n_${expense.description}_ ${syncStatus}`)

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('OK', { status: 200 }) // Always return 200 to Telegram
  }
})

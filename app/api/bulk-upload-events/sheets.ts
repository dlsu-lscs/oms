import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  try {
    const { sheetUrl } = await req.json()
    if (!sheetUrl) {
      return NextResponse.json({ error: 'sheetUrl is required' }, { status: 400 })
    }

    // Extract spreadsheetId from URL
    let spreadsheetId: string
    try {
      const url = new URL(sheetUrl)
      const parts = url.pathname.split('/')
      spreadsheetId = parts[3]
    } catch {
      return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 })
    }

    // Decode service account JSON from env
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}')
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      return NextResponse.json({ error: 'Invalid service account credentials' }, { status: 500 })
    }

    // Authenticate with Google
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      undefined,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    )
    const sheets = google.sheets({ version: 'v4', auth })

    // Get spreadsheet metadata including title and sheet names in a single call
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title'
    })

    const sheetNames = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || []
    const spreadsheetTitle = spreadsheet.data.properties?.title || 'Untitled Spreadsheet'

    return NextResponse.json({
      sheetNames,
      spreadsheetTitle
    })
  } catch (e) {
    console.error('Error fetching spreadsheet:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 
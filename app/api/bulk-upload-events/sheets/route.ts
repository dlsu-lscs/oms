import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// API route to list sheet names from a Google Sheet URL
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

    // Fetch spreadsheet metadata
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId })
    const sheetNames = metaRes.data.sheets
      ?.map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t)) || []

    // Note: ensure the sheet is shared with this service account email:
    //    ${serviceAccount.client_email}

    return NextResponse.json({ sheetNames })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 
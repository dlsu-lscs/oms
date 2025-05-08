import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { pool } from '@/lib/db'

// API route to bulk upload events via Google Sheets
export async function POST(req: NextRequest) {
  try {
    const { sheetUrl, sheetName } = await req.json()
    if (!sheetUrl) {
      return NextResponse.json({ error: 'sheetUrl is required' }, { status: 400 })
    }

    // Fetch existing ARNs and valid event natures
    const [existingArns, validNatures] = await Promise.all([
      pool.query('SELECT arn FROM events'),
      pool.query('SELECT name FROM event_natures')
    ]);

    const arns = (existingArns[0] as any[]).map(row => row.arn);
    const natures = (validNatures[0] as any[]).map(row => row.name);

    // Extract spreadsheetId from URL
    let spreadsheetId: string
    try {
      const url = new URL(sheetUrl)
      const parts = url.pathname.split('/')
      spreadsheetId = parts[3]
    } catch {
      return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 })
    }

    // Determine sheet/tab name (default to first sheet)
    const tabName = sheetName || 'Sheet1'

    // Decode service account JSON from env
    let serviceAccount
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}')
    } catch (error) {
      console.error('Error parsing service account JSON:', error)
      return NextResponse.json({ error: 'Invalid service account JSON format' }, { status: 500 })
    }

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('Missing required service account fields:', {
        hasClientEmail: !!serviceAccount.client_email,
        hasPrivateKey: !!serviceAccount.private_key
      })
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

    // Fetch entire sheet values
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}`,
    })
    const allValues = sheetRes.data.values || []
    // Header row is row 2 => index 1
    const rawHeaders = allValues[1] || []
    // Use all columns starting at A
    const headers = rawHeaders

    // Required column names (must match exactly)
    const requiredFields = [
      'Activity Title',
      'ARN',
      'Duration',
      'Brief Description',
      'Goals',
      'Objectives',
      'Strategies',
      'Measures',
      'Target Activity Date',
      'Activity Nature',
      'Activity Type',
      'Budget Allocation',
      'Venue',
    ]

    // Validate that all required columns exist
    const missing = requiredFields.filter((f) => !headers.includes(f))
    if (missing.length) {
      return NextResponse.json({
        error: `Missing required columns: ${missing.join(', ')}`
      }, { status: 400 })
    }

    // Data rows are from row 4 onward => index 3 (skipping row 3)
    const rawRows = allValues.slice(3)
    // Use full data rows starting at A
    const rows = rawRows

    // Map rows to objects using header indices
    const parsed = rows
      .map((row) => {
        const obj: Record<string, string> = {}
        requiredFields.forEach((field) => {
          const idx = headers.indexOf(field)
          obj[field] = row[idx] || ''
        })
        return obj
      })
      .filter(row => row['Activity Title'].trim() !== '') // Filter out rows with blank Activity Title

    // Note: Please share your Google Sheet with the service account email:
    //    ${serviceAccount.client_email}

    return NextResponse.json({ 
      success: true, 
      data: parsed,
      existingArns: arns,
      validNatures: natures
    })
  } catch (e) {
    console.error('Error parsing sheet:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
} 
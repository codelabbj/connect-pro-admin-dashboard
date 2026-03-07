import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  // Use standard fetch instead of apiFetch (which is a client-side hook)
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.detail) {
    return NextResponse.json(data, { status: 400 })
  }
  // Set the accessToken cookie for middleware (httpOnly for reliability)
  const response = NextResponse.json(data)
  response.cookies.set('accessToken', data.access, {
    httpOnly: true, // Most reliable for server-side auth
    path: '/',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    secure: process.env.NODE_ENV === 'production', // Set secure only in production
  })
  return response
} 
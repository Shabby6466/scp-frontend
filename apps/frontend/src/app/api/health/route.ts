import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Backend unreachable' },
      { status: 502 },
    );
  }
}

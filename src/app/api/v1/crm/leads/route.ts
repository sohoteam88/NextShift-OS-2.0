import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    module: 'crm.leads',
    status: 'placeholder',
    data: [],
  });
}

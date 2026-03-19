import { NextRequest, NextResponse } from 'next/server'
import { establishPatientPortalSession } from '../../../lib/auth'

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
        return NextResponse.redirect(new URL('/portal/acesso-negado?error=missing_token', request.url))
    }

    const hasSession = await establishPatientPortalSession(token)

    if (!hasSession) {
        return NextResponse.redirect(new URL('/portal/acesso-negado?error=invalid_or_expired', request.url))
    }

    return NextResponse.redirect(new URL('/portal', request.url))
}

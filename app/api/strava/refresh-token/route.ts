import { NextRequest, NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVAID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVASECRET!;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const refresh_token = searchParams.get('refresh_token');

    if (!refresh_token) {
        return NextResponse.json({ error: "Refresh token not provided" }, { status: 400 });
    }

    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
        }),
    });

    if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        return NextResponse.json({ error: "Failed to refresh token", details: errorData }, { status: tokenRes.status });
    }

    const tokenData = await tokenRes.json();
    return NextResponse.json(tokenData);
}
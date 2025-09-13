import { NextRequest, NextResponse } from "next/server";
const STRAVA_CLIENT_ID = process.env.STRAVAID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVASECRET!;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: "Code not provided" }, { status: 400 });
    }

    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
        }),
    });

    if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        return NextResponse.json({ error: "Failed to exchange token", details: errorData }, { status: tokenRes.status });
    }

    const tokenData = await tokenRes.json();
    const origin = req.headers.get("origin") || "http://localhost:3000";
    return NextResponse.redirect(`${origin}/?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}&expires_at=${tokenData.expires_at}`);
}
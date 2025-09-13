import { NextRequest, NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVAID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVASECRET;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // Get access token from localStorage (this would be handled differently in production)
    // For now, we'll need to implement proper token management
    const accessToken = process.env.STRAVA_ACCESS_TOKEN; // This should come from user session
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Strava access token not found. Please authenticate with Strava." },
        { status: 401 }
      );
    }

    // Fetch recent activities from Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${limit}&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Strava API error:', errorData);
      return NextResponse.json(
        { error: "Failed to fetch activities from Strava" },
        { status: response.status }
      );
    }

    const activities = await response.json();
    
    // Filter for running activities only
    const runningActivities = activities.filter((activity: any) => 
      activity.type === 'Run' || activity.sport_type === 'Run'
    );

    return NextResponse.json({
      success: true,
      activities: runningActivities,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
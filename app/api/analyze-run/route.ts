import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { activityId } = await request.json();
    const { searchParams } = new URL(request.url);
    const access_token = searchParams.get("access_token");

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    if (!access_token) {
      return NextResponse.json(
        { error: "Strava access token not found" },
        { status: 401 }
      );
    }

    // Fetch detailed activity data from Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Strava API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch activity details from Strava" },
        { status: response.status }
      );
    }

    const activity = await response.json();
    console.log(activity);

    // Analyze the run data
    const analysis = analyzeRunData(activity);

    // Add polyline from Strava map data
    return NextResponse.json({
      ...analysis,
      polyline: activity.map?.summary_polyline || null,
    });
  } catch (error) {
    console.error("Analyze run error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function analyzeRunData(activity: any) {
  const duration = activity.moving_time; // seconds
  const distance = activity.distance / 1000; // km
  const elevationGain = activity.total_elevation_gain || 0; // meters

  // Calculate pace segments
  const segmentCount = Math.ceil(distance * 2); // ~2 per km
  const segmentDistance = distance / segmentCount;
  const intervals = [];

  const splits = activity.splits_metric || [];

  for (let i = 0; i < segmentCount; i++) {
    const segmentStartKm = i * segmentDistance;
    const segmentEndKm = (i + 1) * segmentDistance;

    let pace = 0; // sec/km
    let elevation = 0;

    if (splits.length > 0) {
      const splitIndex = Math.floor((i * splits.length) / segmentCount);
      const split = splits[splitIndex];
      if (split && split.average_speed > 0) {
        pace = 1000 / split.average_speed; // sec/km
      }
      elevation = split?.elevation_difference || 0;
    } else {
      // fallback avg pace
      pace = (duration / distance);
    }

    const { genre, tempo } = determineMusicStyle(pace, elevation);

    intervals.push({
      segment: i + 1,
      startKm: segmentStartKm,
      endKm: segmentEndKm,
      distance: segmentDistance,
      pace,
      elevation,
      genre,
      tempo,
    });
  }

  return {
    intervals,
    overallStats: {
      averagePace: duration / distance,
      totalElevation: elevationGain,
      duration,
      distance: distance * 1000, // back to meters
    },
  };
}

function determineMusicStyle(pace: number, elevation: number) {
  const paceMinPerKm = pace / 60;

  let tempo = 120;
  if (paceMinPerKm < 4) tempo = 170;
  else if (paceMinPerKm < 4.5) tempo = 160;
  else if (paceMinPerKm < 5) tempo = 150;
  else if (paceMinPerKm < 5.5) tempo = 140;
  else if (paceMinPerKm < 6) tempo = 130;
  else if (paceMinPerKm < 6.5) tempo = 120;
  else if (paceMinPerKm < 7) tempo = 110;
  else if (paceMinPerKm < 7.5) tempo = 100;
  else tempo = 90;

  let genre = "pop";
  if (elevation > 20) genre = "rock";
  else if (elevation < -20) genre = "electronic";

  return { genre, tempo: Math.round(tempo) };
}

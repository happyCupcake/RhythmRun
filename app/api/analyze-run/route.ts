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
    const streams_res = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=altitude,pace,latlng&keys_by_type=true`,
      {
        headers:  {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    )
    if (!response.ok || !streams_res.ok) {
      const errorData = await response.json();
      console.error("Strava API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch activity details from Strava" },
        { status: response.status }
      );
    }
    const activity = await response.json();
    const streams = await streams_res.json();
    // Analyze the run data
    const analysis = analyzeRunData(activity, streams);
    
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

function analyzeRunData(activity: any, streams: any) {
  const duration = activity.moving_time; // seconds
  const distance = activity.distance / 1000; // km
  const elevationGain = activity.total_elevation_gain || 0; // meters
  
  // Calculate pace segments based on distance, not time
  const effective_size = distance + (duration / 10)
  const segmentCount = Math.ceil(8 + Math.log(effective_size)) // ~2 segments per km
  const segmentInterval = streams[0].data.length / segmentCount
  const totalInd = streams[0].data.length
  const intervals = [];
  // Get splits data if available
  const splits = streams || [];
  const split_obj = streams.reduce((acc: any, cur: any) => {
    acc[cur.type] = cur
    return acc
  }, {});
  console.log(split_obj)
  for (let i = 0; i < segmentCount - 1; i++) {
    const segmentStartInd = Math.floor(i * segmentInterval);
    const segmentEndInd = Math.floor((i + 1) * segmentInterval);
    const segmentTimeLength = (segmentEndInd - segmentStartInd) / totalInd * duration
    const distance = (split_obj.distance.data[segmentEndInd] - split_obj.distance.data[segmentStartInd]) / 1000
    const pace = segmentTimeLength / distance
    const elevation = split_obj.altitude.data[segmentEndInd] - split_obj.altitude.data[segmentStartInd]
    
    // Determine genre and tempo based on pace and elevation
    const { genre, tempo } = determineMusicStyle(pace, elevation);

    intervals.push({
      segment: i,
      duration: segmentTimeLength,
      startLat: split_obj.latlng.data[segmentStartInd][0],
      startLng: split_obj.latlng.data[segmentStartInd][1],
      startKm: split_obj.altitude.data[segmentStartInd],
      endKm:  split_obj.altitude.data[segmentEndInd],
      distance: distance,
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

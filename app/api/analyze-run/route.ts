import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { activityId } = await request.json();
    const { searchParams } = new URL(request.url)
    const access_token = searchParams.get("access_token")
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
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );
    const streams_res = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=altitude,pace&keys_by_type=true`,
      {
        headers:  {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    )
    if (!response.ok || !streams_res.ok) {
      const errorData = await response.json();
      console.error('Strava API error:', errorData);
      return NextResponse.json(
        { error: "Failed to fetch activity details from Strava" },
        { status: response.status }
      );
    }
    const activity = await response.json();
    const streams = await streams_res.json();
    // Analyze the run data
    const analysis = analyzeRunData(activity, streams);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze run error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function analyzeRunData(activity: any, streams: any) {
  const duration = activity.moving_time; // seconds
  const distance = activity.distance / 1000; // convert to km
  const elevationGain = activity.total_elevation_gain || 0; // meters
  
  // Calculate pace segments based on distance, not time
  const effective_size = distance + (duration / 10)
  const segmentCount = Math.ceil(8 + 5 * Math.log(effective_size)) // ~2 segments per km
  const segmentInterval = streams[0].data.length / segmentCount
  const totalInd = streams[0].data.length
  const intervals = [];
  // Get splits data if available
  const splits = streams || [];
  const split_obj = streams.reduce((acc: any, cur: any) => {
    acc[cur.type] = cur
    return acc
  }, {});

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
      averagePace: (duration / (distance * 1000)) * 1000,
      totalElevation: elevationGain,
      duration,
      distance: distance * 1000, // convert back to meters for consistency
    },
  };
}

function determineMusicStyle(pace: number, elevation: number) {
  // Convert pace to minutes per km for easier calculation
  const paceMinPerKm = pace / 60;
  
  // BPM is ONLY determined by running pace - STRICT mapping
  let tempo = 120; // Default tempo
  
  if (paceMinPerKm < 4) {
    // Very fast pace (sub-4 min/km)
    tempo = 170; // Fixed 170 BPM
  } else if (paceMinPerKm < 4.5) {
    // Fast pace (4-4.5 min/km)
    tempo = 160; // Fixed 160 BPM
  } else if (paceMinPerKm < 5) {
    // Fast pace (4.5-5 min/km)
    tempo = 150; // Fixed 150 BPM
  } else if (paceMinPerKm < 5.5) {
    // Moderate-fast pace (5-5.5 min/km)
    tempo = 140; // Fixed 140 BPM
  } else if (paceMinPerKm < 6) {
    // Moderate pace (5.5-6 min/km)
    tempo = 130; // Fixed 130 BPM
  } else if (paceMinPerKm < 6.5) {
    // Moderate pace (6-6.5 min/km)
    tempo = 120; // Fixed 120 BPM
  } else if (paceMinPerKm < 7) {
    // Easy pace (6.5-7 min/km)
    tempo = 110; // Fixed 110 BPM
  } else if (paceMinPerKm < 7.5) {
    // Easy pace (7-7.5 min/km)
    tempo = 100; // Fixed 100 BPM
  } else {
    // Very easy pace (7.5+ min/km)
    tempo = 90; // Fixed 90 BPM
  }
  
  // Genre is ONLY determined by elevation - STRICT mapping
  let genre = "pop"; // Default genre
  
  if (elevation > 20) {
    // Uphill - intense genres (fixed)
    genre = "rock";
  } else if (elevation < -20) {
    // Downhill - energetic genres (fixed)
    genre = "electronic";
  } else {
    // Flat - balanced genres (fixed)
    genre = "pop";
  }
  
  return {
    genre,
    tempo: Math.round(tempo),
  };
}

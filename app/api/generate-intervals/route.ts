import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { type, value } = await request.json();

    if (!type || !value || value <= 0) {
      return NextResponse.json(
        { error: "Type and value are required" },
        { status: 400 }
      );
    }

    if (type !== 'distance' && type !== 'duration') {
      return NextResponse.json(
        { error: "Type must be 'distance' or 'duration'" },
        { status: 400 }
      );
    }

    // Generate 3 different interval options
    const options = generateIntervalOptions(type, value);
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Generate intervals error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateIntervalOptions(type: 'distance' | 'duration', value: number) {
  const options = [];
  
  if (type === 'distance') {
    // Distance-based intervals
    const distance = value; // km
    const estimatedDuration = distance * 6; // Assume 6 min/km average pace
    
    // Option 1: Progressive intervals (slow to fast)
    options.push({
      id: 'progressive',
      name: 'Progressive Run',
      description: `Start easy and gradually increase pace over ${distance}km`,
      intervals: generateProgressiveIntervals(distance, estimatedDuration),
    });
    
    // Option 2: Fartlek intervals (mixed pace)
    options.push({
      id: 'fartlek',
      name: 'Fartlek Training',
      description: `Mix of fast and easy segments for ${distance}km`,
      intervals: generateFartlekIntervals(distance, estimatedDuration),
    });
    
    // Option 3: Hill intervals (elevation focus)
    options.push({
      id: 'hills',
      name: 'Hill Training',
      description: `Simulated hill intervals over ${distance}km`,
      intervals: generateHillIntervals(distance, estimatedDuration),
    });
  } else {
    // Duration-based intervals
    const duration = value; // minutes
    const estimatedDistance = duration / 6; // Assume 6 min/km average pace
    
    // Option 1: Progressive intervals
    options.push({
      id: 'progressive',
      name: 'Progressive Run',
      description: `Start easy and gradually increase pace over ${duration} minutes`,
      intervals: generateProgressiveIntervals(estimatedDistance, duration),
    });
    
    // Option 2: Fartlek intervals
    options.push({
      id: 'fartlek',
      name: 'Fartlek Training',
      description: `Mix of fast and easy segments for ${duration} minutes`,
      intervals: generateFartlekIntervals(estimatedDistance, duration),
    });
    
    // Option 3: Hill intervals
    options.push({
      id: 'hills',
      name: 'Hill Training',
      description: `Simulated hill intervals for ${duration} minutes`,
      intervals: generateHillIntervals(estimatedDistance, duration),
    });
  }
  
  return options;
}

function generateProgressiveIntervals(distance: number, duration: number) {
  const intervals = [];
  
  // Calculate pace segments based on distance, not time
  const segmentCount = Math.ceil(distance * 2); // ~2 segments per km
  const segmentDistance = distance / segmentCount;
  
  for (let i = 0; i < segmentCount; i++) {
    const progress = i / segmentCount;
    const segmentStartKm = i * segmentDistance;
    const segmentEndKm = (i + 1) * segmentDistance;
    
    // Strict progressive pace: linear increase from slow to fast
    const startPace = 480; // 8:00 min/km (very slow start)
    const endPace = 300;   // 5:00 min/km (fast finish)
    const pace = startPace - (progress * (startPace - endPace));
    
    const { genre, tempo } = determineMusicStyle(pace, 0);
    
    intervals.push({
      segment: i + 1,
      startKm: segmentStartKm,
      endKm: segmentEndKm,
      distance: segmentDistance,
      pace,
      elevation: 0,
      genre,
      tempo,
    });
  }
  
  return intervals;
}

function generateFartlekIntervals(distance: number, duration: number) {
  const intervals = [];
  
  // Calculate pace segments based on distance
  const segmentCount = Math.ceil(distance * 2); // ~2 segments per km
  const segmentDistance = distance / segmentCount;
  
  for (let i = 0; i < segmentCount; i++) {
    const segmentStartKm = i * segmentDistance;
    const segmentEndKm = (i + 1) * segmentDistance;
    
    // Fartlek: strict alternating fast and easy segments
    let pace;
    if (i % 3 === 0) {
      // Fast segment - consistent pace
      pace = 330; // 5:30 min/km
    } else {
      // Easy segment - consistent pace
      pace = 450; // 7:30 min/km
    }
    
    const { genre, tempo } = determineMusicStyle(pace, 0);
    
    intervals.push({
      segment: i + 1,
      startKm: segmentStartKm,
      endKm: segmentEndKm,
      distance: segmentDistance,
      pace,
      elevation: 0,
      genre,
      tempo,
    });
  }
  
  return intervals;
}

function generateHillIntervals(distance: number, duration: number) {
  const intervals = [];
  
  // Calculate pace segments based on distance
  const segmentCount = Math.ceil(distance * 2); // ~2 segments per km
  const segmentDistance = distance / segmentCount;
  
  for (let i = 0; i < segmentCount; i++) {
    const segmentStartKm = i * segmentDistance;
    const segmentEndKm = (i + 1) * segmentDistance;
    
    // Hill intervals: clear, predictable elevation and pace pattern
    let elevation = 0;
    let pace = 360; // 6:00 min/km base pace
    
    if (i % 4 === 0 || i % 4 === 1) {
      // Uphill segments - consistent elevation and pace
      elevation = 30; // 30m elevation gain
      pace = 450; // 7:30 min/km (slower uphill)
    } else if (i % 4 === 2) {
      // Downhill segments - consistent elevation and pace
      elevation = -20; // 20m elevation loss
      pace = 330; // 5:30 min/km (faster downhill)
    } else {
      // Flat segments - consistent pace
      elevation = 0;
      pace = 360; // 6:00 min/km
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
  
  return intervals;
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

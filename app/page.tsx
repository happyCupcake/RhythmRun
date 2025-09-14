"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Download, Music, Sparkles, Play, Pause, MapPin, Clock, TrendingUp, Activity, Zap, Target, WandSparkles } from "lucide-react";
import { SunoService, SunoClip } from "@/lib/suno-service";
import { StravaService, StravaActivity, RunAnalysis } from "@/lib/strava-service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import RunningAnimation from "@/components/RunningAnimation";
import ActivityMap from "./ActivityMap";

type UserType = 'strava' | 'non-strava';
type InputType = 'distance' | 'duration';

export default function RhythmRun() {
  // User type and authentication
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Strava data
  const [stravaRuns, setStravaRuns] = useState<StravaActivity[]>([]);
  const [selectedRun, setSelectedRun] = useState<StravaActivity | null>(null);
  const [runAnalysis, setRunAnalysis] = useState<RunAnalysis | null>(null);
  
  // Non-Strava data
  const [inputType, setInputType] = useState<InputType>('distance');
  const [inputValue, setInputValue] = useState<number>(0);
  const [intervalOptions, setIntervalOptions] = useState<any[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<any>(null);
  
  // Music generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<SunoClip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});

  // Check if user is authenticated with Strava
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const stravaAccess = query.get("access_token");
    const stravaRefresh = query.get("refresh_token")
    const expiryTime = query.get("expires_at")
    if (stravaAccess && stravaRefresh && expiryTime) {
      localStorage.setItem("strava_access_token", stravaAccess)
      localStorage.setItem("strava_refresh_token", stravaRefresh )
      localStorage.setItem("strava_expiry", expiryTime)
      setIsAuthenticated(true);
      setUserType('strava');
      loadStravaRuns();
    }
  }, []);

  const loginWithStrava = () => {
    window.location.href = `http://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVAID}&response_type=code&redirect_uri=${window.location.origin}/api/strava/exchange-token&approval_prompt=force&scope=read,activity:read_all`;
  };

  const loadStravaRuns = async () => {
    try {
      const runs = await StravaService.getRecentRuns(5);
      setStravaRuns(runs);
    } catch (error) {
      console.error("Failed to load Strava runs:", error);
      setError("Failed to load your Strava runs. Please try again.");
    }
  };

  const analyzeSelectedRun = async () => {
    if (!selectedRun) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      const analysis = await StravaService.analyzeRun(selectedRun.id);
      setRunAnalysis(analysis);
      await generatePlaylistFromAnalysis(analysis);
    } catch (error) {
      console.error("Failed to analyze run:", error);
      setError("Failed to analyze your run. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIntervalOptions = async () => {
    setSelectedInterval(null);
    if (!inputValue || inputValue <= 0) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      const options = await StravaService.generateIntervalOptions(inputType, inputValue);
      setIntervalOptions(options);
    } catch (error) {
      console.error("Failed to generate intervals:", error);
      setError("Failed to generate interval options. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePlaylistFromAnalysis = async (analysis: RunAnalysis) => {
    try {
      const uniqueSongs: SunoClip[] = []; // Map to store unique songs by pace+genre
      // Group intervals by pace and genre to reuse songs
      for (const interval of analysis.intervals) {
        const key = `${interval.pace}-${interval.genre}`;
        // Generate a new song for this unique pace+genre combination
        console.log(interval.duration)
        const prompt = `A ${interval.genre} song with ${interval.tempo} BPM tempo for running. The song should be energetic and motivating for a runner maintaining ${Math.round(interval.pace / 60)}:${String(Math.round(interval.pace % 60)).padStart(2, '0')} per kilometer pace. The song should be around ${interval.duration * 1.5} seconds long`;
        const tags = `${interval.genre}, ${interval.tempo} bpm, energetic, running, motivational`;
        
        const clip =  await SunoService.generateAndWaitForCompletion({
          prompt,
          tags,
          makeInstrumental: false,
        });
        
        uniqueSongs.push(...clip);
        setGeneratedClips(uniqueSongs);
      }
    } catch (error) {
      console.error("Failed to generate playlist:", error);
      setError("Failed to generate playlist. Please try again.");
    }
  };

  const generatePlaylistFromInterval = async (interval: any) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const clips: SunoClip[] = [];
      const uniqueSongs: SunoClip[] = []; // Map to store unique songs by pace+genre
      
      // Group intervals by pace and genre to reuse songs
      for (const intervalData of interval.intervals) {
        
        // Generate a new song for this unique pace+genre combination
        const prompt = `A ${intervalData.genre} song with ${intervalData.tempo} BPM tempo for running. The song should be energetic and motivating for a runner maintaining ${Math.round(intervalData.pace / 60)}:${String(Math.round(intervalData.pace % 60)).padStart(2, '0')} per kilometer pace.`;
        const tags = `${intervalData.genre}, ${intervalData.tempo} bpm, energetic, running, motivational`;
        
        const clip = await SunoService.generateAndWaitForCompletion({
          prompt,
          tags,
          makeInstrumental: false,
        });
        
        uniqueSongs.push(...clip)
      
      
      }

      setGeneratedClips(uniqueSongs);
    } catch (error) {
      console.error("Failed to generate playlist:", error);
      setError("Failed to generate playlist. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatPace = (paceInSeconds: number): string => {
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.round(paceInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distanceInMeters: number): string => {
    return (distanceInMeters / 1000).toFixed(2);
  };

  const formatDuration = (durationInSeconds: number): string => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const prepareChartData = (intervals: any[]) => {
    return intervals.map((interval, index) => ({
      segment: `S${interval.segment || index + 1}`,
      distance: `${interval.startKm?.toFixed(1) || 0}-${interval.endKm?.toFixed(1) || 0}km`,
      pace: Math.round(interval.pace / 60 * 100) / 100, // Convert to min/km
      bpm: interval.tempo,
      elevation: interval.elevation || 0,
      genre: interval.genre,
      paceSeconds: interval.pace,
    }));
  };

  const togglePlayPause = (clip: SunoClip) => {
    if (!clip.audio_url) return;

    const clipId = clip.id;

    if (audioElements[clipId]) {
      if (isPlaying[clipId]) {
        audioElements[clipId].pause();
        setIsPlaying((prev) => ({ ...prev, [clipId]: false }));
      } else {
        // Pause all other audio first
        Object.keys(audioElements).forEach((id) => {
          if (id !== clipId && isPlaying[id]) {
            audioElements[id].pause();
            setIsPlaying((prev) => ({ ...prev, [id]: false }));
          }
        });

        audioElements[clipId].play();
        setIsPlaying((prev) => ({ ...prev, [clipId]: true }));
      }
    } else {
      const audio = new Audio(clip.audio_url);
      audio.addEventListener("ended", () => {
        setIsPlaying((prev) => ({ ...prev, [clipId]: false }));
      });
      audio.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying((prev) => ({ ...prev, [clipId]: false }));
      });
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          setDuration((prev) => ({ ...prev, [clipId]: audio.duration }));
        }
      });
      audio.addEventListener("timeupdate", () => {
        if (audio.currentTime && isFinite(audio.currentTime)) {
          setCurrentTime((prev) => ({ ...prev, [clipId]: audio.currentTime }));
        }
      });

      setAudioElements((prev) => ({ ...prev, [clipId]: audio }));

      // Pause all other audio first
      Object.keys(audioElements).forEach((id) => {
        if (isPlaying[id]) {
          audioElements[id].pause();
          setIsPlaying((prev) => ({ ...prev, [id]: false }));
        }
      });

      audio.play();
      setIsPlaying((prev) => ({ ...prev, [clipId]: true }));
    }
  };

  const handleDownload = async (clip: SunoClip) => {
    if (!clip.audio_url) return;

    try {
      const response = await fetch(clip.audio_url);
      if (!response.ok) throw new Error("Failed to fetch audio");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${clip.title || "generated-song"}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: try direct link
      const link = document.createElement("a");
      link.href = clip.audio_url;
      link.download = `${clip.title || "generated-song"}.mp3`;
      link.click();
    }
  };

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-green-50 via-red-50 to-blue-50 relative overflow-hidden">
      {/* Floating cloud decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-20 bg-gradient-to-r from-green-200/40 to-red-200/40 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-24 bg-gradient-to-r from-red-200/40 to-yellow-200/40 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-1/4 w-36 h-22 bg-gradient-to-r from-yellow-200/40 to-green-200/40 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-1/3 w-28 h-18 bg-gradient-to-r from-green-300/30 to-red-300/30 rounded-full blur-xl animate-pulse delay-500" />
        <div className="absolute top-60 left-1/2 w-24 h-16 bg-gradient-to-r from-red-300/25 to-green-300/25 rounded-full blur-2xl animate-pulse delay-3000" />
        <div className="absolute bottom-60 right-10 w-30 h-20 bg-gradient-to-r from-yellow-300/35 to-pink-300/35 rounded-full blur-xl animate-pulse delay-1500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Activity className="w-8 h-8" />
              <Music className="w-6 h-6" />
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RhythmRun
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Generate personalized running playlists based on your pace, elevation, and running style!
            </p>
          </div>

          {/* User Type Selection */}
          {!userType && (
            <Card className="font-sans p-8 backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-center">How do you want to create your playlist?</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setUserType('strava')}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto">
                        <Activity className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Strava Runner</h3>
                      <p className="text-muted-foreground">Connect your Strava account to generate playlists based on your actual running data</p>
                      <Button className="w-full">Connect Strava</Button>
                    </div>
                  </Card>
                  
                  <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setUserType('non-strava')}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <WandSparkles className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Custom Runner</h3>
                      <p className="text-muted-foreground">Create a playlist based on your planned distance or duration</p>
                      <Button className="w-full">Get Started</Button>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          )}

          {/* Strava User Flow */}
          {userType === 'strava' && (
            <Card className="p-8 backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
              <div className="space-y-6">
                {!isAuthenticated ? (
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">Connect Your Strava Account</h2>
                    <p className="text-muted-foreground">We'll analyze your recent runs to create the perfect playlist</p>
                    <Button onClick={loginWithStrava} size="lg" className="bg-orange-600 hover:bg-orange-700">
                      <Activity className="w-5 h-5 mr-2" />
                      Connect with Strava
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold">Your Recent Runs</h2>
                      <Button variant="outline" onClick={() => setUserType(null)}>
                        Back
                      </Button>
                    </div>
                    
                    {stravaRuns.length > 0 ? (
                      <div className="space-y-4">
                        {stravaRuns.map((run) => (
                          <Card 
                            key={run.id} 
                            className={`p-4 cursor-pointer transition-all ${
                              selectedRun?.id === run.id 
                                ? 'ring-2 ring-orange-500 bg-orange-50' 
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => setSelectedRun(run)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="font-semibold">{run.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {formatDistance(run.distance)} km
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDuration(run.moving_time)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {formatPace(run.average_speed ? 1000 / run.average_speed : 0)}/km
                                  </div>
                                </div>
                              </div>
                              {run.total_elevation_gain > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  +{run.total_elevation_gain}m
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                        
                        {selectedRun && (
                          <div className="pt-4 border-t">
                            <Button 
                              onClick={analyzeSelectedRun}
                              disabled={isGenerating}
                              size="lg"
                              className="w-full"
                            >
                              {isGenerating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                  Analyzing Run...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-5 h-5 mr-2" />
                                  Generate Playlist
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Visual Display for Run Analysis */}
                        {runAnalysis && (
                          <div className="pt-6 border-t">
                            <h3 className="text-xl font-semibold mb-4">Run Analysis</h3>
                            {runAnalysis.polyline ? (
                              <ActivityMap encodedPolyline={runAnalysis.polyline} />
                            ) : (
                              <p className="text-sm text-muted-foreground">No map available for this run.</p>
                            )}
                            {/* Visual Chart */}
                            <div className="h-64 w-full mb-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={prepareChartData(runAnalysis.intervals)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="segment" 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Segment', position: 'insideBottom', offset: -5 }}
                                  />
                                  <YAxis 
                                    yAxisId="left"
                                    orientation="left"
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft' }}
                                  />
                                  <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'BPM', angle: 90, position: 'insideRight' }}
                                  />
                                  <Tooltip 
                                    formatter={(value, name) => {
                                      if (name === 'pace') return [`${value} min/km`, 'Pace'];
                                      if (name === 'bpm') return [`${value} BPM`, 'BPM'];
                                      if (name === 'elevation') return [`${value}m`, 'Elevation'];
                                      return [value, name];
                                    }}
                                    labelFormatter={(label, payload) => {
                                      if (payload && payload[0]) {
                                        return `${payload[0].payload.distance} - ${payload[0].payload.genre}`;
                                      }
                                      return label;
                                    }}
                                  />
                                  <Legend />
                                  <Line 
                                    yAxisId="left"
                                    type="monotone" 
                                    dataKey="pace" 
                                    stroke="#ef4444" 
                                    strokeWidth={3}
                                    name="Pace (min/km)"
                                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                  />
                                  <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey="bpm" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    name="BPM"
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            
                            {/* Elevation Bar Chart */}
                            <div className="h-32 w-full mb-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={prepareChartData(runAnalysis.intervals)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="segment" 
                                    tick={{ fontSize: 12 }}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
                                  />
                                  <Tooltip 
                                    formatter={(value) => [`${value}m`, 'Elevation']}
                                    labelFormatter={(label, payload) => {
                                      if (payload && payload[0]) {
                                        return `${payload[0].payload.distance}`;
                                      }
                                      return label;
                                    }}
                                  />
                                  <Bar 
                                    dataKey="elevation" 
                                    fill="#10b981"
                                    name="Elevation (m)"
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            
                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-4 text-center text-sm">
                              <div className="bg-gray-50 p-2 rounded">
                                <div className="font-semibold text-gray-600">Distance</div>
                                <div className="text-lg font-bold">
                                  {formatDistance(runAnalysis.overallStats.distance)} km
                                </div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <div className="font-semibold text-gray-600">Avg Pace</div>
                                <div className="text-lg font-bold">
                                  {formatPace(runAnalysis.overallStats.averagePace)}
                                </div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <div className="font-semibold text-gray-600">Total Elevation</div>
                                <div className="text-lg font-bold">
                                  {runAnalysis.overallStats.totalElevation}m
                                </div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <div className="font-semibold text-gray-600">Duration</div>
                                <div className="text-lg font-bold">
                                  {formatDuration(runAnalysis.overallStats.duration)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No running activities found. Go for a run and come back!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Non-Strava User Flow */}
          {userType === 'non-strava' && (
            <Card className="p-8 backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Create Your Running Plan</h2>
                  <Button variant="outline" onClick={() => setUserType(null)}>
                    Back
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant={inputType === 'distance' ? 'default' : 'outline'}
                      onClick={() => setInputType('distance')}
                    >
                      Distance
                    </Button>
                    <Button
                      variant={inputType === 'duration' ? 'default' : 'outline'}
                      onClick={() => setInputType('duration')}
                    >
                      Duration
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {inputType === 'distance' ? 'Distance (km)' : 'Duration (minutes)'}
                    </label>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder={inputType === 'distance' ? 'e.g., 5' : 'e.g., 30'}
                    />
                  </div>
                  
                  <Button 
                    onClick={generateIntervalOptions}
                    disabled={!inputValue || inputValue <= 0 || isGenerating}
                    size="lg"
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Generating Options...
                      </>
                    ) : (
                      <>
                        <WandSparkles className="w-5 h-5 mr-2" />
                        Generate Interval Options
                      </>
                    )}
                  </Button>
                </div>
                
                {intervalOptions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Choose Your Training Plan</h3>
                    {intervalOptions.map((option, index) => (
                      <Card 
                        key={option.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedInterval?.id === option.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedInterval(selectedInterval?.id === option.id ? null : option)}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold">{option.name}</h4>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                          
                          {/* Visual Chart */}
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={prepareChartData(option.intervals)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="segment" 
                                  tick={{ fontSize: 12 }}
                                  label={{ value: 'Segment', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                  yAxisId="left"
                                  orientation="left"
                                  tick={{ fontSize: 12 }}
                                  label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft' }}
                                />
                                <YAxis 
                                  yAxisId="right"
                                  orientation="right"
                                  tick={{ fontSize: 12 }}
                                  label={{ value: 'BPM', angle: 90, position: 'insideRight' }}
                                />
                                <Tooltip 
                                  formatter={(value, name) => {
                                    if (name === 'pace') return [`${value} min/km`, 'Pace'];
                                    if (name === 'bpm') return [`${value} BPM`, 'BPM'];
                                    if (name === 'elevation') return [`${value}m`, 'Elevation'];
                                    return [value, name];
                                  }}
                                  labelFormatter={(label, payload) => {
                                    if (payload && payload[0]) {
                                      return `${payload[0].payload.distance} - ${payload[0].payload.genre}`;
                                    }
                                    return label;
                                  }}
                                />
                                <Legend />
                                <Line 
                                  yAxisId="left"
                                  type="monotone" 
                                  dataKey="pace" 
                                  stroke="#ef4444" 
                                  strokeWidth={3}
                                  name="Pace (min/km)"
                                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                />
                                <Line 
                                  yAxisId="right"
                                  type="monotone" 
                                  dataKey="bpm" 
                                  stroke="#3b82f6" 
                                  strokeWidth={3}
                                  name="BPM"
                                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Elevation Bar Chart */}
                          <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={prepareChartData(option.intervals)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="segment" 
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                  tick={{ fontSize: 12 }}
                                  label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                  formatter={(value) => [`${value}m`, 'Elevation']}
                                  labelFormatter={(label, payload) => {
                                    if (payload && payload[0]) {
                                      return `${payload[0].payload.distance}`;
                                    }
                                    return label;
                                  }}
                                />
                                <Bar 
                                  dataKey="elevation" 
                                  fill="#10b981"
                                  name="Elevation (m)"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Summary Stats */}
                          <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-semibold text-gray-600">Avg Pace</div>
                              <div className="text-lg font-bold">
                                {formatPace(option.intervals.reduce((sum: number, i: any) => sum + i.pace, 0) / option.intervals.length)}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-semibold text-gray-600">Avg BPM</div>
                              <div className="text-lg font-bold">
                                {Math.round(option.intervals.reduce((sum: number, i: any) => sum + i.tempo, 0) / option.intervals.length)}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-semibold text-gray-600">Total Elevation</div>
                              <div className="text-lg font-bold">
                                {option.intervals.reduce((sum: number, i: any) => sum + (i.elevation || 0), 0)}m
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {selectedInterval && (
                      <div className="pt-4 border-t">
                        <Button 
                          onClick={() => generatePlaylistFromInterval(selectedInterval)}
                          disabled={isGenerating}
                          size="lg"
                          className="w-full"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Generating Playlist...
                            </>
                          ) : (
                            <>
                              <Music className="w-5 h-5 mr-2" />
                              Generate Playlist
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="p-4 bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {error}
              </p>
            </Card>
          )}

          {/* Generated Playlist */}
          {generatedClips.length > 0 && (
            <Card className="p-8 backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-center">Your Running Playlist</h2>
                <div className="space-y-4">
                  {generatedClips.map((clip, ind) => (
                    <Card key={ind} className="p-4 bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">
                            {clip.title || "Untitled Song"}
                          </h3>
                          <div className="text-s text-foreground">
                            {clip.metadata.duration ? `${Math.round(clip.metadata.duration)}s` : ""}
                          </div>
                        </div>

                        {clip.metadata.tags && (
                          <p className="text-sm text-muted-foreground">
                            Style: {clip.metadata.tags}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => togglePlayPause(clip)}
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-orange-200 hover:bg-orange-300 text-orange-800 border-orange-300"
                          >
                            {isPlaying[clip.id] ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Play
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDownload(clip)}
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-orange-400 text-orange-800"
                            disabled={clip.status === "streaming"}
                          >
                            {clip.status === "streaming" ? (
                              <>
                                <Download className="w-4 h-4 mr-2 opacity-50" />
                                Available when complete
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Footer */}
          <p className="text-sm text-muted-foreground text-center">
            Powered by{" "}
            <a
              href="https://suno.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Suno API
            </a>{" "}
            and{" "}
            <a
              href="https://strava.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Strava API
            </a>
          </p>
        </div>
      </div>
      
      {/* Running Animation */}
      <RunningAnimation />
    </div>
  );
}
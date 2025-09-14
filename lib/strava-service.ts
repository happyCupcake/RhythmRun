// Types for Strava API responses
export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_speed: number; // meters per second
  max_speed: number; // meters per second
  average_cadence: number | null;
  average_temp: number | null;
  has_heartrate: boolean;
  average_heartrate: number | null;
  max_heartrate: number | null;
  elev_high: number | null;
  elev_low: number | null;
  pr_count: number;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  from_accepted_tag: boolean;
  average_watts: number | null;
  weighted_average_watts: number | null;
  kilojoules: number | null;
  device_watts: boolean;
  has_kudoed: boolean;
  description: string | null;
  calories: number | null;
}

export interface StravaDetailedActivity extends StravaActivity {
  splits_metric: Array<{
    distance: number;
    elapsed_time: number;
    elevation_difference: number;
    moving_time: number;
    split: number;
    average_speed: number;
    pace_zone: number;
  }>;
  splits_standard: Array<{
    distance: number;
    elapsed_time: number;
    elevation_difference: number;
    moving_time: number;
    split: number;
    average_speed: number;
    pace_zone: number;
  }>;
  best_efforts: Array<{
    id: number;
    resource_state: number;
    name: string;
    activity: {
      id: number;
      resource_state: number;
    };
    athlete: {
      id: number;
      resource_state: number;
    };
    elapsed_time: number;
    moving_time: number;
    start_date: string;
    start_date_local: string;
    distance: number;
    start_index: number;
    end_index: number;
    pr_rank: number | null;
    achievements: any[];
  }>;
  photos: {
    primary: any;
    use_primary_photo: boolean;
    count: number;
  };
  stats_visibility: Array<{
    type: string;
    visibility: string;
  }>;
  hide_from_home: boolean;
  device_name: string | null;
  embed_token: string;
  segment_efforts: any[];
  available_zones: any[];
}

export interface RunAnalysis {
  intervals: Array<{
    minute: number;
    pace: number; // seconds per km
    elevation: number; // meters
    heartRate?: number;
    genre: string;
    tempo: number; // BPM
  }>;
  overallStats: {
    averagePace: number;
    totalElevation: number;
    duration: number;
    distance: number;
  };
}
const api_url = "https://www.strava.com/api/v3"
// Service functions for interacting with Strava API
export class StravaService {
  private static baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "";
  /**
   * Use the refresh token
   */

  static async refreshStravaToken(refreshToken: string) {
    const response = await fetch(`/api/strava/refresh-token?refresh_token=${encodeURIComponent(refreshToken)}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to refresh Strava token");
    }
    return await response.json();
  }
  /**
   * Get user's recent running activities
   */
  static async getRecentRuns(limit: number = 5): Promise<StravaActivity[]> {
    try {
      console.log(localStorage.getItem("strava_access_token"))
      let response = await fetch(`${api_url}/activities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("strava_access_token")}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors[0].field === "access_token") {
          const refreshToken = localStorage.getItem("strava_refresh_token")
          if (refreshToken) {
            const resp = await this.refreshStravaToken(refreshToken)
            window.location.href = `${window.location.origin}?access_token=${resp.access_token}&refresh_token=${resp.refresh_token}&expires_at=${resp.expires_at}`
          }
        }
        throw new Error(errorData.error || "Failed to fetch activities");
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Get recent runs error:", error);
      throw error;
    }
  }

  /**
   * Get detailed activity data including splits and elevation
   */
  static async getActivityDetails(activityId: number): Promise<StravaDetailedActivity> {
    try {
      const response = await fetch(`${api_url}/activities/${activityId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("strava_access_token")}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch activity details");
      }

      return await response.json();
    } catch (error) {
      console.error("Get activity details error:", error);
      throw error;
    }
  }

  /**
   * Analyze a run and generate music recommendations
   */
  static async analyzeRun(activityId: number): Promise<RunAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-run?access_token=${localStorage.getItem("strava_access_token")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze run");
      }

      return await response.json();
    } catch (error) {
      console.error("Analyze run error:", error);
      throw error;
    }
  }

  /**
   * Generate interval options for non-Strava users
   */
  static async generateIntervalOptions(
    type: 'distance' | 'duration',
    value: number
  ): Promise<Array<{
    id: string;
    name: string;
    description: string;
    intervals: Array<{
      minute: number;
      pace: number;
      elevation: number;
      genre: string;
      tempo: number;
    }>;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate-intervals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate intervals");
      }

      return await response.json();
    } catch (error) {
      console.error("Generate intervals error:", error);
      throw error;
    }
  }
}

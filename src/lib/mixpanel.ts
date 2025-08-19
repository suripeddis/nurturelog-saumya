import mixpanel from 'mixpanel-browser'; 

const MIXPANEL_TOKEN = '881bc53c4f201c411270be15d839c8b54';

// Initialize Mixpanel
if (typeof window !== 'undefined') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
    ignore_dnt: true,
  });
}

export const analytics = {
  // Track events
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.track(eventName, properties);
    }
  },

  // Identify users (optional)
  identify: (userId: string) => {
    if (typeof window !== 'undefined') {
      mixpanel.identify(userId);
    }
  },

  // Set user properties (optional)
  setUserProperties: (properties: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.people.set(properties);
    }
  },

  // Specific tracking functions for our app
  trackLandingPageButton: (buttonName: string) => {
    analytics.track('Landing Page Button Clicked', {
      button_name: buttonName,
      page: 'landing',
    });
  },

  trackFileUploaded: (fileType: string, fileSize: number) => {
    analytics.track('File Uploaded', {
      file_type: fileType,
      file_size_mb: Math.round(fileSize / (1024 * 1024) * 100) / 100, // Convert to MB
      upload_method: 'file_drop',
    });
  },

  trackYouTubeSubmitted: (url: string) => {
    analytics.track('YouTube Link Submitted', {
      url_provided: !!url,
      upload_method: 'youtube_link',
    });
  },

  trackProcessingStarted: (uploadMethod: 'file' | 'youtube') => {
    analytics.track('Processing Started', {
      upload_method: uploadMethod,
    });
  },

  trackResultsViewed: (analysisData?: {
    successesCount: number;
    strugglesCount: number;
    topicsCount: number;
    transcriptLength: number;
  }) => {
    analytics.track('Results Viewed', {
      successes_count: analysisData?.successesCount || 0,
      struggles_count: analysisData?.strugglesCount || 0,
      topics_count: analysisData?.topicsCount || 0,
      transcript_length_chars: analysisData?.transcriptLength || 0,
    });
  },

  trackPDFSaved: (analysisData?: {
    successesCount: number;
    strugglesCount: number;
    topicsCount: number;
    transcriptLength: number;
  }) => {
    analytics.track('PDF Saved', {
      successes_count: analysisData?.successesCount || 0,
      struggles_count: analysisData?.strugglesCount || 0,
      topics_count: analysisData?.topicsCount || 0,
      transcript_length_chars: analysisData?.transcriptLength || 0,
      export_format: 'pdf',
    });
  },

  trackNewSessionStarted: () => {
    analytics.track('New Session Started', {
      action: 'reset_and_return_to_upload',
    });
  },

  trackError: (errorType: string, errorMessage: string, context?: string) => {
    analytics.track('Error Occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: context || 'unknown',
    });
  },

  trackUserLoggedIn: (user: { id: string; email?: string }) => {
    if (typeof window === 'undefined') return;
    mixpanel.identify(user.id);
    mixpanel.people.set({ $email: user.email });
    mixpanel.track('User Logged In', {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
  },

};

export default analytics; 
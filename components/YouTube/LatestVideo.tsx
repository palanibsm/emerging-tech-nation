'use client';

import { useEffect, useState } from 'react';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

/**
 * Display the latest video from Emerging Tech Nation YouTube channel
 * The channel ID is embedded in the component for simplicity
 */
export default function YouTubeLatestVideo() {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestVideo();
  }, []);

  async function fetchLatestVideo() {
    try {
      setLoading(true);
      // Channel ID for @emergingtechnation
      const channelId = 'UCvVBhq1cVMT3aDSVVX3xqHQ';
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      if (!apiKey) {
        console.warn('YouTube API key not configured');
        setError('YouTube integration not configured');
        setLoading(false);
        return;
      }

      // Fetch channel uploads playlist
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
      );

      if (!channelRes.ok) {
        throw new Error('Failed to fetch channel');
      }

      const channelData = (await channelRes.json()) as {
        items: Array<{ contentDetails: { relatedPlaylists: { uploads: string } } }>;
      };

      const uploadsPlaylistId = channelData.items[0]?.contentDetails.relatedPlaylists.uploads;
      if (!uploadsPlaylistId) {
        throw new Error('Uploads playlist not found');
      }

      // Fetch latest video from uploads playlist
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${apiKey}`
      );

      if (!playlistRes.ok) {
        throw new Error('Failed to fetch videos');
      }

      const playlistData = (await playlistRes.json()) as {
        items: Array<{
          snippet: {
            title: string;
            description: string;
            thumbnail: { high: { url: string } };
            publishedAt: string;
            videoId: string;
          };
        }>;
      };

      const latestItem = playlistData.items[0];
      if (latestItem) {
        setVideo({
          id: latestItem.snippet.videoId,
          title: latestItem.snippet.title,
          description: latestItem.snippet.description.slice(0, 200),
          thumbnail: latestItem.snippet.thumbnail.high.url,
          publishedAt: new Date(latestItem.snippet.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching YouTube video:', err);
      setError('Unable to load video');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-slate-500">Loading latest video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-600 mb-4">📺 Subscribe to our YouTube channel</p>
        <a
          href="https://youtube.com/@emergingtechnation"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
        >
          Watch on YouTube →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Embed */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-lg shadow-lg"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Video Info */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-900 line-clamp-2">{video.title}</h3>
        <p className="text-sm text-slate-500">{video.publishedAt}</p>
        <p className="text-slate-600 text-sm leading-relaxed">{video.description}...</p>
        <a
          href="https://youtube.com/@emergingtechnation"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 mt-3"
        >
          Subscribe to our channel →
        </a>
      </div>
    </div>
  );
}

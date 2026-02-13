import React from 'react';
import { Play, FileVideo, Download, AlertCircle } from 'lucide-react';
import { getMediaAccessURL } from '../../../lib/api';

interface VideoEvidenceProps {
    mediaKey: string;
}

export default function VideoEvidence({ mediaKey }: VideoEvidenceProps) {
    const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function fetchUrl() {
            try {
                setLoading(true);
                const url = await getMediaAccessURL(mediaKey);
                if (url) {
                    setVideoUrl(url);
                } else {
                    setError('Failed to generate access URL');
                }
            } catch (err) {
                setError('Error fetching media evidence');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (mediaKey) {
            fetchUrl();
        }
    }, [mediaKey]);

    if (loading) {
        return (
            <div className="bg-black/20 rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center space-y-4 animate-pulse">
                <FileVideo className="w-8 h-8 text-blue-500/50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/50">Retrieving Evidence...</span>
            </div>
        );
    }

    if (error || !videoUrl) {
        return (
            <div className="bg-red-500/5 rounded-2xl p-8 border border-red-500/10 flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="w-8 h-8 text-red-500/50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500/50">{error || 'Evidence Link Expired'}</span>
            </div>
        );
    }

    return (
        <div className="group relative bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <video
                src={videoUrl}
                className="w-full aspect-video object-cover"
                controls
                poster="/video-poster.png"
            >
                Your browser does not support the video tag.
            </video>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                    href={videoUrl}
                    download
                    className="p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white hover:bg-blue-600 transition-colors"
                >
                    <Download className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}

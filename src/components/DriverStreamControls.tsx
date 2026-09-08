import React, { useState } from 'react';
import { Video, VideoOff, Sliders, Copy, Check, ExternalLink, Radio, Eye, EyeOff } from 'lucide-react';
import { StreamConfig, StreamProtocol } from '../types';

interface DriverStreamControlsProps {
  config: StreamConfig;
  onUpdateConfig: (updater: (prev: StreamConfig) => StreamConfig) => void;
}

export const DriverStreamControls: React.FC<DriverStreamControlsProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRtmpDetails, setShowRtmpDetails] = useState(true);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [customUrl, setCustomUrl] = useState(config.streamUrl || '');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [channelInput, setChannelInput] = useState(config.twitchChannel || 'fraction32');

  const toggleBroadcasting = () => {
    onUpdateConfig((prev) => ({
      ...prev,
      isBroadcasting: !prev.isBroadcasting,
    }));
  };

  const handleProtocolChange = (protocol: StreamProtocol) => {
    onUpdateConfig((prev) => ({
      ...prev,
      protocol,
    }));
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig((prev) => ({
      ...prev,
      streamUrl: customUrl.trim() || undefined,
    }));
  };

  const handleApplyChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanChannel = channelInput.trim().toLowerCase();
    onUpdateConfig((prev) => ({
      ...prev,
      twitchChannel: cleanChannel,
    }));
  };

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    });
  };

  const rtmpUrl = config.rtmpUrl || 'rtmp://live.twitch.tv/app/live_1536964233_jbAXbvKBbzwLjg51bRHDfSEsCdS736';
  const rtmpServer = config.rtmpServer || 'rtmp://live.twitch.tv/app/';
  const streamKey = config.streamKey || 'live_1536964233_jbAXbvKBbzwLjg51bRHDfSEsCdS736';

  return (
    <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-slate-800 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.isBroadcasting ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xs font-bold text-slate-800">Broadcaster Controls</span>
        </div>

        {/* Toggle broadcast online/offline */}
        <button
          type="button"
          id="toggle-driver-broadcast-btn"
          onClick={toggleBroadcasting}
          className={`h-7 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
            config.isBroadcasting
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
          }`}
        >
          {config.isBroadcasting ? (
            <>
              <VideoOff className="w-3.5 h-3.5" />
              <span>Simulate Offline</span>
            </>
          ) : (
            <>
              <Video className="w-3.5 h-3.5" />
              <span>Start Broadcast</span>
            </>
          )}
        </button>
      </div>

      {/* Protocol Toggle */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-400">Source:</span>
          {(['twitch', 'webrtc', 'hls'] as StreamProtocol[]).map((p) => (
            <button
              key={p}
              type="button"
              id={`protocol-select-${p}`}
              onClick={() => handleProtocolChange(p)}
              className={`px-2 py-0.5 rounded-md font-mono uppercase text-[10px] font-bold transition-colors ${
                config.protocol === p
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p === 'twitch' ? 'RTMP (Twitch)' : p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowRtmpDetails(!showRtmpDetails)}
          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
        >
          <Radio className="w-3 h-3" />
          <span>{showRtmpDetails ? 'Hide RTMP' : 'RTMP Details'}</span>
        </button>
      </div>

      {/* RTMP INGEST CREDENTIALS CARD */}
      {showRtmpDetails && (
        <div className="mt-3 p-3 bg-white border border-slate-200/90 rounded-xl flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              RTMP Ingest Credentials
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Twitch Ingest</span>
          </div>

          {/* RTMP Server URL */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="min-w-0">
              <p className="text-[9px] uppercase font-bold text-slate-400">RTMP Server (Ingest)</p>
              <p className="font-mono text-[11px] text-slate-700 truncate">{rtmpServer}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(rtmpServer, 'url')}
              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-600 transition-colors shrink-0"
              title="Copy RTMP Server"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* RTMP Stream Key COMMENTED OUT SO NO PARENT OR VIEWER CAN SEE SENSITIVE PUBLISHER CREDENTIALS:
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase font-bold text-slate-400">Stream Key</p>
              <p className="font-mono text-[11px] text-slate-700 truncate select-none">
                {showStreamKey ? streamKey : '••••••••••••••••••••••••••••••••'}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowStreamKey(!showStreamKey)}
                className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                title={showStreamKey ? 'Hide Stream Key' : 'Show Stream Key'}
              >
                {showStreamKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(streamKey, 'key')}
                className="p-1.5 hover:bg-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-colors"
                title="Copy Stream Key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          */}

          {/* Channel Name Input */}
          <form onSubmit={handleApplyChannel} className="flex items-center gap-2 pt-0.5">
            <div className="flex-1">
              <label htmlFor="twitch-channel-input" className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                Twitch Channel (Username)
              </label>
              <input
                id="twitch-channel-input"
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="Enter Twitch channel name"
                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="mt-3.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              Set Channel
            </button>
          </form>

          <p className="text-[10px] text-slate-400 leading-tight">
            Configure this RTMP URL &amp; Stream Key in OBS, Prism Live, or your vehicle camera to publish. The embedded player above will stream your broadcast.
          </p>
        </div>
      )}

      {/* Custom Stream URL toggle */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-slate-400 hover:text-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-colors"
        >
          <Sliders className="w-3 h-3" />
          <span>{showAdvanced ? 'Hide Custom URL' : 'Custom HLS/MP4 URL'}</span>
        </button>
      </div>

      {showAdvanced && (
        <form onSubmit={handleApplyUrl} className="mt-2 flex gap-2">
          <input
            type="url"
            placeholder="Custom HLS (.m3u8) or MP4 URL"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};


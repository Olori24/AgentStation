import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Video,
  Layers,
  Sparkles,
  Github,
  Loader2,
  CheckCircle,
  Edit,
  Save,
  X,
  Sliders,
  Smartphone,
  Monitor,
  Square,
  Music,
} from 'lucide-react';
import { VideoProject, VideoScene } from '../types';

interface VideoStudioProps {
  video?: VideoProject | null;
  onUpdateVideo?: (updated: VideoProject) => void;
}

const DEFAULT_FALLBACK_VIDEO: VideoProject = {
  title: 'Autonomous System Demo',
  hook: 'AUTONOMOUS SQUAD DEMO',
  subtitle: 'Generated kinetic product video',
  totalDurationSec: 16,
  soundtrackMood: 'energetic-tech',
  audioScript: 'Autonomous engineering with AgentStation multi-agent squad.',
  scenes: [
    {
      id: 'scene-1',
      sceneIndex: 0,
      durationSec: 4,
      badge: 'THE CHALLENGE',
      heading: 'ENGINEERING BOTTLENECK',
      subheading: 'Manual software workflows slow down deployment velocity',
      bulletPoints: ['Boilerplate generation', 'Fragmented testing', 'Manual release pipelines'],
      accentColor: '#3b82f6',
    },
    {
      id: 'scene-2',
      sceneIndex: 1,
      durationSec: 4,
      badge: 'THE SOLUTION',
      heading: 'AUTONOMOUS MULTI-AGENT SQUAD',
      subheading: 'Collaborative AI agents architect, develop, and test in real time',
      bulletPoints: ['Atlas: System Architect', 'Cypher: Senior Engineer', 'Sentinel: QA Auditor'],
      accentColor: '#10b981',
    },
    {
      id: 'scene-3',
      sceneIndex: 2,
      durationSec: 4,
      badge: 'VERIFIED IN SANDBOX',
      heading: '100% TEST COVERAGE',
      subheading: 'Isolated Docker sandbox execution with automated assertions',
      bulletPoints: ['All unit tests passing', 'Clean data contracts', 'Zero regressions'],
      accentColor: '#f59e0b',
    },
    {
      id: 'scene-4',
      sceneIndex: 3,
      durationSec: 4,
      badge: 'DEPLOY NOW',
      heading: 'PUSH TO GITHUB',
      subheading: 'Synchronized directly with github.com/Olori24/AgentStation',
      bulletPoints: ['GitHub Actions verification', 'One-click PR generation', 'Production deployment ready'],
      accentColor: '#8b5cf6',
      callToAction: 'github.com/Olori24/AgentStation',
    },
  ],
};

export const VideoStudio: React.FC<VideoStudioProps> = ({ video, onUpdateVideo }) => {
  const safeVideo = video || DEFAULT_FALLBACK_VIDEO;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSynthEnabled, setIsSynthEnabled] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [isEditingScene, setIsEditingScene] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalDuration = safeVideo.totalDurationSec || 16;
  const scenes = safeVideo.scenes || [];
  const scenesCount = scenes.length;

  // Determine current active scene based on time
  const currentSceneIndex = scenesCount > 0
    ? Math.max(0, Math.min(Math.floor((currentTime / totalDuration) * scenesCount), scenesCount - 1))
    : 0;

  const activeScene = (scenes && scenes.length > 0 && scenes[currentSceneIndex])
    ? scenes[currentSceneIndex]
    : {
        id: 'scene-default',
        sceneIndex: 0,
        durationSec: 4,
        badge: 'ACTIVE RUN',
        heading: safeVideo.title || 'AUTONOMOUS SQUAD',
        subheading: safeVideo.subtitle || 'Processing project parameters...',
        bulletPoints: ['Architecting specifications', 'Executing unit test assertions', 'Bundling for GitHub'],
        accentColor: '#3b82f6',
      };

  // Local draft for scene editing
  const [draftScene, setDraftScene] = useState<VideoScene>(activeScene);

  useEffect(() => {
    setDraftScene(activeScene);
  }, [currentSceneIndex, activeScene.id]);

  // Dimensions based on aspect ratio
  const canvasDimensions = {
    '16:9': { width: 1280, height: 720, aspectClass: 'aspect-video' },
    '9:16': { width: 720, height: 1280, aspectClass: 'aspect-[9/16] max-h-[460px]' },
    '1:1': { width: 1080, height: 1080, aspectClass: 'aspect-square max-h-[460px]' },
  }[aspectRatio];

  // Synthesizer beep / chime on scene transition
  const playSynthPulse = (freq: number = 440) => {
    if (!isAudioEnabled || !isSynthEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') {
        ctx?.resume();
      }
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext restricted in some sandboxes
    }
  };

  // Synchronized voiceover speech & synth chime
  useEffect(() => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (!isAudioEnabled || !isPlaying || scenesCount === 0 || !scenes[currentSceneIndex]) {
        return;
      }
      playSynthPulse(520 + currentSceneIndex * 65);
      const scene = scenes[currentSceneIndex];
      const utterance = new SpeechSynthesisUtterance(
        `${scene.badge || ''}. ${scene.heading || ''}. ${scene.subheading || ''}`
      );
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis might be restricted
    }
  }, [currentSceneIndex, isPlaying, isAudioEnabled, scenesCount]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
      } catch {
        // Ignored
      }
    };
  }, []);

  // Main 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: W, height: H } = canvasDimensions;

    let particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.2,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    const render = () => {
      if (isPlaying) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed >= totalDuration) {
          startTimeRef.current = Date.now();
          setCurrentTime(0);
        } else {
          setCurrentTime(elapsed);
        }
      }

      const scene = isEditingScene ? draftScene : activeScene;
      const accent = scene.accentColor || '#3b82f6';
      const bulletList = Array.isArray(scene.bulletPoints) && scene.bulletPoints.length > 0
        ? scene.bulletPoints
        : ['Autonomous multi-agent execution', 'Sandboxed container verification', 'Production ready code'];

      // 1. Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      // 2. Animated Particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = H;
        ctx.fillStyle = `rgba(147, 197, 253, ${p.opacity * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ambient radial glow
      const radialGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) * 0.6);
      radialGrad.addColorStop(0, `${accent}20`);
      radialGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, W, H);

      // Frame Inset Margin
      const padX = W * 0.06;
      const padY = H * 0.07;
      const frameW = W - padX * 2;
      const frameH = H - padY * 2;

      // 3. Futuristic HUD Frame
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padX, padY, frameW, frameH);

      // Glowing corner accents
      const cornerSize = Math.min(W, H) * 0.035;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(padX, padY + cornerSize);
      ctx.lineTo(padX, padY);
      ctx.lineTo(padX + cornerSize, padY);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(padX + frameW - cornerSize, padY);
      ctx.lineTo(padX + frameW, padY);
      ctx.lineTo(padX + frameW, padY + cornerSize);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(padX, padY + frameH - cornerSize);
      ctx.lineTo(padX, padY + frameH);
      ctx.lineTo(padX + cornerSize, padY + frameH);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(padX + frameW - cornerSize, padY + frameH);
      ctx.lineTo(padX + frameW, padY + frameH);
      ctx.lineTo(padX + frameW, padY + frameH - cornerSize);
      ctx.stroke();

      // 4. Header Badge: Brand
      const headerY = padY + 40;
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = accent;
      ctx.fillText('⚡ AGENTSTATION // AUTONOMOUS MULTI-AGENT CLUSTER', padX + 25, headerY);

      // 5. Scene Badge Pill
      const badgeY = headerY + 35;
      ctx.fillStyle = `${accent}25`;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(padX + 25, badgeY, 180, 28, 14);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(scene.badge, padX + 45, badgeY + 18);

      // 6. Kinetic Title & Subtitle
      const titleY = badgeY + 60;
      const titleFontSize = Math.max(26, Math.min(44, Math.floor(W * 0.035)));
      ctx.font = `900 ${titleFontSize}px sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = `${accent}50`;
      ctx.shadowBlur = 12;
      ctx.fillText(scene.heading, padX + 25, titleY);
      ctx.shadowBlur = 0;

      // Subheading
      const subY = titleY + 38;
      ctx.font = '500 18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(scene.subheading, padX + 25, subY);

      // 7. Content Body
      const bodyY = subY + 45;
      bulletList.slice(0, 4).forEach((point, idx) => {
        const y = bodyY + idx * (aspectRatio === '9:16' ? 70 : 48);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(padX + 25, y - 24, frameW - 50, 42, 8);
        ctx.fill();
        ctx.stroke();

        // Dot
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(padX + 48, y - 4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '600 15px sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(point, padX + 68, y + 2);
      });

      // 8. Bottom CTA Banner
      const ctaH = 54;
      const ctaY = padY + frameH - ctaH - 25;
      ctx.fillStyle = '#0a1020';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(padX + 25, ctaY, frameW - 50, ctaH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('TARGET REPO:', padX + 45, ctaY + 32);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('github.com/Olori24/AgentStation-Factory', padX + 155, ctaY + 32);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('● 100% VERIFIED', padX + frameW - 170, ctaY + 32);

      // 9. Scrub Timeline Bar at Bottom
      const timelineY = padY + frameH - 12;
      const progressW = (currentTime / totalDuration) * (frameW - 50);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(padX + 25, timelineY, frameW - 50, 4);

      ctx.fillStyle = accent;
      ctx.fillRect(padX + 25, timelineY, progressW, 4);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, currentTime, currentSceneIndex, scenes, totalDuration, canvasDimensions, isEditingScene, draftScene, aspectRatio]);

  const togglePlay = () => {
    if (isPlaying) {
      pausedTimeRef.current = currentTime;
      setIsPlaying(false);
    } else {
      startTimeRef.current = Date.now() - currentTime * 1000;
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    startTimeRef.current = Date.now();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSelectScene = (index: number) => {
    const sceneTime = (index / scenes.length) * totalDuration;
    startTimeRef.current = Date.now() - sceneTime * 1000;
    setCurrentTime(sceneTime);
  };

  const handleSaveDraftScene = () => {
    if (onUpdateVideo) {
      const updatedScenes = [...scenes];
      updatedScenes[currentSceneIndex] = draftScene;
      onUpdateVideo({ ...video, scenes: updatedScenes });
    }
    setIsEditingScene(false);
  };

  // Video Exporter via MediaRecorder
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);
      handleRestart();

      const stream = canvas.captureStream(30);
      let selectedMime = 'video/webm;codecs=vp9';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (!MediaRecorder.isTypeSupported(selectedMime)) {
          selectedMime = MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : MediaRecorder.isTypeSupported('video/mp4')
            ? 'video/mp4'
            : '';
        }
      }

      const recorderOptions: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const fileExt = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AgentStation_${video.title.replace(/\s+/g, '_')}_${aspectRatio}.${fileExt}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordProgress(100);
      };

      recorder.start();

      const durationMs = totalDuration * 1000;
      const intervalMs = 200;
      let recordedMs = 0;

      const progressTimer = setInterval(() => {
        recordedMs += intervalMs;
        const pct = Math.min(Math.round((recordedMs / durationMs) * 100), 99);
        setRecordProgress(pct);

        if (recordedMs >= durationMs) {
          clearInterval(progressTimer);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, intervalMs);
    } catch (err: any) {
      console.error('Video recording failed:', err);
      setIsRecording(false);
    }
  };

  const handleDownloadStoryboard = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(video, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `AgentStation_Storyboard_${video.title.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Studio Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Kinetic Video Producer
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {canvasDimensions.width}x{canvasDimensions.height}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Aspect Ratio Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setAspectRatio('16:9')}
              title="16:9 Landscape"
              className={`p-1 rounded flex items-center gap-1 ${
                aspectRatio === '16:9' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              title="9:16 Vertical (Shorts/TikTok/Reels)"
              className={`p-1 rounded flex items-center gap-1 ${
                aspectRatio === '9:16' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              title="1:1 Square"
              className={`p-1 rounded flex items-center gap-1 ${
                aspectRatio === '1:1' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Square className="w-3 h-3" />
            </button>
          </div>

          {/* Synth Audio Toggle */}
          <button
            onClick={() => setIsSynthEnabled(!isSynthEnabled)}
            className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition ${
              isSynthEnabled
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Toggle Synthesizer Chimes"
          >
            <Music className="w-3.5 h-3.5" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition ${
              isAudioEnabled
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Toggle Voiceover Narration"
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono hidden sm:inline">Voiceover</span>
          </button>

          {/* Storyboard JSON Button */}
          <button
            onClick={handleDownloadStoryboard}
            title="Download Storyboard & Script JSON"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Script JSON</span>
          </button>

          {/* Export Video Button */}
          <button
            onClick={handleExportVideo}
            disabled={isRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition disabled:opacity-50"
          >
            {isRecording ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>REC {recordProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export (.webm)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 min-h-[300px]">
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          className={`w-full max-w-2xl rounded-xl border border-slate-800 shadow-2xl bg-[#090d16] ${canvasDimensions.aspectClass}`}
        />

        {/* Recording Overlay Indicator */}
        {isRecording && (
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-xs backdrop-blur">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>REC // {recordProgress}%</span>
          </div>
        )}
      </div>

      {/* Scene Editor Drawer */}
      {isEditingScene && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between font-mono font-bold text-slate-300">
            <span>Edit Scene {currentSceneIndex + 1} Parameters:</span>
            <button onClick={() => setIsEditingScene(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500">Badge Label:</label>
              <input
                type="text"
                value={draftScene.badge}
                onChange={(e) => setDraftScene({ ...draftScene, badge: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Accent Color:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draftScene.accentColor}
                  onChange={(e) => setDraftScene({ ...draftScene, accentColor: e.target.value })}
                  className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                />
                <span className="font-mono text-slate-400">{draftScene.accentColor}</span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-500">Heading:</label>
              <input
                type="text"
                value={draftScene.heading}
                onChange={(e) => setDraftScene({ ...draftScene, heading: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-500">Subheading:</label>
              <input
                type="text"
                value={draftScene.subheading}
                onChange={(e) => setDraftScene({ ...draftScene, subheading: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsEditingScene(false)}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraftScene}
              className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              <span>Apply to Scene</span>
            </button>
          </div>
        </div>
      )}

      {/* Playback Controls & Scene Navigation */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Play / Pause buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={handleRestart}
              title="Restart Video"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditingScene(!isEditingScene)}
              title="Edit Current Scene"
              className={`p-2 rounded-lg transition ${
                isEditingScene ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Edit className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 pl-2">
              {Math.floor(currentTime)}s / {totalDuration}s
            </span>
          </div>

          {/* Scene selector jump buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span className="text-[11px] font-mono text-slate-500 uppercase">Scenes:</span>
            {scenes.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleSelectScene(idx)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                  currentSceneIndex === idx
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {idx + 1}. {s.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Narrative Voiceover Script Box */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Creative Director Script
            </span>
            <span>Mood: {safeVideo.soundtrackMood}</span>
          </div>
          <p className="text-slate-300 leading-relaxed italic">
            "{safeVideo.audioScript}"
          </p>
        </div>
      </div>
    </div>
  );
};

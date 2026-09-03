"use client";

import { AudioLines, Check, ChevronDown, CircleHelp, Clapperboard, Download, FileVideo, FolderOpen, Gauge, Maximize2, Music2, Pause, Play, Plus, Scissors, Sparkles, Subtitles, Upload, Volume2, Wand2, X } from "lucide-react";
import { useMutation } from "convex/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";

type MediaAsset = { name: string; url: string };

const timeLabel = (value: number) => {
  const seconds = Math.max(0, Math.floor(value));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const importVideoRef = useRef<HTMLInputElement>(null);
  const importMusicRef = useRef<HTMLInputElement>(null);
  const importVoiceRef = useRef<HTMLInputElement>(null);
  const [video, setVideo] = useState<MediaAsset | null>(null);
  const [music, setMusic] = useState<MediaAsset | null>(null);
  const [voice, setVoice] = useState<MediaAsset | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [musicVolume, setMusicVolume] = useState(16);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [captions, setCaptions] = useState("Първата секунда решава дали ще останат.\nЗатова започваме с най-силния кадър.\nПосле — само ясна идея и бързо темпо.");
  const [projectName, setProjectName] = useState("Ново вирусно видео");
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const saveToConvex = useMutation(api.cutlyProjects.upsert);

  const activeCaption = useMemo(() => {
    const lines = captions.split("\n").filter(Boolean);
    return lines[Math.max(0, Math.min(lines.length - 1, Math.floor((current - start) / 4)))] || "";
  }, [captions, current, start]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (musicRef.current) musicRef.current.volume = musicVolume / 100; if (voiceRef.current) voiceRef.current.volume = voiceVolume / 100; }, [musicVolume, voiceVolume]);

  function importAsset(event: ChangeEvent<HTMLInputElement>, kind: "video" | "music" | "voice") {
    const file = event.target.files?.[0]; if (!file) return;
    const asset = { name: file.name.replace(/\.[^/.]+$/, ""), url: URL.createObjectURL(file) };
    if (kind === "video") { setVideo(asset); setStart(0); setEnd(0); setCurrent(0); setIsPlaying(false); }
    if (kind === "music") setMusic(asset); if (kind === "voice") setVoice(asset); event.target.value = "";
  }
  function seek(value: number) {
    const element = videoRef.current; if (!element) return;
    const next = Math.max(start, Math.min(end || duration, value));
    element.currentTime = next; setCurrent(next);
    if (musicRef.current) musicRef.current.currentTime = Math.max(0, next - start);
    if (voiceRef.current) voiceRef.current.currentTime = Math.max(0, next - start);
  }
  function togglePlayback() {
    const element = videoRef.current; if (!element) return;
    if (isPlaying) { element.pause(); musicRef.current?.pause(); voiceRef.current?.pause(); return; }
    if (element.currentTime < start || element.currentTime >= end) element.currentTime = start;
    element.play();
    if (musicRef.current) { musicRef.current.currentTime = Math.max(0, element.currentTime - start); musicRef.current.play(); }
    if (voiceRef.current) { voiceRef.current.currentTime = Math.max(0, element.currentTime - start); voiceRef.current.play(); }
  }
  async function saveProject() {
    window.localStorage.setItem("cutly-editor-project", JSON.stringify({ name: projectName, speed, captions, musicVolume }));
    const ownerKey = window.localStorage.getItem("cutly-owner-key") || crypto.randomUUID();
    window.localStorage.setItem("cutly-owner-key", ownerKey);
    await saveToConvex({ ownerKey, title: projectName, settings: { speed, captions, captionsEnabled: captionsOn, musicVolume } });
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  }
  async function exportVideo() {
    const source = videoRef.current; if (!source || !video) return;
    if (!("MediaRecorder" in window) || !("captureStream" in HTMLMediaElement.prototype)) { alert("За изнасяне използвай Chrome."); return; }
    setExporting(true);
    try {
      const type = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
      const recorder = new MediaRecorder((source as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream(), { mimeType: type }); const parts: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) parts.push(event.data); };
      recorder.onstop = () => { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(parts, { type: "video/webm" })); link.download = `${projectName.replace(/[^a-z0-9а-яё _-]/gi, "").trim() || "cutly-video"}.webm`; link.click(); setExporting(false); };
      source.currentTime = start; source.playbackRate = speed; recorder.start(600); await source.play();
      const stop = () => { if (source.currentTime >= end || source.ended) { source.pause(); recorder.stop(); } else requestAnimationFrame(stop); }; stop();
    } catch { setExporting(false); alert("Не успях да изнеса файла. Опитай с по-кратък клип."); }
  }

  const total = Math.max(duration, 1); const selectionWidth = Math.max(4, ((end - start) / total) * 100);
  return <main className="app-shell">
    <input ref={importVideoRef} className="sr-only" accept="video/*" type="file" onChange={(event) => importAsset(event, "video")} />
    <input ref={importMusicRef} className="sr-only" accept="audio/*" type="file" onChange={(event) => importAsset(event, "music")} />
    <input ref={importVoiceRef} className="sr-only" accept="audio/*" type="file" onChange={(event) => importAsset(event, "voice")} />
    <audio ref={musicRef} src={music?.url} loop /><audio ref={voiceRef} src={voice?.url} />
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Clapperboard size={20} /></span><span>cutly</span></div><button className="new-project" onClick={() => importVideoRef.current?.click()}><Plus size={18} /> Нов проект</button><div className="nav-label">РАБОТНО ПРОСТРАНСТВО</div><button className="nav-item active"><FolderOpen size={18} /> Моите проекти <span>1</span></button><button className="nav-item" onClick={() => setHelpOpen(true)}><Sparkles size={18} /> AI инструменти</button><div className="sidebar-bottom"><button className="help-link" onClick={() => setHelpOpen(true)}><CircleHelp size={17} /> Как работи?</button><div className="profile"><div>Б</div><span>Bozhidar</span><ChevronDown size={15} /></div></div></aside>
    <section className="workspace"><header className="topbar"><div className="breadcrumb"><span>Моите проекти</span><span className="slash">/</span><input value={projectName} onChange={(e) => setProjectName(e.target.value)} aria-label="Име на проекта" /></div><div className="top-actions"><button className="text-button" onClick={saveProject}>{saved ? <><Check size={16} /> Запазено</> : "Запази"}</button><button className="export-button" disabled={!video || exporting} onClick={exportVideo}><Download size={17} /> {exporting ? "Изнасяне…" : "Изнеси видео"}</button></div></header>
      <div className="editor-grid"><section className="preview-panel"><div className="preview-heading"><div><p className="eyebrow">ВЕРТИКАЛЕН КЛИП</p><h1>Твоето видео</h1></div><button className="icon-button" aria-label="Цял екран"><Maximize2 size={18} /></button></div><div className="phone-frame">{video ? <><video ref={videoRef} src={video.url} onLoadedMetadata={() => { const value = videoRef.current?.duration || 0; setDuration(value); setEnd(value); }} onTimeUpdate={() => { const element = videoRef.current; if (!element) return; setCurrent(element.currentTime); if (element.currentTime >= end && end > start) { element.pause(); musicRef.current?.pause(); voiceRef.current?.pause(); } }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />{captionsOn && activeCaption && <div className="caption-overlay">{activeCaption}</div>}<div className="preview-gradient" /></> : <button className="upload-card" onClick={() => importVideoRef.current?.click()}><span><Upload size={28} /></span><strong>Качи първия си клип</strong><small>MP4, MOV или WebM</small></button>}</div><div className="preview-controls"><button className="round-play" onClick={togglePlayback} disabled={!video}>{isPlaying ? <Pause fill="currentColor" size={19} /> : <Play fill="currentColor" size={19} />}</button><span>{timeLabel(current)}</span><input className="progress" aria-label="Позиция" type="range" min={start} max={end || duration || 1} step="0.01" value={Math.min(current, end || 0)} onChange={(e) => seek(Number(e.target.value))} disabled={!video} /><span>{timeLabel(Math.max(0, end - start))}</span><button className="volume-button"><Volume2 size={18} /></button></div></section>
        <aside className="inspector"><div className="tool-tabs"><button className="tool-tab active"><Scissors size={17} /> Редакция</button><button className="tool-tab"><Wand2 size={17} /> AI</button></div><div className="inspector-scroll"><section className="setting-card"><div className="setting-title"><span><Scissors size={17} /> Изрежи клипа</span><span className="duration-chip">{timeLabel(Math.max(0, end - start))}</span></div><p>Избери само силната част от клипа.</p><div className="cut-fields"><label>Начало<input type="number" min="0" max={end} step="0.1" value={start.toFixed(1)} onChange={(e) => { const value = Math.max(0, Math.min(Number(e.target.value), end - .1)); setStart(value); if (current < value) seek(value); }} /></label><label>Край<input type="number" min={start} max={duration} step="0.1" value={end.toFixed(1)} onChange={(e) => setEnd(Math.min(duration, Math.max(Number(e.target.value), start + .1)))} /></label></div></section><section className="setting-card"><div className="setting-title"><span><Gauge size={17} /> Скорост</span><b>{speed.toFixed(1)}×</b></div><div className="speed-buttons">{[0.75, 1, 1.1, 1.25, 1.5, 2].map((item) => <button key={item} className={speed === item ? "selected" : ""} onClick={() => setSpeed(item)}>{item}×</button>)}</div></section><section className="setting-card"><div className="setting-title"><span><Music2 size={17} /> Фонова музика</span>{music && <button className="remove" onClick={() => setMusic(null)}><X size={15} /></button>}</div>{music ? <><div className="asset-row"><span className="asset-icon"><Music2 size={17} /></span><span>{music.name}</span></div><label className="range-label">Сила <b>{musicVolume}%</b><input type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} /></label></> : <button className="add-asset" onClick={() => importMusicRef.current?.click()}><Plus size={17} /> Добави музика</button>}</section><section className="setting-card"><div className="setting-title"><span><AudioLines size={17} /> Глас / говор</span>{voice && <button className="remove" onClick={() => setVoice(null)}><X size={15} /></button>}</div>{voice ? <><div className="asset-row"><span className="asset-icon purple"><AudioLines size={17} /></span><span>{voice.name}</span></div><label className="range-label">Сила <b>{voiceVolume}%</b><input type="range" min="0" max="100" value={voiceVolume} onChange={(e) => setVoiceVolume(Number(e.target.value))} /></label></> : <button className="add-asset" onClick={() => importVoiceRef.current?.click()}><Plus size={17} /> Добави глас</button>}</section><section className="setting-card captions-card"><div className="setting-title"><span><Subtitles size={17} /> Субтитри</span><button className={`toggle ${captionsOn ? "on" : ""}`} onClick={() => setCaptionsOn(!captionsOn)} aria-label="Включи субтитри"><i /></button></div><textarea value={captions} onChange={(e) => setCaptions(e.target.value)} placeholder="По един ред за всеки субтитър" /><small>Всеки ред се сменя през 4 секунди.</small></section></div></aside></div>
      <section className="timeline-panel"><div className="timeline-tools"><button className="timeline-tool active"><Scissors size={16} /> Изрязване</button><button className="timeline-tool" onClick={() => importMusicRef.current?.click()}><Music2 size={16} /> Музика</button><button className="timeline-tool" onClick={() => setCaptionsOn(true)}><Subtitles size={16} /> Субтитри</button><span className="timeline-hint">Кликни върху линията, за да преместиш маркера</span></div><div className="ruler">{[0, .2, .4, .6, .8, 1].map((tick) => <span key={tick} style={{ left: `${tick * 100}%` }}>{timeLabel((duration || 25) * tick)}</span>)}</div><div className="track-area" onClick={(event) => { if (!video || !duration) return; const bounds = event.currentTarget.getBoundingClientRect(); seek(((event.clientX - bounds.left) / bounds.width) * duration); }}><div className="track-video"><FileVideo size={18} /><span>{video?.name || "Качи видео, за да започнеш"}</span></div>{video && <><div className="selection" style={{ left: `${(start / total) * 100}%`, width: `${selectionWidth}%` }}><i className="trim-handle left" /><i className="trim-handle right" /></div><div className="playhead" style={{ left: `${(current / total) * 100}%` }} /></>}</div><div className="audio-track"><Music2 size={16} /><span>{music?.name || "Добави фонова музика"}</span></div></section></section>
    {helpOpen && <div className="modal-backdrop" onClick={() => setHelpOpen(false)}><section className="help-modal" onClick={(e) => e.stopPropagation()}><button className="close-modal" onClick={() => setHelpOpen(false)}><X size={20} /></button><span className="modal-icon"><Sparkles size={22} /></span><h2>Редактирай с нормални думи</h2><p>Качваш видео, избираш силната част, настройваш темпото и добавяш аудио.</p><ol><li><b>Качи видео</b> — MP4, MOV или WebM.</li><li><b>Изрежи</b> — избери начало и край.</li><li><b>Добави музика и субтитри</b> — текстът остава четим.</li><li><b>Изнеси видео</b> — получаваш готов WebM файл.</li></ol><button className="export-button full" onClick={() => { setHelpOpen(false); importVideoRef.current?.click(); }}><Upload size={17} /> Качи видео</button></section></div>}
  </main>;
}

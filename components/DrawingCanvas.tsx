'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Brush, Download, Eraser, Eye, EyeOff, RotateCcw, Sparkles, Trash2, WandSparkles } from 'lucide-react';
import { ART_HEIGHT, ART_WIDTH, generateGeometry } from '@/lib/synthetic';
import type { LessonId, Point, Segment, Stroke } from '@/lib/types';

type Props = { lessonId: LessonId; seed: number; reviewing: boolean; onReview: (image: string, strokeCount: number) => void };
export type DrawingCanvasHandle = { capture: () => string | null };
const colors = ['#363b3a', '#ed7759', '#6d81bc', '#73a595'];

function drawSegment(ctx: CanvasRenderingContext2D, segment: Segment, color: string, width: number, dashed = false) {
  ctx.beginPath();
  ctx.setLineDash(dashed ? [8, 8] : []);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.moveTo(segment.from.x, segment.from.y);
  ctx.lineTo(segment.to.x, segment.to.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGuide(ctx: CanvasRenderingContext2D, guide: Segment[], vanishing: Point) {
  guide.forEach((segment, index) => drawSegment(ctx, segment, index === 0 ? '#c6aea0' : '#e1c5ae', index === 0 ? 1.5 : 1, true));
  ctx.beginPath(); ctx.arc(vanishing.x, vanishing.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#f47758'; ctx.fill();
  ctx.beginPath(); ctx.arc(vanishing.x, vanishing.y, 13, 0, Math.PI * 2);
  ctx.strokeStyle = '#f4775870'; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    ctx.save();
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color; ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    if (stroke.points.length === 1) {
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas({ lessonId, seed, reviewing, onReview }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [color, setColor] = useState(colors[0]);
  const [thickness, setThickness] = useState(3);
  const [eraser, setEraser] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const geometry = useMemo(() => generateGeometry(lessonId, seed), [lessonId, seed]);

  useEffect(() => { setStrokes([]); setActiveStroke(null); activeStrokeRef.current = null; drawingRef.current = false; }, [lessonId, seed]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(width / ART_WIDTH, 0, 0, height / ART_HEIGHT, 0, 0);
    drawStrokes(ctx, activeStroke ? [...strokes, activeStroke] : strokes);
  }, [strokes, activeStroke]);

  useEffect(() => {
    render();
    const observer = new ResizeObserver(render);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [render]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(ART_WIDTH, (event.clientX - rect.left) / rect.width * ART_WIDTH)),
      y: Math.max(0, Math.min(ART_HEIGHT, (event.clientY - rect.top) / rect.height * ART_HEIGHT))
    };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const next = { points: [getPoint(event)], color, width: eraser ? thickness * 8 : thickness, eraser };
    activeStrokeRef.current = next;
    setActiveStroke(next);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = getPoint(event);
    if (!activeStrokeRef.current) return;
    const next = { ...activeStrokeRef.current, points: [...activeStrokeRef.current.points, point] };
    activeStrokeRef.current = next;
    setActiveStroke(next);
  };
  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const finished = activeStrokeRef.current;
    activeStrokeRef.current = null;
    if (finished) setStrokes(all => [...all, finished]);
    setActiveStroke(null);
  };

  const capture = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = ART_WIDTH; exportCanvas.height = ART_HEIGHT;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#fffdf9'; ctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
    if (showGuide) drawGuide(ctx, geometry.guide, geometry.vanishing);
    const ink = document.createElement('canvas');
    ink.width = ART_WIDTH; ink.height = ART_HEIGHT;
    const inkCtx = ink.getContext('2d');
    if (inkCtx) { drawStrokes(inkCtx, strokes); ctx.drawImage(ink, 0, 0); }
    return exportCanvas.toDataURL('image/png');
  };
  useImperativeHandle(ref, () => ({ capture: () => strokes.length ? capture() : null }));
  const download = () => {
    const link = document.createElement('a');
    link.download = `corgikiki-${lessonId}-sketch.png`;
    link.href = capture(); link.click();
  };
  const review = () => { if (strokes.length && !reviewing) onReview(capture(), strokes.length); };

  return <div className="studio-card">
    <div className="canvas-toolbar">
      <div className="tool-group" aria-label="Drawing tools">
        <button className={`tool-button ${!eraser ? 'active' : ''}`} onClick={() => setEraser(false)} aria-label="Pen" title="Pen"><Brush size={17}/></button>
        <button className={`tool-button ${eraser ? 'active' : ''}`} onClick={() => setEraser(true)} aria-label="Eraser" title="Eraser"><Eraser size={17}/></button>
        <span className="toolbar-divider"/>
        <div className="color-options" aria-label="Pen color">
          {colors.map(option => <button key={option} className={`color-dot ${color === option && !eraser ? 'selected' : ''}`} style={{ backgroundColor: option }} aria-label={`Use ${option} pen`} onClick={() => {setColor(option); setEraser(false);}}/>)}
        </div>
        <span className="toolbar-divider"/>
        <label className="size-control"><span>Size</span><input type="range" min="1" max="12" value={thickness} onChange={event => setThickness(Number(event.target.value))} aria-label="Pen thickness"/><strong>{thickness}</strong></label>
      </div>
      <div className="tool-group right-tools">
        <button className="text-tool" onClick={() => setShowGuide(value => !value)} title="Toggle guides">{showGuide ? <Eye size={16}/> : <EyeOff size={16}/>}<span>Guides</span></button>
        <button className="tool-button" onClick={() => setStrokes(all => all.slice(0, -1))} disabled={!strokes.length} aria-label="Undo" title="Undo"><RotateCcw size={17}/></button>
        <button className="tool-button" onClick={() => setStrokes([])} disabled={!strokes.length} aria-label="Clear canvas" title="Clear canvas"><Trash2 size={17}/></button>
      </div>
    </div>
    <div className="canvas-shell">
      <div className="canvas-paper">
        {showGuide && <svg className="guide-overlay" viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          {geometry.guide.map((segment, index) => <line key={index} x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} stroke={index === 0 ? '#c6aea0' : '#e1c5ae'} strokeWidth={index === 0 ? 1.5 : 1} strokeDasharray="8 8"/>)}
          <circle cx={geometry.vanishing.x} cy={geometry.vanishing.y} r="13" fill="none" stroke="#f4775870" strokeWidth="1.5"/>
          <circle cx={geometry.vanishing.x} cy={geometry.vanishing.y} r="7" fill="#f47758"/>
        </svg>}
        <canvas ref={canvasRef} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} className="drawing-canvas" aria-label="Interactive architectural drawing canvas"/>
        <span className="paper-corner top-left">YOUR SKETCH</span>
        <span className="paper-corner bottom-right">CORGIKIKI STUDIO · {lessonId.toUpperCase()}</span>
      </div>
    </div>
    <div className="canvas-footer">
      <div className="canvas-tip"><WandSparkles size={17}/><span>Tip: trace the light guides, then make the final edges your own.</span></div>
      <div className="canvas-actions">
        <button className="subtle-button sample-button" onClick={() => { setStrokes(geometry.sample); setEraser(false); }}><Sparkles size={16}/> Load Sample Drawing</button>
        <button className="subtle-button" onClick={download}><Download size={16}/> Export PNG</button>
      </div>
    </div>
    <button className="review-button" onClick={review} disabled={!strokes.length || reviewing} title={!strokes.length ? 'Draw a few lines or load the sample first' : undefined}><Sparkles size={18}/> {reviewing ? 'Kiki is reviewing your sketch…' : 'Ask Kiki to Review My Sketch'} <span>↗</span></button>
  </div>;
});

export default DrawingCanvas;

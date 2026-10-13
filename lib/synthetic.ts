import type { Geometry, LessonId, Point, Segment, Stroke } from './types';

export const ART_WIDTH = 1000;
export const ART_HEIGHT = 620;

function random(seed: number) {
  let value = seed >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const p = (x: number, y: number): Point => ({ x, y });
const line = (x1: number, y1: number, x2: number, y2: number, kind: Segment['kind'] = 'solid'): Segment => ({ from: p(x1, y1), to: p(x2, y2), kind });
function rectangle(x1: number, y1: number, x2: number, y2: number, kind: Segment['kind'] = 'solid') {
  return [line(x1,y1,x2,y1,kind), line(x2,y1,x2,y2,kind), line(x2,y2,x1,y2,kind), line(x1,y2,x1,y1,kind)];
}

function imperfectSample(reference: Segment[], seed: number): Stroke[] {
  const jitter = random(seed + 991);
  return reference.map((segment, index) => {
    const points: Point[] = [];
    const dx = segment.to.x - segment.from.x;
    const dy = segment.to.y - segment.from.y;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const wiggle = (jitter() - .5) * (index % 4 === 0 ? 12 : 5);
      // One receding edge aims visibly away from the true vanishing point.
      points.push(p(segment.from.x + dx*t + wiggle, segment.from.y + dy*t + (jitter()-.5)*6 + (index === 4 ? 46*t : 0)));
    }
    return { points, color: '#3c3936', width: 2.5 };
  });
}

export function generateGeometry(lesson: LessonId, seed: number): Geometry {
  const rng = random(seed + (lesson === 'cube' ? 11 : lesson === 'room' ? 27 : 43));
  const vx = Math.round(465 + rng() * 105);
  const horizonY = Math.round(235 + rng() * 52);
  const vanishing = p(vx, horizonY);
  let guide: Segment[] = [line(50, horizonY, 950, horizonY, 'guide')];
  let reference: Segment[] = [];

  if (lesson === 'cube') {
    const left = Math.round(275 + rng() * 45);
    const top = Math.round(330 + rng() * 35);
    const size = Math.round(155 + rng() * 25);
    const right = left + size;
    const bottom = top + size;
    const depth = .32 + rng() * .08;
    const backLeft = left + (vx-left)*depth;
    const backTop = top + (horizonY-top)*depth;
    const backRight = right + (vx-right)*depth;
    const backBottom = bottom + (horizonY-bottom)*depth;
    guide.push(...[p(left,top),p(right,top),p(right,bottom),p(left,bottom)].map(c => line(c.x,c.y,vx,horizonY,'guide')));
    reference = [
      ...rectangle(left,top,right,bottom),
      line(left,top,backLeft,backTop), line(right,top,backRight,backTop),
      line(right,bottom,backRight,backBottom),
      line(backLeft,backTop,backRight,backTop), line(backRight,backTop,backRight,backBottom)
    ];
  } else if (lesson === 'room') {
    const halfW = Math.round(125 + rng()*35);
    const halfH = Math.round(88 + rng()*25);
    const l = vx-halfW, r = vx+halfW, t = horizonY-halfH, b = horizonY+halfH;
    guide.push(...[p(l,t),p(r,t),p(l,b),p(r,b)].map(c=>line(c.x,c.y,vx,horizonY,'guide')));
    reference = [
      ...rectangle(l,t,r,b), line(75,45,l,t),line(925,45,r,t),
      line(75,575,l,b),line(925,575,r,b),
      line(l+25,b,l+25,horizonY+15,'detail'),line(l+25,horizonY+15,l+90,horizonY+15,'detail'),
      line(l+90,horizonY+15,l+90,b,'detail')
    ];
  } else {
    const nearL = 160, nearR = 840, farL = vx-80, farR = vx+80;
    const nearT = 85, nearB = 555, farT = horizonY-65, farB = horizonY+65;
    guide.push(...[p(nearL,nearT),p(nearR,nearT),p(nearL,nearB),p(nearR,nearB)].map(c=>line(c.x,c.y,vx,horizonY,'guide')));
    reference = [
      line(nearL,nearT,farL,farT),line(nearR,nearT,farR,farT),
      line(nearL,nearB,farL,farB),line(nearR,nearB,farR,farB),
      ...rectangle(farL,farT,farR,farB)
    ];
    for (const t of [.25,.52,.77]) {
      const left = nearL+(farL-nearL)*t;
      const right = nearR+(farR-nearR)*t;
      const top = nearT+(farT-nearT)*t;
      const bottom = nearB+(farB-nearB)*t;
      reference.push(line(left,top,left,bottom,'detail'),line(right,top,right,bottom,'detail'));
      reference.push(line(left,top,left+40*(1-t),top+10,'detail'),line(right,top,right-40*(1-t),top+10,'detail'));
    }
  }
  return { horizonY, vanishing, guide, reference, sample: imperfectSample(reference, seed) };
}

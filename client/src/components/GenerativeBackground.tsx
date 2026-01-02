
import React, { useRef, useEffect } from 'react';
import { Alea } from './alea'; // A simple, seedable random number generator

// A simple 2D simplex noise function
// This is a simplified version to avoid adding a new library.
function createNoise2D() {
  const alea = Alea('seed');
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 0; i < 256; i++) {
    const j = alea() * (256 - i) + i | 0;
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }

  const grad = [
    [1,1], [-1,1], [1,-1], [-1,-1],
    [1,0], [-1,0], [0,1], [0,-1]
  ];

  function dot(g: number[], x: number, y: number) {
    return g[0]*x + g[1]*y;
  }

  return function(x: number, y: number) {
    const p = new Uint8Array(512);
    for(let i=0; i < 256; i++) p[i] = p[i+256] = perm[i];

    let xf = x - Math.floor(x);
    let yf = y - Math.floor(y);
    let X = Math.floor(x) & 255;
    let Y = Math.floor(y) & 255;

    let g00 = grad[p[X + p[Y]] & 7];
    let g10 = grad[p[X+1 + p[Y]] & 7];
    let g01 = grad[p[X + p[Y+1]] & 7];
    let g11 = grad[p[X+1 + p[Y+1]] & 7];

    let n00 = dot(g00, xf, yf);
    let n10 = dot(g10, xf-1, yf);
    let n01 = dot(g01, xf, yf-1);
    let n11 = dot(g11, xf-1, yf-1);

    let u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    let v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    let nx0 = n00 + u * (n10 - n00);
    let nx1 = n01 + u * (n11 - n01);

    return nx0 + v * (nx1 - nx0);
  };
}

const GenerativeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise = createNoise2D();
    let time = 0;
    const scale = 0.003;
    const speed = 0.0005;
    let frameId: number;

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();

    function resizeCanvas() {
      const { devicePixelRatio = 1 } = window;
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    function animate() {
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let x = 0; x < width; x+=2) {
        for (let y = 0; y < height; y+=2) {
          const n = noise(x * scale, y * scale + time);
          // Create a more vein-like appearance
          const intensity = Math.pow(Math.abs(n), 1.8);
          
          if (intensity > 0.3) {
            const alpha = (intensity - 0.3) * 255 * 0.3; // Low opacity
            const color = `hsl(${primaryColor})`;
            const r = parseInt(color.slice(1,3), 16);
            const g = parseInt(color.slice(3,5), 16);
            const b = parseInt(color.slice(5,7), 16);

            const index = (y * width + x) * 4;
            data[index] = r; 
            data[index+1] = g; 
            data[index+2] = b;
            data[index+3] = alpha; 
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      time += speed;
      frameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.1, // A subtle presence
        filter: 'blur(1px)', // Soften the effect
      }}
    />
  );
};

export default GenerativeBackground;

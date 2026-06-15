import React, { useRef, useEffect } from 'react';

// Types for component props
interface HeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: React.ReactNode;
  financialMetrics?: {
    label: string;
    sublabel: string;
  }[];
  buttons?: {
    primary?: {
      text: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
    };
  };
  className?: string;
}

// Reusable Shader Background Hook
const useShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const pointersRef = useRef<PointerHandler | null>(null);

  // WebGL Renderer class
  class WebGLRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram | null = null;
    private vs: WebGLShader | null = null;
    private fs: WebGLShader | null = null;
    private buffer: WebGLBuffer | null = null;
    private shaderSource: string;
    private mouseMove = [0, 0];
    private mouseCoords = [0, 0];
    private pointerCoords = [0, 0];
    private nbrOfPointers = 0;

    private vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

    private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

    constructor(canvas: HTMLCanvasElement, scale: number) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2')!;
      this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
      this.shaderSource = defaultShaderSource;
    }

    updateShader(source: string) {
      this.reset();
      this.shaderSource = source;
      this.setup();
      this.init();
    }

    updateMove(deltas: number[]) {
      this.mouseMove = deltas;
    }

    updateMouse(coords: number[]) {
      this.mouseCoords = coords;
    }

    updatePointerCoords(coords: number[]) {
      this.pointerCoords = coords;
    }

    updatePointerCount(nbr: number) {
      this.nbrOfPointers = nbr;
    }

    updateScale(scale: number) {
      this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
    }

    compile(shader: WebGLShader, source: string) {
      const gl = this.gl;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error('Shader compilation error:', error);
      }
    }

    test(source: string) {
      let result = null;
      const gl = this.gl;
      const shader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        result = gl.getShaderInfoLog(shader);
      }
      gl.deleteShader(shader);
      return result;
    }

    reset() {
      const gl = this.gl;
      if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
        if (this.vs) {
          gl.detachShader(this.program, this.vs);
          gl.deleteShader(this.vs);
        }
        if (this.fs) {
          gl.detachShader(this.program, this.fs);
          gl.deleteShader(this.fs);
        }
        gl.deleteProgram(this.program);
      }
    }

    setup() {
      const gl = this.gl;
      this.vs = gl.createShader(gl.VERTEX_SHADER)!;
      this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      this.compile(this.vs, this.vertexSrc);
      this.compile(this.fs, this.shaderSource);
      this.program = gl.createProgram()!;
      gl.attachShader(this.program, this.vs);
      gl.attachShader(this.program, this.fs);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(this.program));
      }
    }

    init() {
      const gl = this.gl;
      const program = this.program!;
      
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      (program as any).resolution = gl.getUniformLocation(program, 'resolution');
      (program as any).time = gl.getUniformLocation(program, 'time');
      (program as any).move = gl.getUniformLocation(program, 'move');
      (program as any).touch = gl.getUniformLocation(program, 'touch');
      (program as any).pointerCount = gl.getUniformLocation(program, 'pointerCount');
      (program as any).pointers = gl.getUniformLocation(program, 'pointers');
    }

    render(now = 0) {
      const gl = this.gl;
      const program = this.program;
      
      if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      
      gl.uniform2f((program as any).resolution, this.canvas.width, this.canvas.height);
      gl.uniform1f((program as any).time, now * 1e-3);
      gl.uniform2f((program as any).move, this.mouseMove[0], this.mouseMove[1]);
      gl.uniform2f((program as any).touch, this.mouseCoords[0], this.mouseCoords[1]);
      gl.uniform1i((program as any).pointerCount, this.nbrOfPointers);
      gl.uniform2fv((program as any).pointers, this.pointerCoords);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  // Pointer Handler class
  class PointerHandler {
    private scale: number;
    private active = false;
    private pointers = new Map<number, number[]>();
    private lastCoords = [0, 0];
    private moves = [0, 0];

    constructor(element: HTMLCanvasElement, scale: number) {
      this.scale = scale;
      
      const map = (element: HTMLCanvasElement, scale: number, x: number, y: number) => 
        [x * scale, element.height - y * scale];

      element.addEventListener('pointerdown', (e) => {
        this.active = true;
        this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
      });

      element.addEventListener('pointerup', (e) => {
        if (this.count === 1) {
          this.lastCoords = this.first;
        }
        this.pointers.delete(e.pointerId);
        this.active = this.pointers.size > 0;
      });

      element.addEventListener('pointerleave', (e) => {
        if (this.count === 1) {
          this.lastCoords = this.first;
        }
        this.pointers.delete(e.pointerId);
        this.active = this.pointers.size > 0;
      });

      element.addEventListener('pointermove', (e) => {
        if (!this.active) return;
        this.lastCoords = [e.clientX, e.clientY];
        this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
        this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
      });
    }

    getScale() {
      return this.scale;
    }

    updateScale(scale: number) {
      this.scale = scale;
    }

    get count() {
      return this.pointers.size;
    }

    get move() {
      return this.moves;
    }

    get coords() {
      return this.pointers.size > 0 
        ? Array.from(this.pointers.values()).flat() 
        : [0, 0];
    }

    get first() {
      return this.pointers.values().next().value || this.lastCoords;
    }
  }

  const resize = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    if (rendererRef.current) {
      rendererRef.current.updateScale(dpr);
    }
  };

  const loop = (now: number) => {
    if (!rendererRef.current || !pointersRef.current) return;
    
    rendererRef.current.updateMouse(pointersRef.current.first);
    rendererRef.current.updatePointerCount(pointersRef.current.count);
    rendererRef.current.updatePointerCoords(pointersRef.current.coords);
    rendererRef.current.updateMove(pointersRef.current.move);
    rendererRef.current.render(now);
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    
    rendererRef.current = new WebGLRenderer(canvas, dpr);
    pointersRef.current = new PointerHandler(canvas, dpr);
    
    rendererRef.current.setup();
    rendererRef.current.init();
    
    resize();
    
    if (rendererRef.current.test(defaultShaderSource) === null) {
      rendererRef.current.updateShader(defaultShaderSource);
    }
    
    loop(0);
    
    window.addEventListener('resize', resize);
    
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.reset();
      }
    };
  }, []);

  return canvasRef;
};

// Reusable Hero Component
const Hero: React.FC<HeroProps> = ({
  trustBadge,
  headline,
  subtitle,
  financialMetrics,
  buttons,
  className = ""
}) => {
  const canvasRef = useShaderBackground();

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>
      <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        
        @keyframes logo-glow {
          0%, 100% {
            filter: drop-shadow(0 0 1px rgba(142, 192, 244, 0.4)) drop-shadow(0 0 3px rgba(43, 130, 201, 0.2));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(142, 192, 244, 0.8)) drop-shadow(0 0 16px rgba(43, 130, 201, 0.4));
            transform: scale(1.03);
          }
        }
        
        .animate-logo-glow {
          animation: logo-glow 5s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover touch-none"
        style={{ background: 'black' }}
      />
      
      {/* Mini Navbar with Griska Branding */}
      <header className="absolute top-0 left-0 right-0 z-20 w-full px-12 py-8 flex items-center justify-between">
        <div className="flex items-center gap-5 select-none cursor-pointer group transition-all duration-300">
          <svg viewBox="0 0 24 24" className="w-16 h-16 animate-logo-glow group-hover:scale-110 transition-all duration-300" fill="none">
            {/* Upper leg: Light Blue */}
            <path d="M 2 12 L 14 0 L 22 0 L 10 12 Z" fill="#8ec0f4" />
            {/* Lower-left leg: Medium Blue */}
            <path d="M 2 12 L 6 12 L 18 24 L 14 24 Z" fill="#2b82c9" />
            {/* Lower-right leg: Dark Blue */}
            <path d="M 6 12 L 10 12 L 22 24 L 18 24 Z" fill="#0f62ac" />
          </svg>
          <span className="text-5xl font-black tracking-tight text-white font-sans lowercase flex items-start group-hover:text-sky-300 transition-colors duration-300">
            griska<span className="text-[18px] font-normal align-super ml-0.5 mt-0.5 text-zinc-400 group-hover:text-sky-400">®</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 md:gap-8 text-sm font-semibold tracking-wider text-zinc-400">
          <a href="#services" className="hover:text-sky-300 transition-colors duration-200">Services</a>
          <a href="#network" className="hover:text-sky-300 transition-colors duration-200">Network</a>
          <a href="#solutions" className="hover:text-sky-300 transition-colors duration-200">Solutions</a>
          <a href="#contact" className="hover:text-sky-300 transition-colors duration-200">Contact</a>
        </nav>
      </header>
      
      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-44 pb-12 text-white">
        {/* Trust Badge */}
        {trustBadge && (
          <div className="mb-12 animate-fade-in-down">
            <div className="flex items-center gap-3 px-7 py-2.5 bg-black/60 backdrop-blur-xl border border-teal-500/30 hover:border-teal-500/50 hover:scale-[1.02] transition-all duration-300 rounded-full text-sm md:text-base lg:text-lg font-bold tracking-wide text-zinc-100 shadow-xl shadow-teal-950/30 cursor-default">
              <svg className="w-5 h-5 text-teal-400 animate-pulse flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              <span>{trustBadge.text}</span>
            </div>
          </div>
        )}

        <div className="text-center space-y-10 max-w-6xl mx-auto px-4">
          {/* Main Heading with Animation */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-zinc-200 to-teal-200 bg-clip-text text-transparent animate-fade-in-up animation-delay-200 leading-[1.05]">
              {headline.line1}
            </h1>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter bg-gradient-to-r from-teal-300 via-cyan-400 to-sky-400 bg-clip-text text-transparent animate-fade-in-up animation-delay-400 leading-[1.05]">
              {headline.line2}
            </h1>
          </div>
          
          {/* Financial Metrics Panel */}
          {financialMetrics && (
            <div className="inline-flex flex-wrap justify-center items-center gap-6 md:gap-10 px-10 py-6 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-2xl mx-auto select-none animate-fade-in-up animation-delay-500 shadow-2xl shadow-cyan-950/5">
              {financialMetrics.map((metric, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <div className="hidden sm:block h-12 w-px bg-zinc-800/80" />
                  )}
                  <div className="flex flex-col px-4 group/metric cursor-pointer">
                    <span className="text-3xl md:text-4xl font-black text-teal-400 group-hover/metric:text-cyan-300 transition-colors duration-300 tracking-wider">
                      {metric.label}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 group-hover/metric:text-zinc-400 transition-colors duration-300 uppercase mt-2 font-mono">
                      {metric.sublabel}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
          
          {/* Subtitle with Animation */}
          <div className="max-w-5xl mx-auto animate-fade-in-up animation-delay-600">
            <p className="text-xl md:text-2xl lg:text-3xl text-sky-100/90 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>
          
          {/* CTA Buttons with Animation */}
          {buttons && (
            <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12 animate-fade-in-up animation-delay-800">
              {buttons.primary && (
                <button 
                  onClick={buttons.primary.onClick}
                  className="px-10 py-5 bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-teal-500/25 cursor-pointer"
                >
                  {buttons.primary.text}
                </button>
              )}
              {buttons.secondary && (
                <button 
                  onClick={buttons.secondary.onClick}
                  className="px-10 py-5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-300/30 hover:border-sky-300/50 text-sky-100 rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer"
                >
                  {buttons.secondary.text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const defaultShaderSource = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*
*	To explore strange new worlds, to seek out new life
*	and new civilizations, to boldly go where no man has
*	gone before.
*/
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 move;
uniform vec2 touch;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
// Returns a pseudo random number for a given point (white noise)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
// Returns a pseudo random number for a given point (value noise)
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float
  a=rnd(i),
  b=rnd(i+vec2(1,0)),
  c=rnd(i+vec2(0,1)),
  d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
// Returns a pseudo random number for a given point (fractal noise)
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}
float clouds(vec2 p) {
	float d=1., t=.0;
	for (float i=.0; i<3.; i++) {
		float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
		t=mix(t,d,a);
		d=a;
		p*=2./(i+1.);
	}
	return t;
}
void main(void) {
	vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
	vec3 col=vec3(0);
	float bg=clouds(vec2(st.x+T*.5 + move.x*0.0008, -st.y - move.y*0.0008));
	uv*=1.-.3*(sin(T*.2)*.5+.5);
	vec3 bg_color = mix(vec3(0.01, 0.04, 0.15), vec3(0.04, 0.16, 0.32), uv.y * 0.5 + 0.5);
	for (float i=1.; i<12.; i++) {
		uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
		vec2 p=uv + move*0.00015 * (1.0 + i*0.05);
		float d=length(p);
		col+=.00125/d*(cos(sin(i)*vec3(1.0, 1.5, 2.0) + vec3(2.2, 0.5, 0.0))+1.);
		float b=noise(i+p+bg*1.731);
		col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
		col=mix(col, bg_color * bg, clamp(d, 0.0, 1.0));
	}
	O=vec4(col,1);
}`;

export default Hero;

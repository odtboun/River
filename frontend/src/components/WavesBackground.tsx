import { useEffect, useRef } from 'react';

export function WavesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Configuration
        const PARTICLE_COUNT = 100;
        const WAVE_AMPLITUDE = 80;
        const WAVE_FREQUENCY = 0.003;
        const COLOR = 'rgba(59, 130, 246, 0.6)'; // Blue-500

        // Particles
        const particles: Array<{ x: number, y: number, size: number, speed: number, offset: number }> = [];

        const initParticles = () => {
            particles.length = 0;
            // Focus particles in the vertical center band
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: height / 2 + (Math.random() - 0.5) * 200,
                    size: Math.random() * 2 + 1,
                    speed: Math.random() * 0.5 + 0.2, // Move horizontally
                    offset: Math.random() * Math.PI * 2 // Random starting phase
                });
            }
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        };

        const render = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                // Horizontal movement
                p.x += p.speed;
                if (p.x > width) p.x = 0;

                // Vertical wave motion
                // y = baseY + amplitude * sin(freq * x + time + offset)
                const waveY = Math.sin(p.x * WAVE_FREQUENCY + time * 0.001 + p.offset) * WAVE_AMPLITUDE;

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y + waveY, p.size, 0, Math.PI * 2);
                ctx.fillStyle = COLOR;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame((t) => render(t));
        };

        // Initialize
        window.addEventListener('resize', handleResize);
        handleResize(); // Sets width/height
        render(0);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0, // Behind content
                opacity: 0.8
            }}
        />
    );
}

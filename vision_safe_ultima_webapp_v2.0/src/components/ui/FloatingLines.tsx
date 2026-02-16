import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface FloatingLinesProps {
    /** Array - specify line count per wave; Number - same count for all waves */
    lineCount?: number | number[];
    /** Array - specify line distance per wave; Number - same distance for all waves */
    lineDistance?: number | number[];
    /** Array - specify visibility for each wave ["top", "middle", "bottom"] */
    enabledWaves?: string[];
    /** Colors for the lines */
    colors?: string[];
    /** Radius of the bend effect */
    bendRadius?: number;
    /** Strength of the bend effect */
    bendStrength?: number;
    /** Whether the lines are interactive */
    interactive?: boolean;
    /** Whether parallax effect is enabled */
    parallax?: boolean;
}

const FloatingLines = ({
    lineCount = 5,
    lineDistance = 5,
    enabledWaves = ["top", "middle", "bottom"],
    colors = ["#6366f1", "#a855f7", "#ec4899"], // Default to primary/accent gradients
    bendRadius = 200,
    bendStrength = 200, // Adjusted default for visible effect
    interactive = true,
    parallax = true
}: FloatingLinesProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetMouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        // Use a lighter fog or no fog to ensure lines are visible against diverse backgrounds
        // scene.fog = new THREE.FogExp2(0x000000, 0.001);

        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Lines setup
        const lines: THREE.Line[] = [];
        const originalPositions: Float32Array[] = [];

        // Helper to normalize props that can be number or array
        const getVal = (prop: number | number[], index: number) =>
            Array.isArray(prop) ? prop[index] || prop[0] : prop;

        // Wave definitions (approximate positions)
        const waves = [
            { id: "top", y: 15, z: -10 },
            { id: "middle", y: 0, z: 0 },
            { id: "bottom", y: -15, z: 10 }
        ];

        waves.forEach((wave, waveIndex) => {
            if (!enabledWaves.includes(wave.id)) return;

            const count = getVal(lineCount, waveIndex);
            const dist = getVal(lineDistance, waveIndex);
            const color = colors[waveIndex % colors.length];

            for (let i = 0; i < count; i++) {
                // Create a line with many segments for smooth bending
                const segmentCount = 100;
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(segmentCount * 3);

                // Initial positions - horizontal lines
                const yOffset = (i - count / 2) * dist + wave.y;
                const width = 200; // Wide enough to cover screen

                for (let j = 0; j < segmentCount; j++) {
                    const x = (j / (segmentCount - 1)) * width - width / 2;
                    positions[j * 3] = x;
                    positions[j * 3 + 1] = yOffset;
                    positions[j * 3 + 2] = wave.z;
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

                // Store original positions for restoration force
                originalPositions.push(positions.slice());

                const material = new THREE.LineBasicMaterial({
                    color: new THREE.Color(color),
                    transparent: true,
                    opacity: 0.6,
                    linewidth: 2 // Note: WebGL implementation of linewidth is limited in many browsers
                });

                const line = new THREE.Line(geometry, material);
                lines.push(line);
                scene.add(line);
            }
        });

        // Interaction vars
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            // Normalize mouse (-1 to 1) for raycasting/parallax
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            targetMouseRef.current = { x, y };
        };

        if (interactive) {
            window.addEventListener('mousemove', onMouseMove);
        }

        // Animation Loop
        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

            // Smooth mouse movement
            mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.1;
            mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.1;

            // Parallax
            if (parallax) {
                camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.05;
                camera.position.y += (mouseRef.current.y * 2 - camera.position.y) * 0.05;
                camera.lookAt(0, 0, 0);
            }

            // Line interaction
            if (interactive) {
                // Project mouse to 3D world at z=0 (approximate interaction plane)
                raycaster.setFromCamera(new THREE.Vector2(mouseRef.current.x, mouseRef.current.y), camera);
                const intersectPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, intersectPoint);

                if (intersectPoint) {
                    lines.forEach((line, lineIndex) => {
                        const positions = line.geometry.attributes.position.array as Float32Array;
                        const original = originalPositions[lineIndex];

                        for (let i = 0; i < positions.length; i += 3) {
                            const x = positions[i];
                            const y = positions[i + 1];
                            // z is usually constant per line, but we can read it
                            const z = positions[i + 2];

                            // Calculate distance to mouse point in X-Y plane (ignoring Z for simpler 2D-like interaction feel)
                            const dx = x - intersectPoint.x;
                            const dy = y - intersectPoint.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < bendRadius) {
                                // Calculate displacement force
                                // Force is max at center, 0 at radius
                                const force = (1 - dist / bendRadius) * bendStrength;

                                // Displace away from mouse
                                // Normalize direction
                                const angle = Math.atan2(dy, dx);

                                // Target position
                                const tx = original[i] + Math.cos(angle) * force * 0.1; // Scale down for smoother effect
                                const ty = original[i + 1] + Math.sin(angle) * force * 0.1;

                                // Lerp towards target
                                positions[i] += (tx - x) * 0.1;
                                positions[i + 1] += (ty - y) * 0.1;
                            } else {
                                // Restore to original position
                                positions[i] += (original[i] - x) * 0.05;
                                positions[i + 1] += (original[i + 1] - y) * 0.05;
                            }
                        }
                        line.geometry.attributes.position.needsUpdate = true;
                    });
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (interactive) {
                window.removeEventListener('mousemove', onMouseMove);
            }
            cancelAnimationFrame(frameId);
            container.removeChild(renderer.domElement);
            // Dipose resources
            renderer.dispose();
            lines.forEach(line => {
                line.geometry.dispose();
                (line.material as THREE.Material).dispose();
            });
        };
    }, [lineCount, lineDistance, enabledWaves, colors, bendRadius, bendStrength, interactive, parallax]);

    return <div ref={containerRef} className="absolute inset-0 w-full h-full -z-10" />;
};

export default FloatingLines;

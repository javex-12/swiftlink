"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeDBackground({ type, accentColor }: { type: number, accentColor: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const initialWidth = containerRef.current.clientWidth || 800;
        const initialHeight = containerRef.current.clientHeight || 550;
        const camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initialWidth, initialHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        let animationFrameId: number;
        let objects: any[] = [];
        const color = new THREE.Color(accentColor);

        // Lighting (used by most scenes)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Variables for animation
        let time = 0;
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX - window.innerWidth / 2) / 100;
            mouseY = (e.clientY - window.innerHeight / 2) / 100;
        };
        window.addEventListener('mousemove', onMouseMove);

        // ---------------------------------------------------------
        // SCENE GENERATORS (1 to 10)
        // ---------------------------------------------------------
        if (type === 1) {
            // Type 1: LIQUID CHROME ORBITAL RINGS
            // Three large tori at different orbital planes, slowly rotating around each other
            const ringMat = new THREE.MeshPhysicalMaterial({
                color,
                metalness: 1.0,
                roughness: 0.05,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                emissive: color.clone().multiplyScalar(0.15),
                transparent: true,
                opacity: 0.92,
            });
            const group = new THREE.Group();
            const ringConfigs = [
                { r: 2.2, tube: 0.08, rx: 0, ry: 0, rz: 0, sr: 0.18, sp: 0.10 },
                { r: 2.2, tube: 0.08, rx: Math.PI/2, ry: 0.4, rz: 0, sr: -0.12, sp: 0.07 },
                { r: 2.2, tube: 0.08, rx: Math.PI/3, ry: Math.PI/3, rz: 0.6, sr: 0.08, sp: -0.05 },
            ];
            ringConfigs.forEach(({ r, tube, rx, ry, rz, sr, sp }) => {
                const geo = new THREE.TorusGeometry(r, tube, 64, 200);
                const mesh = new THREE.Mesh(geo, ringMat);
                mesh.rotation.set(rx, ry, rz);
                group.add(mesh);
                objects.push({
                    update: (t: number) => {
                        mesh.rotation.x += sr * 0.01;
                        mesh.rotation.y += sp * 0.01;
                    }
                });
            });
            // Central glowing orb
            const coreGeo = new THREE.IcosahedronGeometry(0.35, 5);
            const coreMat = new THREE.MeshPhysicalMaterial({
                color,
                emissive: color.clone().multiplyScalar(0.8),
                metalness: 0.0,
                roughness: 0.0,
                transparent: true,
                opacity: 0.95,
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            group.add(core);
            // Surrounding particle disc
            const particleGeo = new THREE.BufferGeometry();
            const particleCount = 400;
            const pPos = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 1.5 + Math.random() * 1.5;
                pPos[i * 3] = Math.cos(angle) * radius;
                pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
                pPos[i * 3 + 2] = Math.sin(angle) * radius;
            }
            particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            const particleMat = new THREE.PointsMaterial({
                color,
                size: 0.03,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const particles = new THREE.Points(particleGeo, particleMat);
            group.add(particles);
            objects.push({ update: (t: number) => {
                group.rotation.y = t * 0.08;
                particles.rotation.y = -t * 0.04;
                core.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
            }});
            scene.add(group);
            // Extra point light from the core
            const coreLight = new THREE.PointLight(color, 2.5, 8);
            coreLight.position.set(0, 0, 0);
            scene.add(coreLight);
            camera.position.z = 6;
        } 
        else if (type === 2) {
            // Type 2: Cyber Grid Floor
            const grid = new THREE.GridHelper(40, 40, color, new THREE.Color(0x222222));
            grid.position.y = -2;
            grid.material.transparent = true;
            grid.material.opacity = 0.5;
            scene.add(grid);
            objects.push({ update: (t: number) => { grid.position.z = (t * 2) % 1; } });
        }
        else if (type === 3) {
            // Type 3: Floating Cinematic Shards
            const geo = new THREE.TetrahedronGeometry(1);
            const mat = new THREE.MeshPhysicalMaterial({ 
                color, 
                transparent: true, 
                opacity: 0.6, 
                metalness: 0.5, 
                roughness: 0, 
                transmission: 0.5, 
                thickness: 2 
            });
            for(let i=0; i<40; i++) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20);
                mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
                const scale = 0.2 + Math.random() * 0.8;
                mesh.scale.setScalar(scale);
                scene.add(mesh);
                mesh.userData = { 
                    rx: (Math.random()-0.5)*0.01, 
                    ry: (Math.random()-0.5)*0.01,
                    py: Math.random() * Math.PI * 2
                };
                objects.push({
                    update: (t: number) => { 
                        mesh.rotation.x += mesh.userData.rx; 
                        mesh.rotation.y += mesh.userData.ry; 
                        mesh.position.y += Math.sin(t + mesh.userData.py) * 0.005;
                    }
                });
            }
        }
        else if (type === 4) {
            // Type 4: LIVING STAR — morphing blob with glowing particle aura
            camera.position.z = 5.5;

            // Inner morphing blob — high subdivision for smooth deformation
            const geometry = new THREE.IcosahedronGeometry(1.6, 7);
            const material = new THREE.MeshPhysicalMaterial({
                color,
                metalness: 0.3,
                roughness: 0.05,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                emissive: color.clone().multiplyScalar(0.35),
                transparent: true,
                opacity: 0.92,
            });
            const blob = new THREE.Mesh(geometry, material);
            scene.add(blob);

            const posAttr = geometry.getAttribute('position');
            const origPos = new Float32Array(posAttr.array);

            // Outer wireframe shell — thin translucent skin
            const shellGeo = new THREE.IcosahedronGeometry(1.85, 4);
            const shellMat = new THREE.MeshBasicMaterial({
                color,
                wireframe: true,
                transparent: true,
                opacity: 0.08,
            });
            const shell = new THREE.Mesh(shellGeo, shellMat);
            scene.add(shell);

            // Glow particle cloud — 800 additive-blend points around blob
            const auraGeo = new THREE.BufferGeometry();
            const auraCount = 800;
            const auraPos = new Float32Array(auraCount * 3);
            for (let i = 0; i < auraCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 2.0 + Math.random() * 1.2;
                auraPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
                auraPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                auraPos[i * 3 + 2] = r * Math.cos(phi);
            }
            auraGeo.setAttribute('position', new THREE.BufferAttribute(auraPos, 3));
            const auraMat = new THREE.PointsMaterial({
                color,
                size: 0.025,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const aura = new THREE.Points(auraGeo, auraMat);
            scene.add(aura);

            // Dynamic point light that pulses
            const blobLight = new THREE.PointLight(color, 3.5, 10);
            scene.add(blobLight);

            objects.push({
                update: (t: number) => {
                    blob.rotation.y += 0.006;
                    blob.rotation.x += 0.002;
                    aura.rotation.y -= 0.003;
                    aura.rotation.x += 0.001;
                    shell.rotation.y += 0.003;
                    shell.rotation.z -= 0.001;

                    // Blob morphing — layered sine waves
                    const positions = geometry.attributes.position.array as Float32Array;
                    for (let i = 0; i < positions.length; i += 3) {
                        const ox = origPos[i], oy = origPos[i+1], oz = origPos[i+2];
                        const n1 = Math.sin(ox * 2.1 + t * 0.9) * Math.cos(oy * 1.8 + t * 0.7) * Math.sin(oz * 2.0 + t * 0.8);
                        const n2 = Math.sin(ox * 3.5 + t * 1.3) * Math.cos(oz * 3.5 + t * 1.1) * 0.5;
                        const factor = 1 + (n1 * 0.18 + n2 * 0.08);
                        positions[i]     = ox * factor;
                        positions[i + 1] = oy * factor;
                        positions[i + 2] = oz * factor;
                    }
                    geometry.attributes.position.needsUpdate = true;
                    geometry.computeVertexNormals();

                    // Pulsing light
                    blobLight.intensity = 3.0 + Math.sin(t * 2.5) * 1.2;
                }
            });
        }
        else if (type === 5) {
            // Type 5: Particle Universe
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(2000 * 3);
            for(let i=0; i<6000; i++) pos[i] = (Math.random() - 0.5) * 15;
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color, size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
            const points = new THREE.Points(geo, mat);
            scene.add(points);
            objects.push({ update: () => { points.rotation.y += 0.001; points.rotation.x += 0.0005; }});
        }
        else if (type === 6) {
            // Type 6: Floating Aurora Rings
            const group = new THREE.Group();
            const ringGeo = new THREE.TorusGeometry(3, 0.02, 16, 100);
            for(let i=0; i<8; i++) {
                const ringMat = new THREE.MeshBasicMaterial({ 
                    color, 
                    transparent: true, 
                    opacity: (1 - i/8) * 0.5,
                    blending: THREE.AdditiveBlending
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.random() * Math.PI;
                ring.rotation.y = Math.random() * Math.PI;
                ring.scale.setScalar(0.5 + i * 0.2);
                group.add(ring);
                objects.push({
                    update: (t: number) => {
                        ring.rotation.x += 0.002 * (i + 1);
                        ring.rotation.y += 0.001 * (i + 1);
                    }
                });
            }
            scene.add(group);
        }
        else if (type === 7) {
            // Type 7: Wave Mesh (Oceanic wireframe)
            const geo = new THREE.PlaneGeometry(15, 15, 30, 30);
            const mat = new THREE.MeshPhongMaterial({ color, wireframe: true, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(geo, mat);
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = -2;
            scene.add(plane);
            objects.push({ update: (t: number) => {
                const pos = plane.geometry.attributes.position as THREE.BufferAttribute;
                for(let i=0; i<pos.count; i++) {
                    const vx = pos.getX(i), vy = pos.getY(i);
                    pos.setZ(i, Math.sin(vx*0.5 + t)*0.5 + Math.cos(vy*0.5 + t)*0.5);
                }
                pos.needsUpdate = true;
            }});
        }
        else if (type === 8) {
            // Type 8: DNA Helix
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(500 * 3);
            for(let i=0; i<500; i++) {
                const t_val = i * 0.1;
                pos[i*3] = Math.cos(t_val) * 2;
                pos[i*3+1] = (i - 250) * 0.05;
                pos[i*3+2] = Math.sin(t_val) * 2;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color, size: 0.1, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
            const helix = new THREE.Points(geo, mat);
            scene.add(helix);
            objects.push({ update: () => { helix.rotation.y += 0.01; }});
        }
        else if (type === 9) {
            // Type 9: Star Field (Warp Speed)
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(1000 * 3);
            for(let i=0; i<3000; i++) pos[i] = (Math.random() - 0.5) * 20;
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 });
            const stars = new THREE.Points(geo, mat);
            scene.add(stars);
            objects.push({ update: () => {
                const positions = stars.geometry.attributes.position as THREE.BufferAttribute;
                for(let i=0; i<positions.count; i++) {
                    let z = positions.getZ(i) + 0.1;
                    if(z > 5) z = -15;
                    positions.setZ(i, z);
                }
                positions.needsUpdate = true;
            }});
        }
        else if (type === 10) {
            // Type 10: Neon Rings (Tunnel)
            const group = new THREE.Group();
            const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.2 });
            for(let i=0; i<10; i++) {
                const geo = new THREE.TorusGeometry(3, 0.05, 16, 100);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.z = -i * 2;
                group.add(mesh);
            }
            scene.add(group);
            objects.push({ update: (t: number) => {
                group.children.forEach((c, i) => {
                    c.position.z += 0.05;
                    if(c.position.z > 2) c.position.z = -18;
                    c.rotation.z = t * 0.5 + i;
                });
            }});
        }

        // ---------------------------------------------------------
        // RENDER LOOP
        // ---------------------------------------------------------
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            time += 0.01;

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            // Apply parallax to camera
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            // Update scene objects
            objects.forEach(obj => {
                if (obj.update) obj.update(time);
                else if (obj.rotation) {
                    obj.rotation.x += 0.005;
                    obj.rotation.y += 0.005;
                }
            });

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth || 800;
            const h = containerRef.current.clientHeight || 550;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            
            // Extensive ThreeJS cleanup
            scene.traverse((object: any) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((mat: any) => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            renderer.dispose();
            if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
        };
    }, [type, accentColor]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
    );
}

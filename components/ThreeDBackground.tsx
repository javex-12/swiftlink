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
            // Type 1: High-Fidelity Torus Knot
            const geo = new THREE.TorusKnotGeometry(2, 0.6, 200, 32);
            const mat = new THREE.MeshPhysicalMaterial({ 
                color, 
                metalness: 0.9, 
                roughness: 0.1, 
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                emissive: color.clone().multiplyScalar(0.2),
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geo, mat);
            scene.add(mesh);
            objects.push({ update: (t: number) => { 
                mesh.rotation.x = t * 0.2; 
                mesh.rotation.y = t * 0.3;
                mesh.scale.setScalar(1 + Math.sin(t) * 0.05);
            } });
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
            // Type 4: Abstract Organic Fluid Sphere
            const geometry = new THREE.IcosahedronGeometry(2, 12);
            const material = new THREE.MeshStandardMaterial({ 
                color, 
                flatShading: false,
                wireframe: false,
                metalness: 0.8,
                roughness: 0.2,
                emissive: color.clone().multiplyScalar(0.1)
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            
            const positionAttribute = geometry.getAttribute('position');
            const originalPositions = new Float32Array(positionAttribute.array);

            objects.push({
                update: (t: number) => {
                    mesh.rotation.y += 0.005;
                    const positions = geometry.attributes.position.array as Float32Array;
                    for (let i = 0; i < positions.length; i += 3) {
                        const x = originalPositions[i];
                        const y = originalPositions[i+1];
                        const z = originalPositions[i+2];
                        
                        const noise = Math.sin(x * 1.5 + t) * Math.cos(y * 1.5 + t) * Math.sin(z * 1.5 + t);
                        const factor = 1 + noise * 0.15;
                        
                        positions[i] = x * factor;
                        positions[i+1] = y * factor;
                        positions[i+2] = z * factor;
                    }
                    geometry.attributes.position.needsUpdate = true;
                    geometry.computeVertexNormals();
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

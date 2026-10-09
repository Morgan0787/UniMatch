import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const RADIUS = 1.65;
const EARTH_Y = 205 * Math.PI / 180;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function shapeAt(direction, kind, result) {
    const { x, y, z } = direction;
    if (kind === 1) {
        const angle = Math.atan2(z, x);
        const radius = 1.48 + 0.27 * Math.sin(angle * 3 + y * 4)
            + 0.18 * Math.cos(angle * 5 - y * 3);
        const twist = y * 0.36;
        result.set((x * Math.cos(twist) - z * Math.sin(twist)) * radius,
            y * radius * 1.07,
            (x * Math.sin(twist) + z * Math.cos(twist)) * radius);
    } else if (kind === 2) {
        const edge = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
        const radius = 1.26 / Math.pow(edge, 0.88);
        result.set(x * radius, y * radius, z * radius);
    } else {
        result.copy(direction).multiplyScalar(1.57);
    }
    return result;
}

function createMorphObject(compact) {
    const count = compact ? 3500 : 7500;
    const targets = [0, 1, 2].map(() => new Float32Array(count * 3));
    const colors = new Float32Array(count * 3);
    const vector = new THREE.Vector3();
    const output = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
        const y = 1 - 2 * (i + 0.5) / count;
        const angle = i * 2.399963229728653;
        vector.set(Math.sqrt(1 - y * y) * Math.cos(angle), y,
            Math.sqrt(1 - y * y) * Math.sin(angle));
        targets.forEach((target, kind) => {
            shapeAt(vector, kind, output).toArray(target, i * 3);
        });
        const warmth = (Math.sin(i * 17.13) + 1) * 0.5;
        colors.set([1, 0.56 + warmth * 0.34, 0.36 + warmth * 0.48], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(targets[0].slice(), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pointsMaterial = new THREE.PointsMaterial({
        size: compact ? 0.036 : 0.028, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0, depthWrite: false,
    });
    const points = new THREE.Points(geometry, pointsMaterial);
    const shellGeometry = new THREE.SphereGeometry(1, compact ? 40 : 64, compact ? 28 : 48);
    const shellDirections = Float32Array.from(shellGeometry.attributes.position.array);
    const shellMaterial = new THREE.MeshPhysicalMaterial({
        color: '#e9b992', metalness: 0.05, roughness: 0.55, clearcoat: 0.8,
        transparent: true, opacity: 0, depthWrite: false,
        envMapIntensity: 0.8,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    const group = new THREE.Group();
    group.add(shell, points);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    function update(from, to, blend, alpha) {
        const position = geometry.attributes.position;
        const source = targets[from];
        const destination = targets[to];
        for (let i = 0; i < position.array.length; i++) {
            position.array[i] = source[i] + (destination[i] - source[i]) * blend;
        }
        position.needsUpdate = true;
        const shellPosition = shellGeometry.attributes.position;
        for (let i = 0; i < shellPosition.count; i++) {
            a.fromArray(shellDirections, i * 3).normalize();
            shapeAt(a, from, a);
            b.fromArray(shellDirections, i * 3).normalize();
            shapeAt(b, to, b);
            a.lerp(b, blend);
            shellPosition.setXYZ(i, a.x, a.y, a.z);
        }
        shellPosition.needsUpdate = true;
        shellGeometry.computeVertexNormals();
        pointsMaterial.opacity = 0.9 * alpha;
        shellMaterial.opacity = 0.61 * alpha;
    }
    return { group, update };
}

/** Geographic coordinates use the same orientation as Three's SphereGeometry UVs. */
function onGlobe(longitude, latitude, radius = RADIUS) {
    const phi = (longitude + 180) * Math.PI / 180;
    const theta = (90 - latitude) * Math.PI / 180;
    return new THREE.Vector3(
        -radius * Math.cos(phi) * Math.sin(theta),
        radius * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
    );
}

function createLandMaps(land) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas texture unavailable');
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    for (const feature of land.features) {
        const polygons = feature.geometry.type === 'Polygon'
            ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        for (const polygon of polygons) {
            context.beginPath();
            for (const ring of polygon) {
                ring.forEach(([lon, lat], index) => {
                    const x = (lon + 180) / 360 * canvas.width;
                    const y = (90 - lat) / 180 * canvas.height;
                    if (index === 0) context.moveTo(x, y);
                    else context.lineTo(x, y);
                });
                context.closePath();
            }
            context.fill('evenodd');
        }
    }
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const mask = new THREE.CanvasTexture(canvas);
    const relief = document.createElement('canvas');
    relief.width = canvas.width;
    relief.height = canvas.height;
    const reliefContext = relief.getContext('2d');
    if (!reliefContext) throw new Error('Relief texture unavailable');
    const noise = reliefContext.createImageData(canvas.width, canvas.height);
    let seed = 173;
    for (let i = 0; i < noise.data.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const value = 110 + (seed / 4294967296) * 90;
        noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = value;
        noise.data[i + 3] = 255;
    }
    reliefContext.putImageData(noise, 0, 0);
    return {
        mask,
        relief: new THREE.CanvasTexture(relief),
        isLand(lon, lat) {
            const x = Math.min(2047, Math.floor((lon + 180) / 360 * 2048));
            const y = Math.min(1023, Math.floor((90 - lat) / 180 * 1024));
            return pixels.data[(y * 2048 + x) * 4] > 128;
        },
    };
}

function createGraticule() {
    const points = [];
    const addSegment = (a, b) => points.push(...a.toArray(), ...b.toArray());
    for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = -180; lon < 180; lon += 3) {
            addSegment(onGlobe(lon, lat, 1.656), onGlobe(lon + 3, lat, 1.656));
        }
    }
    for (let lon = -180; lon < 180; lon += 30) {
        for (let lat = -90; lat < 90; lat += 3) {
            addSegment(onGlobe(lon, lat, 1.656), onGlobe(lon, lat + 3, 1.656));
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
        color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false,
    }));
}

function createPaperPlane() {
    const plane = new THREE.Group();
    const nose = [0, 0.1, 0.8];
    const tail = [0, -0.18, -0.46];
    const leftFold = [-0.1, 0.04, -0.32];
    const rightFold = [0.1, 0.04, -0.32];
    const faces = [
        { points: [nose, [-0.6, 0.02, -0.5], leftFold], color: '#ed6a37' },
        { points: [nose, leftFold, tail], color: '#ad3518' },
        { points: [nose, rightFold, [0.6, 0.02, -0.5]], color: '#f47a40' },
        { points: [nose, tail, rightFold], color: '#d7461b' },
    ];
    faces.forEach(({ points, color }) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
        geometry.computeVertexNormals();
        const material = new THREE.MeshPhysicalMaterial({
            color, roughness: 0.56, metalness: 0.02, side: THREE.DoubleSide,
            clearcoat: 0.1,
        });
        plane.add(new THREE.Mesh(geometry, material));
    });
    const crease = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...leftFold), new THREE.Vector3(...nose), new THREE.Vector3(...rightFold),
    ]);
    plane.add(new THREE.Line(crease, new THREE.LineBasicMaterial({ color: '#ffb187' })));
    plane.scale.setScalar(0.72);
    return plane;
}

function createGroundShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Shadow texture unavailable');
    const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(53,65,69,.23)');
    gradient.addColorStop(0.4, 'rgba(53,65,69,.12)');
    gradient.addColorStop(1, 'rgba(53,65,69,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.7), new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, toneMapped: false,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0.15, -1.78, 0);
    return { mesh, texture };
}

/** Owns GPU resources only. The React host owns scheduling and browser events. */
export function createGlobeScene(canvas, land, compact) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    const scene = new THREE.Scene();
    const textures = [];
    let environment;
    let disposed = false;

    function dispose() {
        if (disposed) return;
        disposed = true;
        const resources = new Set();
        scene.traverse(object => {
            if (object instanceof THREE.InstancedMesh) object.dispose();
            if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
                resources.add(object.geometry);
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => resources.add(material));
            }
        });
        resources.forEach(resource => resource.dispose());
        textures.forEach(texture => texture.dispose());
        environment?.dispose();
        renderer.dispose();
    }

    try {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.25));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        renderer.setClearColor('#f3f4f3', 0);
        const camera = new THREE.PerspectiveCamera(38, 1.5, 0.1, 30);
        camera.position.set(0, 0.6, 6.6);
        camera.lookAt(0.05, 0, 0);

        const room = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        try {
            environment = pmrem.fromScene(room, 0.035);
            scene.environment = environment.texture;
        } finally {
            room.dispose();
            pmrem.dispose();
        }
        scene.add(new THREE.HemisphereLight('#ffffff', '#a4aeb4', 0.8));
        const keyLight = new THREE.DirectionalLight('#ffffff', 1.6);
        keyLight.position.set(-3, 5, 4);
        scene.add(keyLight);
        const warmLight = new THREE.DirectionalLight('#ffe6cf', 0.7);
        warmLight.position.set(4, 0.5, -1);
        scene.add(warmLight);

        const assembly = new THREE.Group();
        assembly.position.set(0.15, 0.12, 0);
        scene.add(assembly);
        const earth = new THREE.Group();
        // Longitude 65°E faces the camera; tilt the north pole away to reveal Eurasia.
        earth.rotation.set(0.24, EARTH_Y, -0.13);
        assembly.add(earth);
        const maps = createLandMaps(land);
        textures.push(maps.mask, maps.relief);
        const geometry = new THREE.SphereGeometry(RADIUS, compact ? 64 : 96, compact ? 40 : 64);
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.56, 48, 32),
            new THREE.MeshStandardMaterial({ color: '#e7e8e3', roughness: 0.75 }));
        const ocean = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
            color: '#a6bcc5', metalness: 0.24, roughness: 0.2,
            transparent: true, opacity: 0.76, depthWrite: false,
            clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 0.75,
        }));
        earth.add(core, ocean, createGraticule());
        const continents = new THREE.Mesh(new THREE.SphereGeometry(1.665, 96, 64), new THREE.MeshPhysicalMaterial({
            color: '#efeee7', alphaMap: maps.mask, alphaTest: 0.5,
            bumpMap: maps.relief, bumpScale: 0.035,
            roughness: 0.42, metalness: 0.13, clearcoat: 0.65,
            clearcoatRoughness: 0.28, envMapIntensity: 0.75,
        }));
        earth.add(continents);

        // Tiny physical facets catch the studio lights as the continents rotate.
        const count = compact ? 2800 : 5000;
        const facets = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.007, 0),
            new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.23, metalness: 0.2 }), count);
        const dummy = new THREE.Object3D();
        let used = 0;
        for (let i = 0; i < count; i++) {
            const latitude = Math.asin(1 - 2 * (i + 0.5) / count) * 180 / Math.PI;
            const longitude = ((i * 137.507764) % 360) - 180;
            if (!maps.isLand(longitude, latitude)) continue;
            dummy.position.copy(onGlobe(longitude, latitude, 1.673));
            dummy.rotation.set(i * 0.31, i * 0.17, i * 0.11);
            dummy.scale.setScalar(0.55 + (i % 7) / 9);
            dummy.updateMatrix();
            facets.setMatrixAt(used++, dummy.matrix);
        }
        facets.count = used;
        earth.add(facets);

        const orbit = new THREE.Group();
        orbit.rotation.set(0.28, 0, 0.28);
        assembly.add(orbit);
        const orbitPoints = [];
        const orbitPosition = angle => new THREE.Vector3(2.09 * Math.cos(angle), 0, 1.88 * Math.sin(angle));
        for (let i = 0; i <= 180; i++) orbitPoints.push(orbitPosition(i / 180 * Math.PI * 2));
        const curve = new THREE.CatmullRomCurve3(orbitPoints, true);
        orbit.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 180, 0.006, 5, true),
            new THREE.MeshStandardMaterial({ color: '#c1b397', metalness: 0.7, roughness: 0.34 })));
        const airplane = createPaperPlane();
        orbit.add(airplane);
        const { mesh: shadow, texture: shadowTexture } = createGroundShadow();
        scene.add(shadow);
        textures.push(shadowTexture);
        const morph = createMorphObject(compact);
        assembly.add(morph.group);

        let elapsed = 0;
        let pointerX = 0;
        let pointerY = 0;
        let storyProgress = 0;
        function setProgress(value, reduced = false) {
            const next = clamp(value);
            storyProgress = next;
            const position = reduced
                ? (next < 0.29 ? 0 : next < 0.53 ? 0.35 : next < 0.79 ? 0.63 : 0.94)
                : next;
            const transition = position < 0.28
                ? { from: 0, to: 1, blend: smooth((position - 0.08) / 0.2) }
                : position < 0.56
                    ? { from: 1, to: 2, blend: smooth((position - 0.31) / 0.25) }
                    : { from: 2, to: 0, blend: smooth((position - 0.59) / 0.22) };
            const globeFade = 1 - smooth((position - 0.065) / 0.17);
            earth.scale.setScalar(Math.max(0.001, globeFade));
            orbit.scale.setScalar(Math.max(0.001, globeFade));
            const shapeFade = smooth((position - 0.06) / 0.18);
            const endFade = 1 - 0.84 * smooth((position - 0.78) / 0.16);
            morph.update(transition.from, transition.to, transition.blend, shapeFade * endFade);
            morph.group.scale.setScalar(0.97 + 0.06 * Math.sin(position * Math.PI));
            morph.group.rotation.set(position * 0.23, position * 2.8, position * 0.16);
            shadow.material.opacity = 0.65 + shapeFade * 0.25;
        }
        function render(delta, pointer) {
            elapsed += delta;
            const smoothing = delta ? 1 - Math.exp(-delta * 4) : 1;
            pointerX += (pointer.x - pointerX) * smoothing;
            pointerY += (pointer.y - pointerY) * smoothing;
            earth.rotation.y = EARTH_Y + elapsed * 0.055;
            morph.group.rotation.y = storyProgress * 2.8 + elapsed * 0.035;
            assembly.rotation.set(pointerY * 0.09, pointerX * 0.15, 0);
            assembly.position.y = 0.12 + Math.sin(elapsed * 0.7) * 0.035;
            keyLight.position.x = -3 + pointerX * 1.1;
            keyLight.position.y = 5 - pointerY * 0.7;
            // A bounded flight keeps the folded silhouette visible beside the globe.
            const angle = 0.32 + Math.sin(elapsed * 0.25) * 0.18;
            airplane.position.copy(orbitPosition(angle));
            airplane.rotation.set(-1.1, 0.25, -0.65 + Math.sin(elapsed * 0.25) * 0.08);
            shadow.scale.setScalar(1 + Math.sin(elapsed * 0.7) * 0.018);
            renderer.render(scene, camera);
        }
        return {
            resize(width, height) {
                renderer.setSize(width, height, false);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            },
            render,
            setProgress,
            dispose,
        };
    } catch (error) {
        dispose();
        throw error;
    }
}

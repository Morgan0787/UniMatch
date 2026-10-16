import { HERO_CENTERS, HERO_UNIVERSITY_POSITION } from './heroSceneData.js';
import { vertexShader, fragmentShader } from './heroSceneShaders.js';

export const HERO_SCENE_DURATION = 14;

export function sceneEase(value) {
  const x = Math.max(0, Math.min(1, value));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

const mix = (a, b, progress) => a + (b - a) * progress;

export function getHeroSceneLayout(time, width, height) {
  const mobile = width <= 760;
  const short = !mobile && height <= 650;
  const top = mobile ? 145 : short ? 120 : 132;
  const bottom = mobile ? Math.max(220, height * .27) : short ? 215 : Math.max(230, height * .29);
  const initialHeight = Math.max(100, height - top - bottom);
  const focus = sceneEase(time / .9);
  return {
    focus,
    scale: mix(Math.min(width * .34, initialHeight * .42), Math.min(width * .45, height * .42), focus),
    centerX: width * .5,
    centerY: mix(top + initialHeight * .56, height * .5, focus),
    captionY: mix(top + initialHeight + 5, height - 34, focus),
  };
}

export function projectHeroPoint(point, width, height, time = HERO_SCENE_DURATION) {
  const { scale, centerX, centerY } = getHeroSceneLayout(time, width, height);
  const perspective = 2.8 / (2.8 + point[2]);
  return [centerX + point[0] * scale * perspective, centerY + point[1] * scale * perspective];
}

export function heroRoutePoint(u) {
  return [-0.92 + 1.58 * u, 0.36 - 0.56 * u - 0.46 * Math.sin(Math.PI * u), 0.10 * Math.sin(Math.PI * u) - 0.08 * u];
}

const ribbonPoint = u => [-0.99 + 1.72 * u, 0.13 - 0.41 * u + 0.26 * Math.sin(u * Math.PI * 2), 0.46 * Math.sin(u * Math.PI * 2)];

/** Overlay positions use the same time and normalized coordinates as the GPU. */
export function getHeroSceneFrame(time, width, height) {
  const a = sceneEase((time - 1.2) / 2.2);
  const b = sceneEase((time - 5.8) / 2);
  const c = sceneEase((time - 7.7) / 2);
  const { scale, captionY } = getHeroSceneLayout(time, width, height);
  const labels = HERO_CENTERS.map((center, i) => {
    const final = i === 3 ? HERO_UNIVERSITY_POSITION : [center[0] * 1.13, center[1] * 1.13, center[2] + 0.65];
    const point = projectHeroPoint(center.map((value, axis) => mix(value, final[axis], c)), width, height, time);
    point[1] += i === 3 ? mix(-37, -67, c) : i < 4 ? -37 : 38;
    // Keep the three upper glass labels apart on compact phones.
    if (width <= 360) point[1] += (i === 1 ? -10 : i === 3 ? 12 : 0) * (1 - c);
    return { x: point[0], y: point[1], opacity: a * (i === 3 ? 1 : mix(1, 0.22, c)) };
  });
  const cores = HERO_CENTERS.map((center, i) => {
    const ribbon = ribbonPoint(i / 6);
    const final = i === 3 ? HERO_UNIVERSITY_POSITION : heroRoutePoint(i / 6);
    const point = projectHeroPoint(center.map((value, axis) => mix(mix(value, ribbon[axis], b), final[axis], c)), width, height, time);
    return { x: point[0], y: point[1], size: scale * mix(0.6, i === 3 ? 0.95 : 0.35, c), opacity: a * mix(0.8, i === 3 ? 0.9 : 0.18, c) };
  });
  const origin = projectHeroPoint(heroRoutePoint(0), width, height, time);
  const pulse = projectHeroPoint(heroRoutePoint(sceneEase((time - 9.8) / 2.2)), width, height, time);
  return {
    a, b, c, scale, labels, cores, origin, pulse, captionY,
    pulseOpacity: sceneEase((time - 9.7) / 0.3),
    stage: time < 2.4 ? 0 : time < 7 ? 1 : time < 9.3 ? 2 : 3,
    earth: projectHeroPoint([0, 0, 0], width, height, time),
  };
}

/** Owns one context/program and seven immutable buffers. No particle work per frame. */
export function createHeroSceneRenderer(canvas, data, onLost) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL is unavailable');
  const shaders = [];
  const buffers = [];
  let disposed = false;
  const program = gl.createProgram();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', lost);
    buffers.forEach(buffer => gl.deleteBuffer(buffer));
    shaders.forEach(shader => gl.deleteShader(shader));
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  const lost = event => {
    event.preventDefault();
    if (!disposed) onLost();
  };
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]]) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Particle shader compilation failed');
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Particle program linking failed');
    gl.useProgram(program);
    for (const name of ['earth', 'icon', 'iconNormal', 'ribbon', 'center', 'meta']) {
      const buffer = gl.createBuffer();
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data[name], gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, name);
      if (attribute >= 0) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
      }
    }
    const subject = new Float32Array(data.earth.length / 3);
    for (let i = 0; i < subject.length; i += 1) subject[i] = i % HERO_CENTERS.length;
    const subjectBuffer = gl.createBuffer();
    buffers.push(subjectBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, subjectBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, subject, gl.STATIC_DRAW);
    const subjectAttribute = gl.getAttribLocation(program, 'subject');
    gl.enableVertexAttribArray(subjectAttribute);
    gl.vertexAttribPointer(subjectAttribute, 1, gl.FLOAT, false, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    canvas.addEventListener('webglcontextlost', lost);
    const uniforms = { time: gl.getUniformLocation(program, 't'), viewport: gl.getUniformLocation(program, 'viewport'), dpr: gl.getUniformLocation(program, 'dpr'), stages: gl.getUniformLocation(program, 'uStages'), earthRotation: gl.getUniformLocation(program, 'uEarthRotation'), fold: gl.getUniformLocation(program, 'uFold'), yaw: gl.getUniformLocation(program, 'uYaw[0]') };
    const yaw = new Float32Array(HERO_CENTERS.length * 2);
    const layoutUniform = gl.getUniformLocation(program, 'uLayout');
    let width = 1, height = 1, dpr = 1;
    return {
      count: data.earth.length / 3,
      resize(nextWidth, nextHeight, ratio) {
        if (disposed || nextWidth < 1 || nextHeight < 1) return;
        width = nextWidth;
        height = nextHeight;
        dpr = Math.min(ratio || 1, width < 600 ? 1.35 : 1.5);
        const backingWidth = Math.round(width * dpr), backingHeight = Math.round(height * dpr);
        if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
          canvas.width = backingWidth;
          canvas.height = backingHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      },
      render(time) {
        if (disposed || gl.isContextLost()) return false;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1f(uniforms.time, Math.max(0, Math.min(HERO_SCENE_DURATION, time)));
        gl.uniform2f(uniforms.viewport, width, height);
        gl.uniform1f(uniforms.dpr, dpr);
        const layout = getHeroSceneLayout(time, width, height);
        gl.uniform4f(layoutUniform, layout.scale, layout.centerX, layout.centerY, layout.focus);
        const a = sceneEase((time - 1.2) / 2.2), b = sceneEase((time - 5.8) / 2), c = sceneEase((time - 7.7) / 2);
        gl.uniform3f(uniforms.stages, a, b, c);
        const earthAngle = 1.65 + time * 0.24;
        gl.uniform2f(uniforms.earthRotation, Math.cos(earthAngle), Math.sin(earthAngle));
        const folding = Math.sin(a * Math.PI) * (1 - b), foldAngle = folding * 0.48 + Math.sin(b * Math.PI) * 0.30;
        gl.uniform3f(uniforms.fold, Math.cos(foldAngle), Math.sin(foldAngle), folding);
        HERO_CENTERS.forEach((center, i) => { const angle = 0.38 + Math.sin(time * 0.85 + center[0] * 3) * 0.18; yaw[i * 2] = Math.cos(angle); yaw[i * 2 + 1] = Math.sin(angle); });
        gl.uniform2fv(uniforms.yaw, yaw);
        gl.drawArrays(gl.POINTS, 0, data.earth.length / 3);
        return true;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

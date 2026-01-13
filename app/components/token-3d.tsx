// @refresh reset 

import { useEffect, useRef, useState } from "react";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { hoverFunctions } from "./shader_hover_functions";


type Props = {
  modelUrl: string;
  xIconUrl: string;
  hIconUrl: string;
  blockSize: number;
  gapSize: number;
  coinSize: number;
  xProb: number;
  hProb: number;
  trailLength: number;
  trailLifetime: number;
  maxHoverRotation: number;
  hoverRadius: number;
};


const colors = {
  gridColor: new THREE.Color("#ffede6"),
  white: new THREE.Color("#ffffff"),
  darkColor: new THREE.Color("#FF4600"),
  lightColor: new THREE.Color("#FFA280"),
  black: new THREE.Color("#000000"),
}

const TRAIL_NEIGHBOR_PROBABILITY = 0.5;
const TRAIL_FADE_FLOOR = 1e-3;
const TRAIL_MIN_SEGMENTS = 2;
const trailLength_SEGMENTS = 3;
const TRAIL_SPEED_SLOWDOWN = 2;
const TRAIL_MOVES: Array<[number, number]> = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
  [0, 2],
  [0, -2],
  [2, 0],
  [-2, 0],
];
const HOVER_ACTIVITY_DECAY = 0.15;
const ROTATION_DAMPING = 0.06;

export default function Token3D({
  modelUrl = "https://framerusercontent.com/assets/B1f1WyIwmMgbKooavij99c287I.gltf",
  xIconUrl = 'https://framerusercontent.com/images/nnklAxMOp3CMHYqg4Ig9jhqM.svg?width=80&height=80',
  hIconUrl = 'https://framerusercontent.com/images/DU5p9BFEraMZT6en8KuyvYcNbek.svg?width=80&height=80',
  blockSize = 12,
  gapSize = 1,
  coinSize = 3.0,
  xProb = 0.000002,
  hProb = 0.02,
  trailLength = 128,
  trailLifetime = 4,
  maxHoverRotation = 20,
  hoverRadius = 1.6,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("")
  const MAX_HOVER_ROTATION = THREE.MathUtils.degToRad(maxHoverRotation);


  useEffect(() => {
    const fileUrl = modelUrl
    if (!fileUrl) {
      setStatus("Model required")
      return
    }
    const iconUrl = xIconUrl || hIconUrl
    if (!iconUrl) {
      setStatus("X Icon or H Icon required")
      return
    }

    if (!containerRef.current) return;
    const container = containerRef.current;

    const sizes = {
      width: container.clientWidth,
      height: container.clientHeight,
    };

    const cameraPosition = new THREE.Vector3(-5.0, 0.0, 14.0);
    const scene = new THREE.Scene();

    // Cameras
    const frustumSize = coinSize;
    const createOrthoCamera = () => {
      const aspectRatio = sizes.width / sizes.height || 1;
      const ortho = new THREE.OrthographicCamera(
        (-frustumSize * aspectRatio) / 2,
        (frustumSize * aspectRatio) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        100,
      );
      ortho.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      ortho.lookAt(0, 0, 0);
      ortho.updateProjectionMatrix();
      return ortho;
    };

    const orthoCamera = createOrthoCamera();
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(colors.white);
    renderer.setSize(sizes.width, sizes.height);
    container.appendChild(renderer.domElement);
    renderer.autoClear = false;

    let controls = new OrbitControls(orthoCamera, renderer.domElement);
    controls.enableDamping = true;
    const setControlsMode = (mode: "2d" | "3d") => {
      const is3D = mode === "3d";
      controls.enableRotate = is3D;
      controls.enablePan = false;
      controls.enableZoom = is3D;
      controls.enabled = false;
    };

    setControlsMode("3d");

    // Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, orthoCamera);
    composer.addPass(renderPass);

    const pixelateShader = {
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2() },
        blockSize: { value: blockSize },
        gapSize: { value: gapSize },
        gridColor: { value: colors.gridColor },
        white: { value: colors.white },
        darkColor: { value: colors.darkColor },
        lightColor: { value: colors.lightColor },
        xTexture: { value: null as any },
        xProb: { value: xProb },
        hTexture: { value: null as any },
        hProb: { value: hProb },
        time: { value: 0.0 },
        hoverActive: { value: 0.0 },
        hoverPos: { value: new THREE.Vector2(0.5, 0.5) },
        hoverTrailActive: { value: 0 },
        hoverTrailPos: {
          value: Array.from({ length: trailLength }, () => new THREE.Vector2(-10, -10)),
        },
        hoverRadius: { value: hoverRadius },
        trailMax: { value: trailLength },
        hoverTrailAge: { value: new Float32Array(trailLength).fill(1) },
        hoverPresent: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float blockSize;
        uniform float gapSize;
        uniform vec3 gridColor;
        uniform vec3 white;
        uniform vec3 darkColor;
        uniform vec3 lightColor;
        uniform sampler2D xTexture;
        uniform float xProb;
        uniform sampler2D hTexture;
        uniform float hProb;
        uniform float time;
        uniform float hoverActive;
        uniform float hoverPresent;
        uniform float hoverRadius;
        uniform vec2 hoverPos;
        uniform int hoverTrailActive;
        uniform vec2 hoverTrailPos[${trailLength}];
        uniform float hoverTrailAge[${trailLength}];
        uniform int trailMax;
        varying vec2 vUv;

        vec3 computeCellFillColor(vec2 cellUv, vec3 baseColor, vec3 fillColor) {
          vec2 rectCenter = vec2(0.5, 0.5);
          vec2 rectSize = vec2(0.4, 0.4);
          float cornerRadius = 0.1;
          vec2 halfSize = rectSize * 0.5 - vec2(cornerRadius);
          vec2 d = abs(cellUv - rectCenter) - halfSize;
          vec2 clampedD = max(d, 0.0);
          float dist = length(clampedD) - cornerRadius;
          float shapeMask = 1.0 - step(0.0, dist);
          return mix(baseColor, fillColor, shapeMask);
        }

        // Генерация случайного числа от 0.0 до 1.0 на основе входного значения
        float random(float seed) {
          return fract(sin(seed * 12.9898) * 43758.5453);
        }
        
        // Генерация случайного числа на основе 2D координат
        float random2D(vec2 st) {
          return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec4 pickTrailCenterColor(float selector, vec4 baseResult, vec4 whiteCenterResult, vec4 darkColorCenterResult, vec4 lightColorCenterResult) {
          if (selector < 0.7) {
          return baseResult;
          } else if (selector < 0.8) {
            return whiteCenterResult;
          } else if (selector < 0.9) {
            return darkColorCenterResult;
          } else {
            return lightColorCenterResult;
          }
        }

        ${hoverFunctions.applyHover()}

        ${hoverFunctions.applyWhiteHover()} 

        void main() {
          vec2 fc = gl_FragCoord.xy;
          float cell = blockSize + gapSize;
          vec2 canvasUv = vec2(fc.x / resolution.x, fc.y / resolution.y);

          // внутри какой ячейки находимся
          // Точное вычисление координат ячейки для предотвращения смещения при малых размерах
          vec2 cellIdx = floor(fc / cell);
          vec2 cellTopLeft = cellIdx * cell + vec2(gapSize, gapSize);
          vec2 cellUv = clamp((fc - cellTopLeft) / blockSize, 0.0, 1.0);
          
          // Для проверки gap используем mod
          vec2 m = mod(floor(fc), cell);
          bool gapX = (m.x < gapSize);
          bool gapY = (m.y < gapSize);

          // Для sampleCenter используем точные координаты
          vec2 base = cellIdx * cell;
          vec2 sampleCenter = base + vec2(gapSize + 0.5 * blockSize);
          vec2 sampleUv = sampleCenter / resolution;

          vec4 col = texture2D(tDiffuse, sampleUv);

          // Белые блоки: только вертикальная линия (без горизонтальной)
          bool isWhite = all(greaterThanEqual(col.rgb, vec3(0.95)));
          if (isWhite) {
          
            float effGapX = max(gapSize, 1.0);
            if (m.x < effGapX) { 
              gl_FragColor = vec4(gridColor, 1.0);
              return; 
            }

            vec4 hoveredWhite = applyWhiteHover(col, fc, cell, cellTopLeft, blockSize, cellUv, lightColor);
            gl_FragColor = hoveredWhite; 
            return;
          }

          // Небелые: линии сетки в обоих направлениях
          if (gapX || gapY) {
            // Проверяем, находится ли текущая клетка в области ховера
            bool isHovered = false;
            if (hoverActive > 0.5 || hoverTrailActive > 0) {
              float currentRow = floor(fc.y / cell);
              float currentCol = floor(fc.x / cell);
              float currentRowCoord = fc.y / cell;
              float currentColCoord = fc.x / cell;
              
              vec2 hoverPixel = vec2(hoverPos.x * resolution.x, hoverPos.y * resolution.y);
              float hoverRowCoord = hoverPixel.y / cell;
              float hoverColCoord = hoverPixel.x / cell;
              
              // Проверяем основной ховер
              if (hoverActive > 0.5 &&
                  abs(currentRowCoord - hoverRowCoord) <= hoverRadius &&
                  abs(currentColCoord - hoverColCoord) <= hoverRadius) {
                isHovered = true;
              }
              
              // Проверяем trail ховер
              if (!isHovered) {
                for (int i = 0; i < trailMax; i++) {
                  if (i >= hoverTrailActive) {
                    break;
                  }
                  vec2 trailCell = hoverTrailPos[i];
                  if (
                    abs(currentRow - trailCell.y) < hoverRadius &&
                    abs(currentCol - trailCell.x) < hoverRadius
                  ) {
                    isHovered = true;
                    break;
                  }
                }
              }
            }
            
            vec3 borderColor = isHovered ? white.rgb : gridColor.rgb;
            gl_FragColor = vec4(borderColor, 1.0);
            return;
          }

          // Иконки/замены по цветам
          // Проверяем lightColor и darkColor в linear RGB (с допуском)
          bool isLightColor = distance(col.rgb, lightColor) < 0.05;
          bool isDarkColor = distance(col.rgb, darkColor) < 0.05;

          // случайное решение по ячейке + время
          float timeStep = floor(time * 3.0);
          float rnd = fract(sin(dot(cellIdx, vec2(127.1, 311.7)) + timeStep * 43.758) * 43758.5453);

          bool showX = (isLightColor && rnd < xProb);
          bool showH = (isDarkColor && rnd < hProb);

          if (showX || showH) {
            // Используем точные координаты ячейки для предотвращения смещения
            vec2 iconCellIdx = floor(fc / cell);
            vec2 topLeft = iconCellIdx * cell + vec2(gapSize, gapSize);
            vec2 uvCell = (fc - topLeft) / blockSize;
            uvCell = clamp(uvCell, 0.0, 1.0);
            if (showX) {
              vec4 xCol = texture2D(xTexture, uvCell);
              vec3 iconCol = mix(vec3(1.0), lightColor.rgb, xCol.a);
              gl_FragColor = vec4(iconCol, 1.0);
            } else {
              vec4 hCol = texture2D(hTexture, uvCell);
              vec3 iconCol = mix(vec3(1.0), darkColor.rgb, hCol.a);
              gl_FragColor = vec4(iconCol, 1.0);
            }
            return;
          }

          vec4 shaded = applyHover(col, fc, cell, cellTopLeft, blockSize, cellUv, gridColor);
          gl_FragColor = shaded;
        }
      `,
    };

    const pixelatePass = new ShaderPass(pixelateShader as any);

    composer.addPass(pixelatePass);
    composer.addPass(new OutputPass());

    const hoverUniforms = pixelatePass.uniforms as any;
    const pointerState = {
      pos: new THREE.Vector2(0.5, 0.5),
      lastPos: new THREE.Vector2(0.5, 0.5),
      active: false,
      cellRow: -1,
      cellCol: -1,
      activity: 0,
      hovered: false,
      angle: 0,
    };
    type TrailEntry = {
      startRow: number;
      startCol: number;
      age: number;
      lifetime: number;
      path: Array<{ row: number; col: number }>;
      segmentIndex: number;
      segmentProgress: number;
      segmentDuration: number;
      currentRow: number;
      currentCol: number;
    };
    const trailEntries: TrailEntry[] = [];
    const rotationTarget = new THREE.Vector2(0, 0);
    const rotationCurrent = new THREE.Vector2(0, 0);
    const rotationVelocity = new THREE.Vector2(0, 0);
    let modelRoot: THREE.Group | null = null;
    let coinBounds: THREE.Box3 | null = null;

    const updateHoverUniforms = () => {
      hoverUniforms.hoverPos.value.copy(pointerState.pos);
      hoverUniforms.hoverActive.value = pointerState.active ? 1.0 : 0.0;
      hoverUniforms.hoverPresent.value = pointerState.hovered ? 1.0 : 0.0;
    };

    const getCanvasRect = () => renderer.domElement.getBoundingClientRect();

    const toNormalized = (clientX: number, clientY: number) => {
      const rect = getCanvasRect();
      const x = THREE.MathUtils.clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      const y = THREE.MathUtils.clamp((clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
      return { x, y: 1 - y };
    };


    const createTrailPath = (
      startRow: number,
      startCol: number,
      totalRows: number,
      totalCols: number,
    ) => {
      const maxSegments = THREE.MathUtils.randInt(TRAIL_MIN_SEGMENTS, trailLength_SEGMENTS);
      const path: Array<{ row: number; col: number }> = [];
      let currentRow = startRow;
      let currentCol = startCol;

      for (let i = 0; i < maxSegments; i += 1) {
        let added = false;
        const maxAttempts = TRAIL_MOVES.length;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const move = TRAIL_MOVES[Math.floor(Math.random() * TRAIL_MOVES.length)];
          const nextRow = currentRow + move[0];
          const nextCol = currentCol + move[1];
          if (
            nextRow >= 0 &&
            nextRow < totalRows &&
            nextCol >= 0 &&
            nextCol < totalCols
          ) {
            path.push({ row: nextRow, col: nextCol });
            currentRow = nextRow;
            currentCol = nextCol;
            added = true;
            break;
          }
        }
        if (!added) {
          break;
        }
      }

      return path;
    };

    const createTrailEntry = (
      row: number,
      col: number,
      totalRows: number,
      totalCols: number,
    ): TrailEntry => {
      const path = createTrailPath(row, col, totalRows, totalCols);
      const segments = Math.max(path.length, 1);
      const segmentDuration = (trailLifetime * TRAIL_SPEED_SLOWDOWN) / segments;

      return {
        startRow: row,
        startCol: col,
        age: 0,
        lifetime: trailLifetime,
        path,
        segmentIndex: 0,
        segmentProgress: 0,
        segmentDuration,
        currentRow: row,
        currentCol: col,
      };
    };

    const pushTrailNeighbors = (row: number, col: number) => {
      const resolutionVec = hoverUniforms.resolution.value as THREE.Vector2;
      const cellSizePx = blockSize + gapSize;
      const totalCols = Math.max(1, Math.floor(resolutionVec.x / cellSizePx));
      const totalRows = Math.max(1, Math.floor(resolutionVec.y / cellSizePx));

      for (let dRow = -1; dRow <= 1; dRow += 1) {
        for (let dCol = -1; dCol <= 1; dCol += 1) {
          const neighborRow = row + dRow;
          const neighborCol = col + dCol;
          const isCurrent = dRow === 0 && dCol === 0;
          const inBounds =
            neighborRow >= 0 &&
            neighborRow < totalRows &&
            neighborCol >= 0 &&
            neighborCol < totalCols;

          if (
            !isCurrent &&
            inBounds &&
            Math.random() < TRAIL_NEIGHBOR_PROBABILITY
          ) {
            const existingIndex = trailEntries.findIndex(
              (entry) => entry.startRow === neighborRow && entry.startCol === neighborCol,
            );
            if (existingIndex >= 0) {
              const existing = trailEntries[existingIndex];
              existing.age = 0;
              existing.segmentIndex = 0;
              existing.segmentProgress = 0;
              existing.startRow = neighborRow;
              existing.startCol = neighborCol;
              existing.currentRow = neighborRow;
              existing.currentCol = neighborCol;
              existing.path = createTrailPath(neighborRow, neighborCol, totalRows, totalCols);
              const segments = Math.max(existing.path.length, 1);
              existing.segmentDuration = (existing.lifetime * TRAIL_SPEED_SLOWDOWN) / segments;
            } else {
              trailEntries.unshift(
                createTrailEntry(neighborRow, neighborCol, totalRows, totalCols),
              );
              if (trailEntries.length > trailLength) {
                trailEntries.pop();
              }
            }
          }
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerState.hovered = true;
      const { x, y } = toNormalized(event.clientX, event.clientY);
      pointerState.pos.set(x, y);
      const deltaSq = pointerState.pos.distanceToSquared(pointerState.lastPos);
      pointerState.active = deltaSq > 1e-6;
      if (deltaSq > 1e-9) {
        pointerState.angle = Math.atan2(
          pointerState.pos.y - pointerState.lastPos.y,
          pointerState.pos.x - pointerState.lastPos.x,
        );
      }
      pointerState.lastPos.copy(pointerState.pos);
      pointerState.activity = HOVER_ACTIVITY_DECAY;

      const resolutionVec = hoverUniforms.resolution.value as THREE.Vector2;
      if (resolutionVec.x <= 0 || resolutionVec.y <= 0) {
        updateHoverUniforms();
        return;
      }
      const cellSizePx = blockSize + gapSize;
      const pixelX = pointerState.pos.x * resolutionVec.x;
      const pixelY = pointerState.pos.y * resolutionVec.y;
      const col = Math.floor(pixelX / Math.max(cellSizePx, 1));
      const row = Math.floor(pixelY / Math.max(cellSizePx, 1));

      if (row !== pointerState.cellRow || col !== pointerState.cellCol) {
        pointerState.cellRow = row;
        pointerState.cellCol = col;
        if (row >= 0 && col >= 0) {
          pushTrailNeighbors(row, col);
        }
      }

      // Наклон на основе позиции мыши по всему канвасу
      // Преобразуем позицию мыши (0-1) в смещение от центра (-1 до 1)
      const offsetX = (pointerState.pos.x - 0.5) * 2;
      const offsetY = (pointerState.pos.y - 0.5) * 2;
      rotationTarget.set(
        THREE.MathUtils.clamp(-offsetY * MAX_HOVER_ROTATION, -MAX_HOVER_ROTATION, MAX_HOVER_ROTATION),
        THREE.MathUtils.clamp(offsetX * MAX_HOVER_ROTATION, -MAX_HOVER_ROTATION, MAX_HOVER_ROTATION),
      );

      updateHoverUniforms();
    };

    const handlePointerEnter = (event: PointerEvent) => {
      pointerState.hovered = true;
      pointerState.lastPos.copy(pointerState.pos);
      handlePointerMove(event);
    };

    const handlePointerLeave = () => {
      pointerState.active = false;
      pointerState.cellRow = -1;
      pointerState.cellCol = -1;
      pointerState.activity = 0;
      pointerState.hovered = false;
      rotationTarget.set(0, 0);
      renderer.domElement.style.touchAction = "pan-y pinch-zoom";
      updateHoverUniforms();
    };

    const checkObjectIntersection = (clientX: number, clientY: number): boolean => {
      if (!modelRoot) return false;

      const rect = getCanvasRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, orthoCamera);

      const intersects = raycaster.intersectObject(modelRoot, true);
      return intersects.length > 0;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const isTouchingObject = checkObjectIntersection(event.clientX, event.clientY);

      if (!isTouchingObject) {
        renderer.domElement.style.touchAction = "pan-y pinch-zoom";
      } else {
        renderer.domElement.style.touchAction = "none";
      }
      handlePointerEnter(event);
    };

    const handlePointerUp = () => {
      renderer.domElement.style.touchAction = "pan-y pinch-zoom";
    };

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerenter", handlePointerEnter);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    updateHoverUniforms();

    const clock = new THREE.Clock();
    const dbSize = new THREE.Vector2();

    // Textures for icons
    const loaderTex = new THREE.TextureLoader();
    const xTex = loadTexture(loaderTex, xIconUrl);
    const hTex = loadTexture(loaderTex, hIconUrl);

    if (xTex) {
      (pixelatePass.uniforms as any).xTexture.value = xTex;
    }
    if (hTex) {
      (pixelatePass.uniforms as any).hTexture.value = hTex;
    }

    // GLTF
    const gltfLoader = new GLTFLoader();
    let mixer: THREE.AnimationMixer | null = null;
    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);
    if (modelUrl) {
      gltfLoader.load(modelUrl, (gltf: any) => {
        mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations[0]) {
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        tweakSceneMaterials(gltf.scene);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
        const normalizedBox = new THREE.Box3().setFromObject(gltf.scene);
        coinBounds = normalizedBox.clone();
        sceneRoot.add(gltf.scene);
        modelRoot = sceneRoot;
      });
    }

    // Resize
    const resize = () => {
      const isMobile = window.innerWidth < 768;
      // Обновляем размеры
      sizes.width = isMobile ? container?.clientWidth || window.innerWidth : window.innerWidth;
      sizes.height = isMobile ? container?.clientHeight || window.innerHeight : window.innerHeight;

      // Обновляем соотношение сторон камеры
      const aspectRatio = sizes.width / sizes.height || 1;
      orthoCamera.left = (-frustumSize * aspectRatio) / 2;
      orthoCamera.right = (frustumSize * aspectRatio) / 2;
      orthoCamera.top = frustumSize / 2;
      orthoCamera.bottom = -frustumSize / 2;
      orthoCamera.updateProjectionMatrix();

      // Обновляем renderer
      renderer.setSize(sizes.width, sizes.height);
      composer.setSize(sizes.width, sizes.height);
      // update resolution uniform in physical pixels
      const pr = Math.min(window.devicePixelRatio, 2);
      pixelatePass.uniforms.resolution.value.set(
        sizes.width * pr,
        sizes.height * pr,
      );
      composer.render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // Animate
    let raf = 0;
    const tick = () => {
      controls.update();
      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }


      // keep resolution in sync each frame (handles DPR/zoom changes)
      renderer.getDrawingBufferSize(dbSize);
      pixelatePass.uniforms.resolution.value.copy(dbSize);
      // update time for animated X positions
      const elapsed = clock.getElapsedTime();
      pixelatePass.uniforms.time.value = elapsed;
      pixelatePass.uniforms.hoverRadius.value = hoverRadius;

      if (pointerState.activity > 0) {
        pointerState.activity = Math.max(0, pointerState.activity - delta);
        if (pointerState.activity === 0) {
          pointerState.active = false;
        }
      }

      rotationVelocity.subVectors(rotationTarget, rotationCurrent).multiplyScalar(ROTATION_DAMPING);
      rotationCurrent.add(rotationVelocity);
      if (modelRoot) {
        modelRoot.rotation.x = rotationCurrent.x;
        modelRoot.rotation.y = rotationCurrent.y;
      }

      for (let i = trailEntries.length - 1; i >= 0; i -= 1) {
        const entry = trailEntries[i];
        entry.age += delta;

        if (entry.path.length > 0) {
          entry.segmentProgress += delta;
          while (
            entry.segmentProgress >= entry.segmentDuration &&
            entry.segmentIndex < entry.path.length
          ) {
            entry.segmentProgress -= entry.segmentDuration;
            entry.segmentIndex += 1;
            if (entry.segmentIndex >= entry.path.length) {
              entry.segmentIndex = entry.path.length - 1;
              entry.segmentProgress = entry.segmentDuration;
              break;
            }
          }

          const prevPos = entry.segmentIndex === 0
            ? { row: entry.startRow, col: entry.startCol }
            : entry.path[Math.max(0, entry.segmentIndex - 1)];
          const targetPos = entry.path[Math.max(0, entry.segmentIndex)];
          const t = entry.segmentDuration > 0
            ? THREE.MathUtils.clamp(entry.segmentProgress / entry.segmentDuration, 0, 1)
            : 1;

          entry.currentRow = THREE.MathUtils.lerp(prevPos.row, targetPos.row, t);
          entry.currentCol = THREE.MathUtils.lerp(prevPos.col, targetPos.col, t);
        }

        if (entry.age >= entry.lifetime + TRAIL_FADE_FLOOR) {
          trailEntries.splice(i, 1);
        }
      }

      hoverUniforms.hoverTrailActive.value = trailEntries.length;
      trailEntries.forEach((entry, index) => {
        if (index >= trailLength) return;
        hoverUniforms.hoverTrailPos.value[index].set(
          entry.currentCol,
          entry.currentRow,
        );
        hoverUniforms.hoverTrailAge.value[index] = THREE.MathUtils.clamp(
          entry.age / entry.lifetime,
          0,
          1,
        );
      });
      for (let i = trailEntries.length; i < trailLength; i += 1) {
        hoverUniforms.hoverTrailPos.value[i].set(-10, -10);
        hoverUniforms.hoverTrailAge.value[i] = 1;
      }
      hoverUniforms.hoverTrailPos.needsUpdate = true;
      hoverUniforms.hoverTrailAge.needsUpdate = true;
      updateHoverUniforms();

      composer.render();
      raf = window?.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerenter", handlePointerEnter);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      container.innerHTML = "";
    };
  }, [modelUrl, xIconUrl, hIconUrl, blockSize, gapSize, coinSize, xProb, hProb, hoverRadius, trailLength, trailLifetime, maxHoverRotation]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} >
    {status && (
      <div className="absolute left-2 top-24 px-2 py-1 text-xs bg-black text-white rounded-md"
      >
        {status}
      </div>
    )}

  </div>;
}

const tweakSceneMaterials = (root: THREE.Object3D) => {
  const emissiveMap: Record<string, string> = {
    bcbcbc: "#" + colors.white.getHexString(),
    "000000": "#" + colors.darkColor.getHexString(),
  };

  root.traverse((obj: THREE.Object3D) => {
    const material = (obj as any).material;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];

    materials.forEach((mat: any) => {
      const hex = mat?.emissive?.getHexString?.();
      if (!hex) return;
      let replacement = emissiveMap[hex];
      if ((obj as any).name === "main_body" && hex === colors.white.getHexString()) {
        replacement = "#" + colors.lightColor.getHexString();
      }

      if (replacement) {
        mat.emissive.set(replacement);
        mat.needsUpdate = true;
      }
    });
  });
};

const loadTexture = (loaderTex: THREE.TextureLoader, url?: string | null) => {
  if (!url) return null;
  const texture = loaderTex.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};
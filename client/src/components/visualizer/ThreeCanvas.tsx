import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeCanvasProps {
  roomImage: string;
  depthMap: string;
  countertopMask: string;
  stoneTexture: string;
  displacementScale?: number;
  onReady?: () => void;
}

const SceneBackground: React.FC<{ roomImage: string }> = ({ roomImage }) => {
  const { scene } = useThree();
  const texture = useTexture(roomImage);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    return () => { scene.background = null; };
  }, [scene, texture]);

  return null;
};

const CountertopOverlay: React.FC<{
  depthMap: string;
  countertopMask: string;
  stoneTexture: string;
  displacementScale: number;
}> = ({ depthMap, countertopMask, stoneTexture, displacementScale }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [depthTexture, maskTexture, stoneTextureMap] = useTexture([depthMap, countertopMask, stoneTexture]);

  useMemo(() => {
    depthTexture.wrapS = depthTexture.wrapT = THREE.ClampToEdgeWrapping;
    maskTexture.wrapS = maskTexture.wrapT = THREE.ClampToEdgeWrapping;
    stoneTextureMap.wrapS = stoneTextureMap.wrapT = THREE.RepeatWrapping;
    stoneTextureMap.repeat.set(4, 4);
    stoneTextureMap.colorSpace = THREE.SRGBColorSpace;
  }, [depthTexture, maskTexture, stoneTextureMap]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(16, 9, 256, 256), []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map: stoneTextureMap,
    displacementMap: depthTexture,
    displacementScale: displacementScale,
    alphaMap: maskTexture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.1,
  }), [stoneTextureMap, depthTexture, maskTexture, displacementScale]);

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};

const RestrictedOrbitControls: React.FC = () => {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.minPolarAngle = 1.2;
      controlsRef.current.maxPolarAngle = 1.8;
      controlsRef.current.minAzimuthAngle = -0.26;
      controlsRef.current.maxAzimuthAngle = 0.26;
      controlsRef.current.enableZoom = false;
      controlsRef.current.enablePan = false;
    }
  }, []);

  return <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} enableDamping dampingFactor={0.05} />;
};

const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ roomImage, depthMap, countertopMask, stoneTexture, displacementScale = 0.5, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (onReady) { const t = setTimeout(onReady, 100); return () => clearTimeout(t); } }, [onReady]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <SceneBackground roomImage={roomImage} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <CountertopOverlay depthMap={depthMap} countertopMask={countertopMask} stoneTexture={stoneTexture} displacementScale={displacementScale} />
        <RestrictedOrbitControls />
      </Canvas>
    </div>
  );
};

export default ThreeCanvas;

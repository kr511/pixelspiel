"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

const treePositions = [[-12, -8, 1], [-12, -3, .9], [-11, 6, 1.05], [-7, -10, .9], [0, -10, .95], [7, -10, 1.05], [12, -8, .9], [12, -2, 1], [12, 6, .92], [-11, 10, .85]] as const;
const flowers = [[-5, 3, "#fff2a8"], [-4.5, 3.5, "#f7a6b8"], [-6, 4, "#c5a7ff"], [7.5, 6.5, "#fff2a8"], [8.2, 6.1, "#f7a6b8"], [9, 7, "#ffffff"], [1, -7, "#c5a7ff"], [2, -7.5, "#fff2a8"], [3, -7, "#f7a6b8"]] as const;

function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return <RigidBody type="fixed" colliders="hull" position={[x, 0, z]}><group scale={scale}>
    <mesh castShadow position={[0, .75, 0]}><cylinderGeometry args={[.18, .25, 1.5, 7]} /><meshStandardMaterial color="#765037" /></mesh>
    <mesh castShadow position={[0, 1.85, 0]}><sphereGeometry args={[.85, 8, 6]} /><meshStandardMaterial color="#3f7a50" roughness={1} /></mesh>
    <mesh castShadow position={[-.42, 1.68, .12]}><sphereGeometry args={[.6, 8, 6]} /><meshStandardMaterial color="#57945e" roughness={1} /></mesh>
    <mesh castShadow position={[.42, 1.7, -.08]}><sphereGeometry args={[.62, 8, 6]} /><meshStandardMaterial color="#4b8957" roughness={1} /></mesh>
  </group></RigidBody>;
}

function Cottage() {
  return <RigidBody type="fixed" colliders="cuboid" position={[-5.5, 0, -4.8]}><group>
    <mesh castShadow receiveShadow position={[0, 1.35, 0]}><boxGeometry args={[6, 2.7, 4.5]} /><meshStandardMaterial color="#efd59c" roughness={.95} /></mesh>
    <mesh castShadow position={[0, 3.05, 0]} rotation={[0, Math.PI / 4, 0]} scale={[4.25, 1.15, 4.25]}><octahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#9e5645" roughness={1} /></mesh>
    <mesh castShadow position={[1.75, 3.65, .2]}><boxGeometry args={[.55, 1.6, .55]} /><meshStandardMaterial color="#6e493a" /></mesh>
    <mesh position={[0, 1.12, 2.27]}><boxGeometry args={[1.15, 2.05, .1]} /><meshStandardMaterial color="#7d5039" /></mesh>
    {[-1.85, 1.85].map((x) => <mesh key={x} position={[x, 1.55, 2.3]}><boxGeometry args={[1.15, 1.05, .1]} /><meshStandardMaterial color="#93cde0" emissive="#fff0bd" emissiveIntensity={.5} /></mesh>)}
    <mesh receiveShadow position={[0, .08, 2.65]}><boxGeometry args={[1.8, .16, 1]} /><meshStandardMaterial color="#c79765" /></mesh>
  </group></RigidBody>;
}

function CropPlot({ x, z, crop }: { x: number; z: number; crop: string }) {
  return <group position={[x, 0, z]}>
    <mesh receiveShadow position={[0, .025, 0]}><boxGeometry args={[4.6, .05, 3.3]} /><meshStandardMaterial color="#87543a" roughness={1} /></mesh>
    {[-1.5, -.5, .5, 1.5].flatMap((cx) => [-1, 0, 1].map((cz) => <group key={`${cx}-${cz}`} position={[cx, .1, cz]}>
      <mesh castShadow position={[0, .25, 0]}><cylinderGeometry args={[.035, .05, .5, 5]} /><meshStandardMaterial color="#397d45" /></mesh>
      <mesh castShadow position={[0, .53, 0]}><sphereGeometry args={[.18, 7, 5]} /><meshStandardMaterial color={crop} /></mesh>
    </group>))}
  </group>;
}

function Fence({ x, z, length, vertical = false }: { x: number; z: number; length: number; vertical?: boolean }) {
  const count = Math.floor(length / 1.4) + 1;
  return <group position={[x, 0, z]} rotation={[0, vertical ? Math.PI / 2 : 0, 0]}>
    {[.45, .9].map((y) => <mesh key={y} castShadow position={[0, y, 0]}><boxGeometry args={[length, .16, .14]} /><meshStandardMaterial color="#e4c18b" /></mesh>)}
    {Array.from({ length: count }, (_, i) => <mesh key={i} castShadow position={[-length / 2 + i * (length / (count - 1)), .62, 0]}><boxGeometry args={[.18, 1.35, .18]} /><meshStandardMaterial color="#c89760" /></mesh>)}
  </group>;
}

export function World() {
  return <>
    <color attach="background" args={["#b9db91"]} /><fog attach="fog" args={["#dce7b7", 28, 56]} />
    <hemisphereLight args={["#fff4d6", "#587552", 2.1]} />
    <directionalLight castShadow position={[-10, 18, 9]} intensity={2.8} color="#fff0c2" shadow-mapSize={[1024, 1024]} shadow-camera-far={60} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} />
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[14.5, .25, 12]} position={[0, -.25, 0]} />
      <mesh receiveShadow position={[0, -.3, 0]}><boxGeometry args={[29, .6, 24]} /><meshStandardMaterial color="#82ad61" roughness={1} /></mesh>
      <mesh receiveShadow position={[0, -.64, 0]}><boxGeometry args={[30, .2, 25]} /><meshStandardMaterial color="#5f814d" roughness={1} /></mesh>
      <CuboidCollider args={[.3, 2, 12]} position={[-14.5, 1.5, 0]} /><CuboidCollider args={[.3, 2, 12]} position={[14.5, 1.5, 0]} />
      <CuboidCollider args={[14.5, 2, .3]} position={[0, 1.5, -12]} /><CuboidCollider args={[14.5, 2, .3]} position={[0, 1.5, 12]} />
    </RigidBody>
    <mesh receiveShadow position={[2.2, .02, 1]}><boxGeometry args={[2.1, .05, 21]} /><meshStandardMaterial color="#d6bd7a" roughness={1} /></mesh>
    <mesh receiveShadow position={[-2, .025, 1.8]}><boxGeometry args={[11, .05, 1.8]} /><meshStandardMaterial color="#d6bd7a" roughness={1} /></mesh>
    <Cottage /><CropPlot x={7.4} z={-4.9} crop="#e8d357" /><CropPlot x={7.4} z={-.8} crop="#e47b62" />
    <RigidBody type="fixed" colliders="hull" position={[-6.5, .06, 6.8]}><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[3.1, 20]} /><meshStandardMaterial color="#74bfd0" roughness={.28} metalness={.08} /></mesh></RigidBody>
    {[[-8.8, 5.6], [-7.8, 4.7], [-4.5, 5.3], [-3.8, 7], [-5, 9], [-7.4, 9.2]].map(([x, z]) => <mesh key={`${x}-${z}`} castShadow position={[x, .2, z]} scale={[.65, .3, .5]}><dodecahedronGeometry args={[.55, 0]} /><meshStandardMaterial color="#859083" /></mesh>)}
    <Fence x={7.4} z={-7} length={7.5} /><Fence x={11.2} z={-2.9} length={8.2} vertical /><Fence x={7.4} z={1.2} length={7.5} />
    {treePositions.map(([x, z, scale]) => <Tree key={`${x}-${z}`} x={x} z={z} scale={scale} />)}
    {flowers.map(([x, z, color]) => <group key={`${x}-${z}`} position={[x, .14, z]}><mesh castShadow><sphereGeometry args={[.13, 6, 5]} /><meshStandardMaterial color={color} /></mesh><mesh position={[0, -.14, 0]}><cylinderGeometry args={[.025, .035, .3, 5]} /><meshStandardMaterial color="#3f7c45" /></mesh></group>)}
    <group position={[2.2, 0, 8.7]}><mesh castShadow position={[0, .85, 0]}><boxGeometry args={[.18, 1.7, .18]} /><meshStandardMaterial color="#6c4b32" /></mesh><mesh castShadow position={[.42, 1.35, 0]}><boxGeometry args={[.9, .65, .58]} /><meshStandardMaterial color="#b75445" /></mesh></group>
  </>;
}

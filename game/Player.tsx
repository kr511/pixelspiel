"use client";

import { RefObject, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import { CapsuleCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { pressedKeys, useInput } from "./input";
import { assetUrl } from "./assets";

export function Player({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const visual = useRef<THREE.Group>(null);
  const texture = useTexture(assetUrl("/characters/felice-v1.png"));

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    const input = useInput.getState();
    if (input.paused) {
      const velocity = body.linvel();
      body.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
      return;
    }

    const keyboardX = (pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight") ? 1 : 0) - (pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft") ? 1 : 0);
    const keyboardY = (pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp") ? 1 : 0) - (pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown") ? 1 : 0);
    let x = Math.abs(input.moveX) > 0.05 ? input.moveX : keyboardX;
    let y = Math.abs(input.moveY) > 0.05 ? input.moveY : keyboardY;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }

    const forward = new THREE.Vector3(-1, 0, -1).normalize();
    const right = new THREE.Vector3(1, 0, -1).normalize();
    const direction = forward.multiplyScalar(y).add(right.multiplyScalar(x));
    const velocity = body.linvel();
    const speed = 4.2;
    body.setLinvel({ x: direction.x * speed, y: velocity.y, z: direction.z * speed }, true);

    if (visual.current) {
      const moving = direction.lengthSq() > 0.01;
      const targetY = moving ? Math.sin(performance.now() * 0.012) * 0.035 : 0;
      visual.current.position.y = THREE.MathUtils.damp(visual.current.position.y, targetY, 13, delta);
    }
  });

  return (
    <RigidBody ref={bodyRef} position={[2, 1.15, 4]} colliders={false} enabledRotations={[false, false, false]} linearDamping={8} friction={1} canSleep={false}>
      <CapsuleCollider args={[0.46, 0.34]} />
      <group ref={visual}>
        <sprite scale={[1.55, 2.32, 1]} position={[0, 0.15, 0]}>
          <spriteMaterial map={texture} transparent alphaTest={0.05} depthWrite={false} toneMapped={false} />
        </sprite>
        <Html position={[0, 1.48, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <span className="player-name">Felice</span>
        </Html>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.78, 0]}>
        <circleGeometry args={[0.48, 24]} />
        <meshBasicMaterial color="#263129" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </RigidBody>
  );
}

"use client";

import { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

const desired = new THREE.Vector3();
const target = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(10, 14, 10);

export function CameraRig({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  useFrame(({ camera }, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    const position = body.translation();
    target.set(position.x, 0.25, position.z);
    desired.copy(target).add(cameraOffset);
    camera.position.lerp(desired, 1 - Math.exp(-5 * delta));
    camera.lookAt(target);
  });
  return null;
}

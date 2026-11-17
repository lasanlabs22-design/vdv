"use client";
import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
function Model({ color }: { color: string }) {
  const { scene } = useGLTF("/models/ferrari.glb", "/models/draco/");
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = o.receiveShadow = true; } });
    const body = copy.getObjectByName("body") as THREE.Mesh | undefined;
    if (body) body.material = new THREE.MeshPhysicalMaterial({ color, metalness: .75, roughness: .26, clearcoat: 1, clearcoatRoughness: .08 });
    const bounds = new THREE.Box3().setFromObject(copy), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const scale = 4.5 / Math.max(size.x, size.z);
    copy.scale.setScalar(scale); copy.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    return copy;
  }, [scene, color]);
  useEffect(() => () => { const body = model.getObjectByName("body") as THREE.Mesh; if (body && body.material instanceof THREE.Material) body.material.dispose(); }, [model]);
  return <primitive object={model} />;
}
export default function Vehicle({ color = "#d5d1c7" }: { color?: string }) { return <Suspense fallback={null}><Model color={color} /></Suspense>; }

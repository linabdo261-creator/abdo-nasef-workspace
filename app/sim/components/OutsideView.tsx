"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SimSnapshot } from "@/lib/sim";
import type { FrameListener, ViewMode } from "../useSimulation";

interface Props {
  registerFrameListener: (fn: FrameListener) => () => void;
  view: ViewMode;
  timeOfDay: "day" | "night";
}

interface AcBasis {
  forward: THREE.Vector3;
  up: THREE.Vector3;
  right: THREE.Vector3;
}

function basisFromState(roll: number, pitch: number, heading: number): AcBasis {
  const cphi = Math.cos(roll);
  const sphi = Math.sin(roll);
  const cth = Math.cos(pitch);
  const sth = Math.sin(pitch);
  const cpsi = Math.cos(heading);
  const spsi = Math.sin(heading);

  const forward = new THREE.Vector3(cth * spsi, sth, cth * cpsi);
  const dN = cphi * sth * cpsi + sphi * spsi;
  const dE = cphi * sth * spsi - sphi * cpsi;
  const dD = cphi * cth;
  const up = new THREE.Vector3(-dE, dD, -dN);
  const right = new THREE.Vector3().crossVectors(up, forward);
  return { forward, up, right };
}

export default function OutsideView({
  registerFrameListener,
  view,
  timeOfDay,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<ViewMode>(view);
  const todRef = useRef<"day" | "night">(timeOfDay);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    todRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.5, 80000);

    const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a6b3a, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(500, 800, 200);
    scene.add(sun);
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const skyDay = new THREE.Color(0x86b8e0);
    const skyNight = new THREE.Color(0x070b16);
    scene.background = skyDay.clone();
    scene.fog = new THREE.Fog(skyDay.clone(), 3000, 60000);

    const groundGeo = new THREE.PlaneGeometry(300000, 300000);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x4c7a3a,
      side: THREE.DoubleSide,
      fog: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.renderOrder = -1;
    scene.add(ground);

    const grid = new THREE.GridHelper(8000, 160, 0x355026, 0x355026);
    (grid.material as THREE.Material).opacity = 0.4;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const runwayGroup = new THREE.Group();
    const runwayMat = new THREE.MeshLambertMaterial({ color: 0x2b2b30 });
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(30, 1500), runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.02, 700);
    runwayGroup.add(runway);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f4 });
    for (let z = 60; z < 1400; z += 60) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 25), stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.04, z);
      runwayGroup.add(stripe);
    }
    [-14, 14].forEach((x) => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(1, 1500), stripeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.03, 700);
      runwayGroup.add(edge);
    });
    scene.add(runwayGroup);

    const runwayLights = new THREE.Group();
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
    for (let z = 0; z <= 1400; z += 100) {
      [-15, 15].forEach((x) => {
        const l = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 6, 6),
          lightMat,
        );
        l.position.set(x, 0.6, z);
        runwayLights.add(l);
      });
    }
    runwayLights.visible = false;
    scene.add(runwayLights);

    const refs = new THREE.Group();
    const refMat = new THREE.MeshLambertMaterial({ color: 0x8a8f98 });
    const rng = mulberry32(1234);
    for (let i = 0; i < 40; i++) {
      const h = 8 + rng() * 40;
      const box = new THREE.Mesh(new THREE.BoxGeometry(12, h, 12), refMat);
      const angle = rng() * Math.PI * 2;
      const dist = 300 + rng() * 4000;
      box.position.set(
        Math.cos(angle) * dist + (rng() - 0.5) * 200,
        h / 2,
        Math.sin(angle) * dist + 700,
      );
      refs.add(box);
    }
    scene.add(refs);

    const aircraft = buildAircraft();
    scene.add(aircraft);

    const tmpTarget = new THREE.Vector3();
    const acPos = new THREE.Vector3();

    const onFrame: FrameListener = (snap: SimSnapshot) => {
      const s = snap.state;
      acPos.set(s.east, s.altitude + 1.5, s.north);
      const { forward, up, right } = basisFromState(s.roll, s.pitch, s.heading);

      ground.position.x = acPos.x;
      ground.position.z = acPos.z;
      grid.position.set(
        Math.round(acPos.x / 50) * 50,
        0,
        Math.round(acPos.z / 50) * 50,
      );

      const m = new THREE.Matrix4().makeBasis(right, up, forward);
      aircraft.quaternion.setFromRotationMatrix(m);
      aircraft.position.set(s.east, s.altitude, s.north);

      if (viewRef.current === "cockpit") {
        aircraft.visible = false;
        camera.position.copy(acPos);
        camera.up.copy(up);
        tmpTarget.copy(acPos).add(forward);
        camera.lookAt(tmpTarget);
      } else {
        aircraft.visible = true;
        camera.up.set(0, 1, 0);
        camera.position
          .copy(acPos)
          .addScaledVector(forward, -28)
          .add(new THREE.Vector3(0, 8, 0));
        camera.lookAt(acPos);
      }

      const night = todRef.current === "night";
      const sky = night ? skyNight : skyDay;
      scene.background = sky;
      (scene.fog as THREE.Fog).color = sky;
      hemi.intensity = night ? 0.15 : 1.0;
      sun.intensity = night ? 0.05 : 1.2;
      ambient.intensity = night ? 0.08 : 0.3;
      runwayLights.visible = night;

      renderer.render(scene, camera);
    };

    const unregister = registerFrameListener(onFrame);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);
    onResize();

    return () => {
      unregister();
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      if (renderer.domElement.parentNode === mount)
        mount.removeChild(renderer.domElement);
    };
  }, [registerFrameListener]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

function buildAircraft(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.MeshLambertMaterial({ color: 0xdfe4ea });
  const accent = new THREE.MeshLambertMaterial({ color: 0x2b6cb0 });

  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 7), body);
  fuselage.position.z = 0.5;
  g.add(fuselage);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(11, 0.2, 1.6), accent);
  wing.position.set(0, 0.9, 0.5);
  g.add(wing);

  const htail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1), body);
  htail.position.set(0, 0.3, -3);
  g.add(htail);

  const vtail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 1.1), accent);
  vtail.position.set(0, 1, -3);
  g.add(vtail);

  const spinner = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.8, 12),
    accent,
  );
  spinner.rotation.x = Math.PI / 2;
  spinner.position.set(0, 0, 4.2);
  g.add(spinner);

  return g;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

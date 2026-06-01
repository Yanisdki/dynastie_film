<template>
  <div ref="canvasContainer" class="fixed inset-0 z-50 pointer-events-none"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasContainer = ref(null);

// Les "Shaders" : le secret de WebGL pour le chaos et la vitesse
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    
    // Calcul de la distance entre le pixel actuel et la souris
    float dist = distance(uv, uMouse);
    
    // Si on est proche de la souris, on crée le chaos aquatique
    if (dist < 0.25) {
      // Facteur d'intensité (plus proche = plus chaotique)
      float strength = (1.0 - dist / 0.05);
      
      // Superposition d'ondes de vagues en WebGL (Ultra rapide !)
      uv.x += sin(uv.y * 20.0 + uTime * 5.0) * 0.03 * strength;
      uv.y += cos(uv.x * 30.0 - uTime * 3.0) * 0.02 * strength;
    }
    
    // Mix entre l'image de fond et l'image révélée déformée
    vec4 tex1 = texture2D(uTexture1, vUv);
    vec4 tex2 = texture2D(uTexture2, uv);
    
    // On affiche l'image 2 (déformée) là où est la souris, sinon l'image 1
    float mask = smoothstep(0.25, 0.20, dist);
    gl_FragColor = mix(tex1, tex2, mask);
  }
`;

onMounted(() => {
  if (!canvasContainer.value) return;

  // 1. Initialisation de la scène WebGL
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  canvasContainer.value.appendChild(renderer.domElement);

  // 2. Chargement des textures (images)
  const textureLoader = new THREE.TextureLoader();
  const tex1 = textureLoader.load('https://images.unsplash.com/photo-1519741497674-611481863552?w=1200');
  const tex2 = textureLoader.load('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1200');

  // 3. Variables envoyées au Shader (Uniforms)
  const uniforms = {
    uTexture1: { value: tex1 },
    uTexture2: { value: tex2 },
    uMouse: { value: new THREE.Vector2(-10, -10) },
    uTime: { value: 0 }
  };

  // 4. Création du plan qui couvre l'écran
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 5. Gestion de la souris (coordonnées normalisées entre 0 et 1 pour WebGL)
  const handleMouseMove = (e) => {
    uniforms.uMouse.value.x = e.clientX / window.innerWidth;
    uniforms.uMouse.value.y = 1.0 - (e.clientY / window.innerHeight); // WebGL inverse l'axe Y
  };
  window.addEventListener('mousemove', handleMouseMove);

  // 6. Boucle d'animation
  const clock = new THREE.Clock();
  let animationFrameId;

  const animate = () => {
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };
  animate();

  // Nettoyage au démontage du composant
  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
    if (canvasContainer.value) canvasContainer.value.innerHTML = '';
  });
});
</script>
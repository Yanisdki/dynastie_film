document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('liquid-mask-container');
    const canvas = document.getElementById('liquid-canvas');
    if (!container || !canvas) return;

    // 1. PARAMÈTRES ET CONFIGURATION D'ORIGINE (Équivalent de MaskCursorSettings)
    const settings = {
        intensity: 0.15,
        scale: 0.10,
        viscosity: 0.99,
        decay: 0.97,
        distortionStrength: 0.01,
        revealSize: 50.5,
        edgeSoftness: 0.95,
        lightIntensity: 0.4,
        specularPower: 52.0
    };

    const RESOLUTION = 512;
    let baseImageAspect = 1;
    let revealImageAspect = 1;
    

    // Récupération des images Django
    const baseImgUrl = container.getAttribute('data-base-image');
    const revealImgUrl = container.getAttribute('data-reveal-image');

    // 2. SHADERS GLSL D'ORIGINE INTERPRÉTÉS EN TEXTE JS
    const quadVertexShader = `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `;

    const fluidUpdateShader = `
        uniform sampler2D uPrevState; uniform sampler2D uCurrentState; uniform vec2 uResolution;
        uniform float uViscosity; uniform float uDecay; uniform vec2 uMouse; uniform vec2 uPrevMouse;
        uniform float uRadius; uniform float uIntensity; uniform float uMouseVelocity;
        varying vec2 vUv;
        void main() {
            vec2 texel = 1.0 / uResolution;
            float current = texture2D(uCurrentState, vUv).r;
            float prev = texture2D(uPrevState, vUv).r;
            float left = texture2D(uCurrentState, vUv + vec2(-texel.x, 0.0)).r;
            float right = texture2D(uCurrentState, vUv + vec2(texel.x, 0.0)).r;
            float top = texture2D(uCurrentState, vUv + vec2(0.0, texel.y)).r;
            float bottom = texture2D(uCurrentState, vUv + vec2(0.0, -texel.y)).r;
            float neighbors = (left + right + top + bottom) * 0.25;
            float wave = neighbors * 2.0 - prev;
            wave = mix(current, wave, uViscosity); wave *= uDecay;
            if (uMouseVelocity > 0.0001) {
                float dist = distance(vUv, uMouse);
                float ripple = smoothstep(uRadius, 0.0, dist); ripple = pow(ripple, 2.0);
                for(float i = 0.0; i < 8.0; i++) {
                    float t = i / 8.0; vec2 trailPos = mix(uPrevMouse, uMouse, t);
                    float d = distance(vUv, trailPos); float trailRipple = smoothstep(uRadius * 0.7, 0.0, d);
                    ripple = max(ripple, pow(trailRipple, 2.0));
                }
                wave += ripple * uIntensity * min(uMouseVelocity * 10.0, 1.0);
            }
            gl_FragColor = vec4(wave, wave, wave, 1.0);
        }
    `;

    const maskVertexShader = `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `;

    const maskFragmentShader = `
        uniform sampler2D uBaseTexture; uniform sampler2D uRevealTexture; uniform sampler2D uDisplacement;
        uniform float uDistortionStrength; uniform float uRevealSize; uniform float uEdgeSoftness;
        uniform float uLightIntensity; uniform float uSpecularPower; uniform vec2 uResolution;
        uniform float uBaseImageAspect; uniform float uRevealImageAspect; uniform float uPlaneAspect;
        varying vec2 vUv;
        vec2 coverUv(vec2 uv, float imageAspect, float planeAspect) {
            vec2 ratio = vec2(min(planeAspect / imageAspect, 1.0), min(imageAspect / planeAspect, 1.0));
            return vec2(uv.x * ratio.x + (1.0 - ratio.x) * 0.5, uv.y * ratio.y + (1.0 - ratio.y) * 0.5);
        }
        vec3 calculateNormal(vec2 uv, float strength) {
            vec2 texel = 1.0 / uResolution;
            float left = texture2D(uDisplacement, uv + vec2(-texel.x, 0.0)).r;
            float right = texture2D(uDisplacement, uv + vec2(texel.x, 0.0)).r;
            float top = texture2D(uDisplacement, uv + vec2(0.0, texel.y)).r;
            float bottom = texture2D(uDisplacement, uv + vec2(0.0, -texel.y)).r;
            return normalize(vec3((left - right) * strength, (bottom - top) * strength, 1.0));
        }
        void main() {
            float displacement = texture2D(uDisplacement, vUv).r;
            vec3 normal = calculateNormal(vUv, 50.0);
            float normalDeviation = length(normal.xy);
            vec2 distortion = normal.xy * uDistortionStrength;
            vec2 baseUv = clamp(coverUv(vUv + distortion, uBaseImageAspect, uPlaneAspect), 0.001, 0.999);
            vec2 revealUv = clamp(coverUv(vUv + distortion, uRevealImageAspect, uPlaneAspect), 0.001, 0.999);
            vec4 baseColor = texture2D(uBaseTexture, baseUv);
            vec4 revealColor = texture2D(uRevealTexture, revealUv);
            float mask = clamp(smoothstep(0.0, uEdgeSoftness, displacement * uRevealSize), 0.0, 1.0);
            vec3 color = mix(baseColor.rgb, revealColor.rgb, mask);
            float rippleMask = smoothstep(0.01, 0.1, normalDeviation);
            vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0)), viewDir = vec3(0.0, 0.0, 1.0);
            float specular = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), uSpecularPower) * uLightIntensity * rippleMask;
            color += vec3(specular);
            color += vec3(pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0) * uLightIntensity * 0.15 * rippleMask);
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // 3. INITIALISATION DE LA SCÈNE THREE.JS NATIVE
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mainScene = new THREE.Scene();
    const mainCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 1);
    const floatType = renderer.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.FloatType;

    // Initialisation du système Ping-Pong pour la simulation du fluide
    const options = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: floatType};
    const renderTargets = [
        new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, options),
        new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, options),
        new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, options)
    ];
    let pingPongIndex = 0;

    const offscreenScene = new THREE.Scene();
    const offscreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Chargement des textures
    const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin('anonymous'); // <-- AJOUTE CETTE LIGNE ICI

        const baseTexture = textureLoader.load(baseImgUrl, (tex) => {
            baseImageAspect = tex.image.naturalWidth / tex.image.naturalHeight;
            maskMaterial.uniforms.uBaseImageAspect.value = baseImageAspect;
        });
        const revealTexture = textureLoader.load(revealImgUrl, (tex) => {
            revealImageAspect = tex.image.naturalWidth / tex.image.naturalHeight;
            maskMaterial.uniforms.uRevealImageAspect.value = revealImageAspect;
        });

    // Matériau de mise à jour du fluide (Ping-Pong Simulation)
    const fluidUpdateMaterial = new THREE.ShaderMaterial({
        vertexShader: quadVertexShader,
        fragmentShader: fluidUpdateShader,
        uniforms: {
            uPrevState: { value: null }, uCurrentState: { value: null },
            uResolution: { value: new THREE.Vector2(RESOLUTION, RESOLUTION) },
            uViscosity: { value: settings.viscosity }, uDecay: { value: settings.decay },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uRadius: { value: settings.scale }, uIntensity: { value: settings.intensity }, uMouseVelocity: { value: 0 }
        }
    });

    const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fluidUpdateMaterial);
    offscreenScene.add(quadMesh);

    // Matériau du rendu final (Le masque liquide)
    const maskMaterial = new THREE.ShaderMaterial({
        vertexShader: maskVertexShader,
        fragmentShader: maskFragmentShader,
        uniforms: {
            uBaseTexture: { value: baseTexture }, uRevealTexture: { value: revealTexture },
            uDisplacement: { value: renderTargets[0].texture }, uDistortionStrength: { value: settings.distortionStrength },
            uRevealSize: { value: settings.revealSize }, uEdgeSoftness: { value: settings.edgeSoftness },
            uLightIntensity: { value: settings.lightIntensity }, uSpecularPower: { value: settings.specularPower },
            uResolution: { value: new THREE.Vector2(RESOLUTION, RESOLUTION) },
            uBaseImageAspect: { value: baseImageAspect }, uRevealImageAspect: { value: revealImageAspect },
            uPlaneAspect: { value: width / height }
        }
    });

    const mainMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), maskMaterial);
    mainScene.add(mainMesh);

    // 4. SUIVI DES MOUVEMENTS DE LA SOURIS INTERNE AU BLOC
    const mouse = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, velocity: 0 };

    // Fonction unique pour mettre à jour les coordonnées
function updateMousePosition(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    mouse.x = (clientX - rect.left) / rect.width;
    mouse.y = 1.0 - ((clientY - rect.top) / rect.height);
}

// Événement Ordinateur
container.addEventListener('mousemove', (e) => {
    updateMousePosition(e.clientX, e.clientY);
});

// Événements Mobile (Touch)
container.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
        // On initialise le point précédent au même endroit pour éviter une fausse pointe de vélocité
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
    }
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
    }
}, {  });

    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width;
        mouse.y = 1.0 - ((e.clientY - rect.top) / rect.height);
    });

    // 5. BOUCLE D'ANIMATION DE RENDU (Équivalent de useFrame)
    function animate() {
        requestAnimationFrame(animate);

        // Calcul de la vélocité de la souris
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        mouse.velocity = Math.sqrt(dx * dx + dy * dy);

        // Injection des données dans les Shaders de simulation
        fluidUpdateMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
        fluidUpdateMaterial.uniforms.uPrevMouse.value.set(mouse.prevX, mouse.prevY);
        fluidUpdateMaterial.uniforms.uMouseVelocity.value = mouse.velocity;

        // Calcul des index de Ping-Pong
        const current = pingPongIndex;
        const prev = (current + 2) % 3;
        const next = (current + 1) % 3;

        fluidUpdateMaterial.uniforms.uPrevState.value = renderTargets[prev].texture;
        fluidUpdateMaterial.uniforms.uCurrentState.value = renderTargets[current].texture;

        // Étape A : Rendu de la physique du fluide hors-écran
        renderer.setRenderTarget(renderTargets[next]);
        renderer.render(offscreenScene, offscreenCamera);
        renderer.setRenderTarget(null);

        // Étape B : Application du déplacement fluide calculé sur le masque final
        maskMaterial.uniforms.uDisplacement.value = renderTargets[next].texture;
        maskMaterial.uniforms.uPlaneAspect.value = container.clientWidth / container.clientHeight;

        // Étape C : Rendu final à l'écran
        renderer.render(mainScene, mainCamera);

        // Sauvegarde de l'état de la souris pour la frame suivante
        pingPongIndex = next;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
    }

    // Gestion du redimensionnement dynamique propre
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        mainCamera.left = -w/2; mainCamera.right = w/2; mainCamera.top = h/2; mainCamera.bottom = -h/2;
        mainCamera.updateProjectionMatrix();
        mainMesh.geometry.dispose();
        mainMesh.geometry = new THREE.PlaneGeometry(w, h);

        // --- DÉTECTION DU REDIMENSIONNEMENT POUR LE BASCULEMENT DE CANVAS ---
        // Si le conteneur change de sa taille d'origine (par exemple inférieur à sa taille max)
        if (w < window.innerWidth * 0.9) { 
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });

    // Lancement
    animate();
});
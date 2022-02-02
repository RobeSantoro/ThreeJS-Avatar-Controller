import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class BasicWorldDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    //Add the resize event listener
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);
    
    //Set the camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 20, 10);

    // Create the scene
    this._scene = new THREE.Scene();
    
    // Add a directional light
    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.01;
    //light.shadow.mapsize.width = 2048;
    //light.shadow.mapsize.height = 2048;
    light.shadow.camera.near = 1.0;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 200;
    light.shadow.camera.right = -200;
    light.shadow.camera.top = 200;
    light.shadow.camera.bottom = -200;
    this._scene.add(light);

    // Add an ambient light    
    light = new THREE.AmbientLight(0xffffff, 0.5);
    this._scene.add(light);

    // Add the OrbitControls
    const controls = new OrbitControls(this._camera, this._threejs.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 10, 0);
    controls.update();

    // Add the Skybox Texture
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/textures/env/posx.jpg',
      './resources/textures/env/negx.jpg',
      './resources/textures/env/posy.jpg',
      './resources/textures/env/negy.jpg',
      './resources/textures/env/posz.jpg',
      './resources/textures/env/negz.jpg'      
    ]);
    this._scene.background = texture;

    this._LoadModel();
    this._RAF();
  }

  _LoadModel() {
    
    const DiffuseTexture = new THREE.TextureLoader()
    .load('./resources/textures/Avatar_Diffuse.jpg', (texture) => {
      texture.encoding = THREE.sRGBEncoding;
      texture.needsUpdate = true;
      texture.flipY = false;
    });

    const NormalTexture = new THREE.TextureLoader()
    .load('./resources/textures/Avatar_Normal.jpg', (texture) => {
      texture.needsUpdate = true;
      texture.flipY = false;

    });

    const loader = new GLTFLoader();
    loader.load('./resources/models/Avatar.glb', (gltf) => {
      
      const model = gltf.scene;

      // Cast shadows
      model.traverse((child) => {
        if (child.isMesh) {
        
          child.castShadow = true;
          child.material.map = DiffuseTexture;
          child.material.normalMap = NormalTexture;
        }
      });
      // Scale the model
      model.scale.set(10, 10, 10);

      // Add the model to the scene
      this._scene.add(gltf.scene);
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame(() => {
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    })
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});
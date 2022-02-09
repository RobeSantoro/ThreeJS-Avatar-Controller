import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CharacterController } from './modules/CharacterController';
import { ThirdPersonCamera } from './modules/ThirdPersonCamera';
class World {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    /////////////////////////////////////////////////////////////////////////////////////// Set the WebGL Renderer

    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    this._canvas = this._threejs.domElement
    document.body.appendChild(this._canvas);

    //Add the resize event listener
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    // Create the scene
    this._scene = new THREE.Scene();

    ////////////////////////////////////////////////////////////////////////////////////// Set the Character Camera
    const fov = 50;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100.0;
    this._CharacterCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // Add a Camera Helper to the Character Camera
    const cameraHelper = new THREE.CameraHelper(this._CharacterCamera);
    this._scene.add(cameraHelper);

    ///////////////////////////////////////////////////////////////////////////////////////// Set the Debug Camera
    this._DebugCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._DebugCamera.position.set(0, 3, 5);
    this._DebugCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Set the Orbit Controls for the Debug Camera
    this._OrbitControls = new OrbitControls(this._DebugCamera, this._canvas);

    /////////////////////////////////////////////////////////////////////////////////////// Add a directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(-2, 4, 3);    
    dirLight.castShadow = true;

    const shadowSize = 2;

    dirLight.shadow.mapsize = new THREE.Vector2(2048, 2048);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    dirLight.shadow.bias = 0.001;

    // Create a Group to hold the directional light
    this._dirLightGroup = new THREE.Group();
    this._dirLightGroup.add(dirLight);
    this._dirLightGroup.add(dirLight.target);

    this._scene.add(this._dirLightGroup);

    // Add a shadow helper
    const helper = new THREE.CameraHelper(dirLight.shadow.camera);
    this._scene.add(helper);

    // Add an ambient light    
    const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
    this._scene.add(ambLight);

    ///////////////////////////////////////////////////////////////////////////////////////////////// Add the Cubemap
    const loader = new THREE.CubeTextureLoader();
    const envTexture = loader.load([
      './resources/textures/env/right.jpeg',  // posx
      './resources/textures/env/left.jpeg',   // negx
      './resources/textures/env/top.jpeg',    // posy
      './resources/textures/env/bottom.jpeg', // negy
      './resources/textures/env/front.jpeg',   // negz
      './resources/textures/env/back.jpeg',   // posz
    ]);
    envTexture.encoding = THREE.sRGBEncoding;
    this._scene.background = envTexture;

    // Add GroundPlane
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0x485511,
        roughness: 0.8,
        metalness: 0.1,
        envMap: envTexture,
        envMapIntensity: 0.25 }));

    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    // Add grid
    const grid = new THREE.GridHelper(50, 100, 0xffffff, 0xffffff);    
    this._scene.add(grid);

    // Add axes
    const axes = new THREE.AxesHelper(1);
    this._scene.add(axes);

    
    this._mixers = [];
    this._previousRAF = null;
    
    const params = {
      camera: this._CharacterCamera,
      scene: this._scene,
    }

    this._controls = new CharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._CharacterCamera,
      target: this._controls      
    });    

    this._RAF();
  }

  _OnWindowResize() {
    this._CharacterCamera.aspect = window.innerWidth / window.innerHeight;
    this._CharacterCamera.updateProjectionMatrix();
    this._DebugCamera.aspect = window.innerWidth / window.innerHeight;
    this._DebugCamera.updateProjectionMatrix();

    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      if (this._controls._input._keys.debug === true) {
        this._threejs.render(this._scene, this._DebugCamera);       
      } else {
        this._threejs.render(this._scene, this._CharacterCamera);        
      }

      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {

    const timeElapsedS = timeElapsed * 0.001;

    if (this._mixers) { this._mixers.map(m => m.update(timeElapsedS)); }

    if (this._controls) { this._controls.Update(timeElapsedS); }

    this._thirdPersonCamera.Update(timeElapsedS);   
    
    this._dirLightGroup.position.set(this._controls._position.x, this._controls._position.y, this._controls._position.z);

    
    

  }
};


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
  console.log(_APP);
});

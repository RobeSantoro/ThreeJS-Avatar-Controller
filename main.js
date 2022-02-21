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
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100.0;
    this._CharacterCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // Add a Camera Helper to the Character Camera
    this.CameraHelper = new THREE.CameraHelper(this._CharacterCamera);
    this.CameraHelper.visible = false;

    this._scene.add(this.CameraHelper);

    ////////////////////////////////////////////////////////////////////////////////////////// Set the Debug Camera
    this.DebugCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.DebugCamera.position.set(0, 3, 5);
    this.DebugCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Set the Orbit Controls for the Debug Camera
    this.OrbitControls = new OrbitControls(this.DebugCamera, this._canvas);

    /////////////////////////////////////////////// Add a directional light, Shadow Camera Helper and Ambient Light

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
    this.ShadowCameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
    this.ShadowCameraHelper.visible = false;
    this._scene.add(this.ShadowCameraHelper);

    // Add an ambient light    
    const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
    this._scene.add(ambLight);

    /////////////////////////////////////////////////////////////////////////////////////////////// Add the Cubemap

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

    /////////////////////////////////////////////////////////////////////////////////////////////// Add GroundPlane
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

    //////////////////////////////////////////////////////////// Add the Character Controller and ThirdPersonCamera
    this._mixers = [];
    this._previousRAF = null;    

    this._CharacterController = new CharacterController({ scene: this._scene, canvas: this._canvas });
    this._thirdPersonCamera = new ThirdPersonCamera({ camera: this._CharacterCamera, target: this._CharacterController });


    this._RAF();
  }

  _OnWindowResize() {

    this._CharacterCamera.aspect = window.innerWidth / window.innerHeight;
    this._CharacterCamera.updateProjectionMatrix();

    this.DebugCamera.aspect = window.innerWidth / window.innerHeight;
    this.DebugCamera.updateProjectionMatrix();

    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      //console.log(Math.floor(t / 1000));
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      if (this._CharacterController._input._keys.debug === true) { // Render Debug Camera

        this._threejs.render(this._scene, this.DebugCamera);

      } else { // Render Character Camera

        this._threejs.render(this._scene, this._CharacterCamera);        
      }

      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {

    const timeElapsedS = timeElapsed * 0.001;

    if (this._mixers) { this._mixers.map(m => m.update(timeElapsedS)); }

    if (this._CharacterController) { this._CharacterController.Update(timeElapsedS); }

    if (this._thirdPersonCamera) { this._thirdPersonCamera.Update(timeElapsedS); } 
    
    this._dirLightGroup.position
    .set( this._CharacterController._position.x,
          this._CharacterController._position.y,
          this._CharacterController._position.z);

    
    if (this._CharacterController._input._keys.debug === true) { // Activate Debug Helpers

      this.CameraHelper.visible = true;
      this.ShadowCameraHelper.visible = true;

    } else {      

      this.CameraHelper.visible = false;   
      this.ShadowCameraHelper.visible = false;
    }        

  }
};


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
  console.log(_APP);
});

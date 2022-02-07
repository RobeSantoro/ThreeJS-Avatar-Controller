import * as THREE from 'three';
import { CharacterController } from './modules/CharacterController';

class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(-0.35, 2.5, -2);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 0, 5);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);

  }

};

class World {
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

    this._canvas = this._threejs.domElement
    document.body.appendChild(this._canvas);

    //Add the resize event listener
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    //Set the camera
    const fov = 50;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    //this._camera.position.set(0, 1, 3);

    // Create the scene
    this._scene = new THREE.Scene();

    // Add a directional light
    let dirLight = new THREE.DirectionalLight(0xffffff, 1.0);

    dirLight.position.set(2, 2, 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapsize = new THREE.Vector2(2048, 2048);
    this._scene.add(dirLight);

    // Add an ambient light    
    const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
    this._scene.add(ambLight);

    // Add the Cubemap
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
      new THREE.MeshStandardMaterial({ color: 0x485511, roughness: 0.1, metalness: 0.1, envMap: envTexture, envMapIntensity: 0.25 }));
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
      camera: this._camera,
      scene: this._scene,
    }

    this._controls = new CharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls      
    });    

    this._RAF();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }



  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {

    const timeElapsedS = timeElapsed * 0.001;

    if (this._mixers) { this._mixers.map(m => m.update(timeElapsedS)); }

    if (this._controls) { this._controls.Update(timeElapsedS); }

    this._thirdPersonCamera.Update(timeElapsedS);   
    
  

  }
};


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
});

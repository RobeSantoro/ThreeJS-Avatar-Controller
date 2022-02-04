import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
/* RTFKT      const AVATAR_PATH = 'https://d1a370nemizbjq.cloudfront.net/b45f2152-d224-4ffb-9ecc-662993cb9866.glb';*/
/* LONG HAIR  const AVATAR_PATH = 'https://d1a370nemizbjq.cloudfront.net/cdca2fdd-f8e0-4501-b4e3-b435d0a7a63c.glb';*/
/* LOCAL */   const AVATAR_PATH = './resources/models/Avatar.glb';

/* ANIMATIONS */
const ANIMATIONS_PATH = '/resources/animations/Animations.glb';

class CharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
};

class CharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1.0, 0.25, 10.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._position = new THREE.Vector3();

    this._animations = {};
    this._input = new CharacterControllerInput();
    this._stateMachine = new CharacterFSM(new CharacterControllerProxy(this._animations));

    this._LoadModelandAnims();
  }

  _LoadModelandAnims() {

    this.loaded = false;

    // Load the glTF model from AVATAR_PATH
    const DRACO_LOADER = new DRACOLoader()
    DRACO_LOADER.setDecoderPath('./decoder/')

    const AvatarModelLoader = new GLTFLoader();
    AvatarModelLoader.setDRACOLoader(DRACO_LOADER);

    AvatarModelLoader.load(AVATAR_PATH, (gltf) => {

      const AvatarModel = gltf.scene;

      // Traverse and Cast Shadow
      AvatarModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          //child.receiveShadow = true;
        }
      });

      this._target = AvatarModel;
      this._params.scene.add(this._target);

      // Load the animations form Animations.glb file     
      const gltfLoader = new GLTFLoader()
      gltfLoader.setDRACOLoader(DRACO_LOADER)

      gltfLoader.load(ANIMATIONS_PATH, (gltf) => {

        this._mixer = new THREE.AnimationMixer(this._target);

        const _OnLoad = (animName, anim) => {
          const clip = anim;
          const action = this._mixer.clipAction(clip);

          this._animations[animName] = {
            clip: clip,
            action: action,
          };

        };

        _OnLoad('idle', gltf.animations[0]);
        _OnLoad('walk', gltf.animations[1]);
        _OnLoad('run', gltf.animations[2]);
        _OnLoad('dance', gltf.animations[3]);
        _OnLoad('walkback', gltf.animations[4]);
        _OnLoad('jump', gltf.animations[5]);
        _OnLoad('jumprun', gltf.animations[6]);


        //console.log(this._target);
        //console.log(this._animations);
        //console.log(this._mixer);

        this.loaded = true;
        this._stateMachine.SetState('idle');

        //this._mixer.action.play();
      });

    });


  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
    if (!this._target) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
      Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(3.0);
    }

    if (this.loaded == true) {
      if (this._stateMachine._currentState.Name == 'dance') {
        acc.multiplyScalar(0.0);
      }
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    this._position.copy(controlObject.position);

    if (this._input._keys.space) {
      //console.log('jump'); //////////////////////////////////////////////////////////

    }

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
};

class CharacterControllerInput {
  constructor() {
    this._Init();
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      effe: false,
      shift: false,
      space: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 70: // f
        this._keys.effe = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 70: // f
        this._keys.effe = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
    }
  }
};

class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
      //console.log(this._currentState.Name);
    }
  }
};

class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('run', RunState);
    this._AddState('dance', DanceState);
    this._AddState('walkback', WalkBackState);
    this._AddState('jump', JumpState);
    this._AddState('jumprun', JumpRunState);
  }
};

class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() { }
  Exit() { }
  Update() { }
};

class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'idle';
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations['idle'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.2, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {
  }

  Update(_, input) {
    if (input._keys.forward) {
      this._parent.SetState('walk');
    } else if (input._keys.backward) {
      this._parent.SetState('walkback');
    } else if (input._keys.space) {
      this._parent.SetState('jump');
    } else if (input._keys.effe) {
      this._parent.SetState('dance');
    }
  }
};

class DanceState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    }
  }

  get Name() {
    return 'dance';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['dance'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('idle');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['dance'].action;
    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {
  }
};

class JumpState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    }
  }

  get Name() {
    return 'jump';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['jump'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.1, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('idle');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['jump'].action;
    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {
  }
};

class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walk';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['walk'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};

class WalkBackState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walkback';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['walkback'].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.backward) {
      if (input._keys.shift) {
        //this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};

class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'run';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['run'].action;

    if (prevState) {

      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      curAction.enabled = true;

      if (prevState.Name == 'walk') {
        const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;

      } else if (prevState.Name == 'jumprun') {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
        curAction.crossFadeFrom(prevAction, 1, true);
        curAction.play();

      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);

      }

      curAction.crossFadeFrom(prevAction, 0.1, true);
      curAction.play();

    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      if (input._keys.space) {
        this._parent.SetState('jumprun');
      }
      return;
    }

    this._parent.SetState('idle');
  }
};

class JumpRunState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    }
  }

  get Name() {
    return 'jumprun';
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations['jumprun'].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.1, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('run');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['jumprun'].action;
    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {
  }
};

class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;
    this._mouseCoords = params.mouseCoords;

    console.log(this._mouseCoords);
    // 

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(0, 1.5, -2);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 1.5, 5);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);

    //console.log(this._mouseCoords)

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

    // Add the mouse move event listener
    this._canvas.addEventListener('mousemove', (e) => {
      this._OnMouseMove(e);
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
    this._mouseCoords = { x: window.innerWidth/2, y: window.innerHeight/2 };
    
    //console.log(this._mouseCoords);

    const params = {
      camera: this._camera,
      scene: this._scene,
      mouse: this._mouseCoords,
    }

    this._controls = new CharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
      mouse: this._mouseCoords,
    });

    console.log(this._mouseCoords);
    

    this._RAF();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _OnMouseMove(e) {
    this._mouseCoords = { x: e.clientX, y: e.clientY };
    console.log(this._mouseCoords);
    return this._mouseCoords;
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
  //console.log(_APP);
});

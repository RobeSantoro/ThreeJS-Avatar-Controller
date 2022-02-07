import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CharacterFSM } from './CharacterFSM';
import { CharacterControllerProxy } from './CharacterControllerProxy';
import { CharacterControllerInput } from './CharacterControllerInput';

/* RTFKT      const AVATAR_PATH = 'https://d1a370nemizbjq.cloudfront.net/b45f2152-d224-4ffb-9ecc-662993cb9866.glb';*/
/* LONG HAIR  const AVATAR_PATH = 'https://d1a370nemizbjq.cloudfront.net/cdca2fdd-f8e0-4501-b4e3-b435d0a7a63c.glb';*/
/* LOCAL */   const AVATAR_PATH = './resources/models/Avatar.glb';

/* ANIMATIONS */
const ANIMATIONS_PATH = '/resources/animations/Animations.glb';

export class CharacterController {
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
    const DRACO_LOADER = new DRACOLoader();
    DRACO_LOADER.setDecoderPath('./decoder/');

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
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(DRACO_LOADER);

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

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
}

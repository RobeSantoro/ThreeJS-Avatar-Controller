import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(params) {

    this._CharacterCamera = params.camera;
    this._target = params.target;   

    this._currentPosition = new THREE.Vector3();
    //this._currentLookat = new THREE.Vector3();

    
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(-0.35, 2, -2);
    //idealOffset.applyQuaternion(this._target.Rotation);
    //idealOffset.add(this._target.Position);
    return idealOffset;
  }

/*   _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 0, 5);
    idealLookat.applyQuaternion(this._target.Rotation);
    idealLookat.add(this._target.Position);
    return idealLookat;
  } */

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    //const idealLookat = this._CalculateIdealLookat();

    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    //this._currentLookat.lerp(idealLookat, t);  

    this._CharacterCamera.position.copy(this._currentPosition);
    //this._CharacterCamera.lookAt(this._currentLookat);

  }
}

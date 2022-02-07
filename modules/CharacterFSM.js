import { FiniteStateMachine } from './FiniteStateMachine';
import * as STATE from './States';

export class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }
  
  _Init() {
    this._AddState('idle', STATE.IdleState);
    this._AddState('walk', STATE.WalkState);
    this._AddState('run', STATE.RunState);
    this._AddState('dance', STATE.DanceState);
    this._AddState('walkback', STATE.WalkBackState);
    this._AddState('jump', STATE.JumpState);
    this._AddState('jumprun', STATE.JumpRunState);
  }
}

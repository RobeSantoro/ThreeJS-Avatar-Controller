export class CharacterControllerInput {
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
      debug: false,
    };

    this._mouse = {
      x: 0,
      y: 0
    }

    // Listen for key presses
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    
    // Listen for mouse movement
    document.addEventListener('mousemove', (e) => this._onMouseMove(e), false);   
    
  }

  _onMouseMove(event) {
    this._mouse.x = event.clientX;
    this._mouse.y = event.clientY;
  }
  
  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
      case 38: // up
        this._keys.forward = true;
        break;
      case 65: // a
      case 37: // left
        this._keys.left = true;
        break;
      case 83: // s
      case 40: // down
        this._keys.backward = true;
        break;
      case 68: // d
      case 39: // right
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
      case 86: // v
        if (this._keys.debug == true) {
          this._keys.debug = false;
        } else {          
          this._keys.debug = true;
        }
        break;      
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
      case 38: // up
        this._keys.forward = false;
        break;
      case 65: // a
      case 37: // left
        this._keys.left = false;
        break;
      case 83: // s
      case 40: // down
        this._keys.backward = false;        
        break;
      case 68: // d
      case 39: // right
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

}

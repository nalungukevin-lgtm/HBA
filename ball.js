// HBA v4 — full-viewport 3D stage: basketball (drop-in) + backboard (deferred, isolated),
// scroll-choreographed via window.__heroP (0..1 runway progress set by the page).
(function(){
  if (!window.THREE || !THREE.OBJLoader) { console.warn('three/OBJLoader missing'); return; }
  var canvas = document.getElementById('ball-canvas'); if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0x55606e, 0.5));
  scene.add(new THREE.HemisphereLight(0x9fb0c8, 0x241a12, 0.55));
  var key = new THREE.DirectionalLight(0xfff3e6, 1.7); key.position.set(-4,5,5);  scene.add(key);
  var rim = new THREE.DirectionalLight(0xff7a30, 1.1); rim.position.set(4.5,1.5,-4); scene.add(rim);
  var fl  = new THREE.DirectionalLight(0x7fc8ff, 0.35); fl.position.set(-3,-2,3);   scene.add(fl);

  // ---- procedural environment (so the metal frame reflects light, not black) ----
  (function(){
    try{
      var c=document.createElement('canvas'); c.width=128; c.height=64; var g=c.getContext('2d');
      var grd=g.createLinearGradient(0,0,0,64);
      grd.addColorStop(0,'#252a35'); grd.addColorStop(.46,'#2e333f'); grd.addColorStop(.54,'#22262f'); grd.addColorStop(1,'#0a0b0f');
      g.fillStyle=grd; g.fillRect(0,0,128,64);
      g.fillStyle='rgba(255,170,100,.85)'; g.beginPath(); g.ellipse(34,17,13,8,0,0,7); g.fill();
      g.fillStyle='rgba(120,200,255,.5)';  g.beginPath(); g.ellipse(98,20,9,6,0,0,7);  g.fill();
      g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(0,3,128,3);
      var t=new THREE.CanvasTexture(c); t.mapping=THREE.EquirectangularReflectionMapping;
      var pm=new THREE.PMREMGenerator(renderer); pm.compileEquirectangularShader();
      scene.environment=pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose();
    }catch(e){ console.warn('env build failed', e); }
  })();

  var maxA = renderer.capabilities.getMaxAnisotropy();
  var L = new THREE.TextureLoader();
  function T(u,s){ var t=L.load(u); if(s) t.encoding=THREE.sRGBEncoding; t.anisotropy=maxA; return t; }

  // ---- basketball ----
  var ballMat = new THREE.MeshPhysicalMaterial({
    map:T('models/textures/bball-col-1k.jpg',true), roughnessMap:T('models/textures/bball-rough-1k.jpg'),
    aoMap:T('models/textures/bball-ao-1k.jpg'), normalMap:T('models/textures/bball-nrm-1k.jpg'),
    color:0xffffff, metalness:0, roughness:1, clearcoat:.22, clearcoatRoughness:.5, envMapIntensity:.5 });

  var BALL_SCALE=1, ball=null;
  var RS=1, RSd=1;                              // responsive scale: bank tableau (RS) + descent ball floor (RSd)
  function clampn(v,a,b){ return Math.min(Math.max(v,a),b); }
  new THREE.OBJLoader().load('models/basketball-ball.obj', function(o){
    o.traverse(function(c){ if(c.isMesh){ c.material=ballMat; if(c.geometry.attributes.uv&&!c.geometry.attributes.uv2) c.geometry.setAttribute('uv2',c.geometry.attributes.uv); } });
    var b=new THREE.Box3().setFromObject(o); o.position.sub(b.getCenter(new THREE.Vector3()));
    var sz=b.getSize(new THREE.Vector3()); BALL_SCALE=1.42/(Math.max(sz.x,sz.y,sz.z)||1); o.scale.setScalar(BALL_SCALE);
    ball=new THREE.Group(); ball.add(o); scene.add(ball);
  });

  // ---- backboard: deferred + fully isolated so a failure can never stop the ball ----
  var board=null, boardMat=null;
  // tunables (exposed for quick iteration)
  var BOARD = window.__boardCfg = { x:3.75, y:-0.10, z:-0.30, rotY:-Math.PI/2, rotX:0, rotZ:0, target:3.35 };
  function loadBoard(){
    try{
      boardMat=new THREE.MeshPhysicalMaterial({
        map:T('models/textures/bb-col-1k.jpg',true), roughnessMap:T('models/textures/bb-rough-1k.jpg'),
        metalnessMap:T('models/textures/bb-metal-1k.jpg'), aoMap:T('models/textures/bb-ao-1k.jpg'),
        normalMap:T('models/textures/bb-nrm-1k.jpg'),
        color:0xffffff, metalness:1, roughness:1, envMapIntensity:1.15 });
      new THREE.OBJLoader().load('models/basketball-backboard.obj', function(o){
        try{
          o.traverse(function(c){ if(c.isMesh){ c.material=boardMat; if(c.geometry.attributes.uv&&!c.geometry.attributes.uv2) c.geometry.setAttribute('uv2',c.geometry.attributes.uv); } });
          var b=new THREE.Box3().setFromObject(o); o.position.sub(b.getCenter(new THREE.Vector3()));
          var sz=b.getSize(new THREE.Vector3()); o.scale.setScalar(BOARD.target/(Math.max(sz.x,sz.y,sz.z)||1));
          board=new THREE.Group(); board.add(o);
          board.rotation.set(BOARD.rotX, BOARD.rotY, BOARD.rotZ);
          board.position.set(BOARD.x, BOARD.y, BOARD.z);
          board.visible=false;
          scene.add(board);
        }catch(e){ console.warn('board setup failed', e); }
      }, undefined, function(err){ console.warn('board OBJ failed', err); });
    }catch(e){ console.warn('board load failed', e); }
  }
  function deferBoard(){ (window.requestIdleCallback||function(f){setTimeout(f,800);})(loadBoard); }
  if(document.readyState==='complete') setTimeout(deferBoard,500);
  else window.addEventListener('load', function(){ setTimeout(deferBoard,500); });

  // ---- helpers ----
  var lastW=0, lastH=0;
  function resize(){
    // Size from the canvas's ACTUAL displayed box (clientWidth/Height), not window.innerWidth/Height.
    // This keeps the drawing buffer matched to what's on screen, avoiding the stretched ball caused by
    // scrollbar width and the mobile URL-bar (where CSS 100vh != window.innerHeight).
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    lastW=w; lastH=h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(w,h,false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
    RS = clampn(camera.aspect/1.78, 0.32, 1.12);   // <1 on portrait: shrinks the whole bank so it stays in frame & proportional to the vw-scaled wordmark
    RSd= clampn(camera.aspect/1.78, 0.72, 1.12);   // descent ball stays prominent on narrow screens
  }
  function eob(t){ var n=7.5625,d=2.75; if(t<1/d)return n*t*t; if(t<2/d){t-=1.5/d;return n*t*t+.75;} if(t<2.5/d){t-=2.25/d;return n*t*t+.9375;} t-=2.625/d; return n*t*t+.984375; }
  function seg(p,a,b){ return Math.min(Math.max((p-a)/(b-a),0),1); }
  function eo(t){ return 1-Math.pow(1-t,3); }

  // ---- choreography waypoints (world space) ----
  var REST_X=0, REST_Y=0.95;                 // nestled in the NXT·GEN gap
  var CONTACT={ x:2.15, y:0.82, z:0.85 };    // banks off the white panel, sitting just in front of its face
  var EXIT   ={ x:-0.10, y:-2.15, z:1.15 };   // comes forward + down so it clears the rim/net on the way out
  var SH_CONTACT=0.52;                        // shrink fraction reached by contact (smaller vs the board)
  var SH_EXIT=0.60;                           // total shrink reached on exit

  var t0=null, lastY=0, spin=0;
  function frame(ts){
    requestAnimationFrame(frame);
    // keep the canvas matched to its displayed size every frame (fixes stretch on first paint,
    // device rotation, and the mobile URL-bar collapsing on the first scroll)
    if(canvas.clientWidth && (canvas.clientWidth!==lastW || canvas.clientHeight!==lastH)) resize();
    var nm=document.body.classList.contains('no-motion');
    var V=window.innerHeight||1;
    var f=(window.scrollY||0)/V;     // scroll in viewport-heights (beats are absolute, not runway-relative)
    var sy=window.scrollY||0;

    if(ball){
      if(t0===null) t0=ts;
      var ip=Math.min((ts-t0)/1300,1);

      // effective waypoints — the whole bank tableau scales with aspect (RS); REST stays put
      var cX=CONTACT.x*RS, cY=CONTACT.y*RS, cZ=CONTACT.z*RS;
      var eX=EXIT.x*RS, eZ=EXIT.z*RSd, eY=EXIT.y;   // eY fixed so the ball always rides off the bottom

      var docMax=(document.documentElement.scrollHeight-V)/V;   // last scroll position in viewport-heights
      var rEnd=Math.max(docMax-0.05, 1.9);
      var approach=eo(seg(f,0.95,1.45));   // REST → CONTACT (descends while still pinned)
      var bankT  =seg(f,1.45,1.62);        // squash window (board bank)
      var rebound=seg(f,1.62,rEnd);        // CONTACT → EXIT, linear across the whole rest of the page
      var sq=nm?0:Math.sin(Math.PI*Math.min(Math.max(bankT,0),1));  // 0→1→0 impact pulse

      var bx,by,bz,scl;
      var restScl=BALL_SCALE*RS;                 // ball fills the vw-scaled wordmark gap at rest
      var contactScl=BALL_SCALE*RS*(1-SH_CONTACT);
      var descentScl=BALL_SCALE*RSd*(1-SH_EXIT); // stays prominent while riding to the bottom
      if(rebound<=0){
        // approach: ease toward the board with a shallow bounce arc
        bx=REST_X + approach*(cX-REST_X);
        by=REST_Y + approach*(cY-REST_Y) - 0.35*RS*Math.sin(Math.PI*approach);
        bz=approach*cZ;
        scl=restScl + approach*(contactScl-restScl);
      } else {
        // rebound: kick off the board, come forward (toward viewer) and ride the scroll down, clearing the rim/net
        var rf=eo(Math.min(rebound*1.6,1));   // pull forward quickly so it never clips the rim
        bx=cX + rebound*(eX-cX);
        by=cY + rebound*(eY-cY);
        bz=cZ + rf*(eZ-cZ);
        scl=contactScl + rebound*(descentScl-contactScl);
      }
      if(!nm && ip<1 && sy<8 && f<0.02){ bx=REST_X; by=13+(REST_Y-13)*eob(ip); bz=0; scl=restScl; }  // drop-in on load

      ball.position.set(bx,by,bz);
      // squash against the board (subtle flatten along x, slight bulge y) at contact
      ball.scale.set(scl*(1-0.10*sq), scl*(1+0.07*sq), scl*(1+0.03*sq));

      var dv=sy-lastY; lastY=sy; spin += (Math.min(Math.abs(dv)*0.0008,0.06)-spin)*0.15;
      ball.rotation.y += nm?0:(0.006+spin+sq*0.04);
      ball.rotation.x = 0.12 + (approach+rebound)*0.20;
      ball.rotation.z = rebound*0.45;      // tumble as it rebounds away
    }

    if(board){
      var bo=nm?1:seg(f,1.05,1.40);                  // fades in by sliding from off-right (after dashboard gone)
      var bout=nm?0:seg(f,1.78,2.15);                // slides back out as the ball rebounds away
      board.visible = bo>0.001;
      board.scale.setScalar(RS);                     // board scales with the tableau
      var rec=nm?0:Math.sin(Math.PI*seg(f,1.45,1.62)); // recoil pulse on impact
      board.position.x = BOARD.x*RS + ((1-bo)*2.0 + rec*0.10 + bout*2.6)*RS;
      board.position.y = BOARD.y*RS; board.position.z = BOARD.z*RS;
      board.rotation.set(BOARD.rotX, BOARD.rotY + rec*0.04, BOARD.rotZ);
    }

    renderer.render(scene,camera);
  }
  window.addEventListener('resize', resize, {passive:true});
  resize(); requestAnimationFrame(frame);
})();

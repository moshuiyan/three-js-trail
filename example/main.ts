import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  WebGLRenderer,
  Raycaster,
  Vector3,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  PlaneGeometry,
  Vector2,
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import { Trail } from '../src';
import TrailParticle from '../src/TrailParticle';
import { CustomTrailMaterial } from './CustomTrailMaterial';
import trail from './textures/trail.png';
import particle from './textures/particle.png';
import { CustomTrailParticleMaterial } from './CustomTrailParticleMaterial';
//  效果上来说，就是粒子的位置不变的时候，看不出什么，粒子的位置发生变化了，并且主动更新一些东西就能看到尾巴。封装到位。
async function main() {
  const canvas = document.getElementById('canvas')!;
  const textureLoader = new TextureLoader();
  const trailTexture = await textureLoader.loadAsync(trail);
  const particleTexture = await textureLoader.loadAsync(particle);
  trailTexture.generateMipmaps = false;
  particleTexture.generateMipmaps = false;

  const scene = new Scene();
  scene.background = new Color(0x123456);

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(innerWidth, innerHeight);

  const camera = new PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 20);

  // const control = new OrbitControls(camera, canvas);
  // control.enableDamping = true;

  const YAxis = new Object3D();
  const ZAxis = new Object3D();
  const box = new Mesh(new BoxGeometry(1, 1), new MeshLambertMaterial({ color: 0xffffff }));
  const trailBox = new Trail(undefined, new CustomTrailMaterial(trailTexture,new Color(0xffd700)));
  // 或者
  // const trailBox = new Trail(
  //   undefined,
  //   new TrailMaterial({
  //     uniforms: { map: { value: trailTexture } },
  //     vertexShader: CustomTrailMaterial.VERT,
  //     fragmentShader: CustomTrailMaterial.FRAG,
  //    }),
  // );
  const trailLine = new Trail({ time: 0.5 }, new CustomTrailMaterial(trailTexture));
  // const trailLine = new Trail({ time: 0.5 });
  // trailLine.material.wireframe = true;
  trailLine.position.y = 0;
   window.addEventListener('keydown', (e)=> {
    console.log(e.key,e.code)
     switch (e.key) {
      case 'ArrowUp':
        trailLine.position.y +=.5;
        
        break;
     
        case 'ArrowDown':
          trailLine.position.y -=.5;
          
          break;
       
      case 'ArrowRight':
        trailLine.position.x +=.5;
        
        break;
     
        case 'ArrowLeft':
          trailLine.position.x -=.5;
          
          break;
       
      default:
        break;
     }
   })
   const mousePos = new Vector3();

   const posGeo = new BufferGeometry() ;
   posGeo.setAttribute('position', new Float32BufferAttribute([0,0,0], 3) );
   const pMat=  new PointsMaterial({ 
    sizeAttenuation: false ,
    size:10
   })
   const mouseV2 =  new Vector2();
   const points = new Points(posGeo, pMat) ;
   const intersectplane  = new Mesh( new PlaneGeometry(1000000,100000,1,1)) ;
   intersectplane.updateMatrixWorld = function (force) {
    this.quaternion.copy( camera.quaternion) ;
    this.matrixWorld.compose(this.position,this.quaternion,this.scale) ;
   }
   intersectplane.visible = false ;
   const raycaster  = new Raycaster() ;
   
   scene.add( points , intersectplane);

  const trailParticle = new TrailParticle(
    { size: 2, velocity: 1 },
    new CustomTrailParticleMaterial(particleTexture, new Color(0xffd0c1)),
  );

  ZAxis.add( trailBox, trailParticle);

  console.log(ZAxis);
  
  scene.add(ZAxis, box ,trailLine );
  scene.add(new AmbientLight(0xffffff, 0.2));
  camera.add(new DirectionalLight(0xffffff, 1));

  canvas.addEventListener('pointermove', (e)=>{
    const { offsetX,offsetY} = e ;
    const { clientHeight, clientWidth}  = canvas ;
    const x = offsetX / clientWidth * 2  - 1 , y  =1 - offsetY /clientHeight * 2;
    mouseV2.set( x,y) ;
    raycaster.setFromCamera(mouseV2,camera );
    const intersects =  raycaster.intersectObject( intersectplane) ;
    if( intersects.length){ 
        const  point = intersects[0].point;
        trailLine.emitting = true;
        state = State.Doing;
        // box.position.copy( point);
        ZAxis.position.copy(point);

    }
    // mousePos.set ( x,y,.998) ; // 不是太理解这种会受到相机旋转的影响
    // console.log(...mousePos);
    // mousePos.unproject(camera)
    
    // ZAxis.position .copy( mousePos);
   
 })
  new OrbitControls(camera, canvas);
  mousePos.project(camera) ;
  console.log(...mousePos);
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  enum State {
    Doing,
    Pending,
  }
  const speed = 0.04;
  let idleCount = 0;
  let state = State.Doing;
  const renderLoop = () => {

        // idleCount++;//它原本是用于重置的，我不需要了
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
    // setTimeout(renderLoop, 256);
  };

  renderLoop();
}
main();

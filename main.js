import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/gltfloader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { FontLoader } from "./js/FontLoader";
import { TextGeometry } from "./js/TextGeometry";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import moon from "/Assets/Images/moon.jpg";
import earth from "/Assets/Images/EarthTexture.jpg";
import asteroid1 from "/Assets/Images/asteroid1.jpg";
import asteroid2 from "/Assets/Images/asteroid2.jpg";
import jupiter from "/Assets/Images/JupiterTexture.jpg";
import mars from "/Assets/Images/MarsTexture.jpg";
import mercury from "/Assets/Images/MercuryTexture.png";
import neptune from "/Assets/Images/NeptuneTexture.jpg";
import pluto from "/Assets/Images/plutoTexture.jpg";
import saturn from "/Assets/Images/SaturnTexture.jpg";
import saturnRing from "/Assets/Images/saturnRing.png";
import uranusRing from "/Assets/Images/uranusRing.png";
import sun from "/Assets/Images/SunTexture.jpg";
import uranus from "/Assets/Images/uranusTexture.jpg";
import venus from "/Assets/Images/venusTexture.jpg";

import * as dat from "dat.gui";

const starsTexture = "/Assets/Images/stars.jpg";

var ASSETS_LOADED = false;
var SHOW_TEXT = false;
let scene, camera, renderer, root, gui, world, vehicle, carBody;
const textureLoader = new THREE.TextureLoader();

let Sun,
  Mercury,
  Venus,
  Earth,
  Mars,
  Jupiter,
  Saturn,
  Uranus,
  Neptune,
  Pluto,
  Moon;

init();
render();
initPhysics();

function init() {
  // Scene
  gui = new dat.GUI();
  scene = new THREE.Scene();

  //Methods
  LoadEnviornment();
  LoadObject();

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  //adding skubox
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  scene.background = cubeTextureLoader.load([
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
    starsTexture,
  ]);

  //adding sun
  const sunTexture = new THREE.TextureLoader().load(sun);
  const sunGeometry = new THREE.SphereGeometry(70, 30, 30);
  // Shader material for emissive effect
  var customMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { type: "c", value: new THREE.Color(0xe6620f) },
      globTexture: { type: "t", value: sunTexture },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
    side: THREE.DoubleSide,
  });
  Sun = new THREE.Mesh(sunGeometry, customMaterial);
  Sun.position.set(0, 0, 600);
  scene.add(Sun);
  console.log(Sun);

  //adding Earth
  const earthTexture = new THREE.TextureLoader().load(earth);
  const earthGeometry = new THREE.SphereGeometry(30, 30, 30);
  const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
  Earth = new THREE.Mesh(earthGeometry, earthMaterial);
  Earth.position.set(200, 0, 350);
  scene.add(Earth);

  //adding moon
  const moonTexture = new THREE.TextureLoader().load(moon);
  const moonGeometry = new THREE.SphereGeometry(10, 30, 30);
  const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
  Moon = new THREE.Mesh(moonGeometry, moonMaterial);
  Moon.position.set(44, 0, 10);

  // scene.add(Moon);
  Earth.add(Moon);

  //loading planets
  LoadPlanets();
  LoadAsteroids();

  //load text
  LoadText();

  //light
  const sunLight = new THREE.PointLight(0xeeeb64, 3);
  sunLight.position.set(0, 0, 0);
  Sun.add(sunLight);

  //directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 0, 0);
  scene.add(directionalLight);
  // Camera
  let screenWidth = window.innerWidth,
    screenHeight = window.innerHeight,
    viewAngle = 60,
    nearDistance = 0.1,
    farDistance = 5000;
  camera = new THREE.PerspectiveCamera(
    viewAngle,
    screenWidth / screenHeight,
    nearDistance,
    farDistance
  );
  camera.position.z = -100;
  camera.position.y = 56;

  camera.lookAt(scene.position);
  camera.rotation.x = -2.6;
  scene.add(camera);

  // Listeners
  window.addEventListener("keydown", OnKeyDown, false);
  window.addEventListener("keyup", OnKeyUp, false);

  //when window is resized
  window.addEventListener("resize", onResize);
}

// add physics world
function initPhysics() {
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -30, 0), // m/s²
  });

  //cannonDebugger = new CannonDebugger(scene, world);
  // Create a static plane for the ground
  const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
  world.addBody(groundBody);

  AddSpaceshipPhysics();
}

// This function create physics representation
// of the space ship
function AddSpaceshipPhysics() {
  carBody = new CANNON.Body({
    mass: 10,
    position: new CANNON.Vec3(0, 6, 0),
    shape: new CANNON.Box(new CANNON.Vec3(2, 0.5, 2)),
  });

  vehicle = new CANNON.RigidVehicle({
    chassisBody: carBody,
  });

  const mass = 1;
  const axisWidth = 5;
  const wheelShape = new CANNON.Sphere(1);
  const wheelMaterial = new CANNON.Material("wheel");
  const down = new CANNON.Vec3(0, 1, 0);

  const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial });
  wheelBody1.addShape(wheelShape);
  wheelBody1.angularDamping = 0.6;
  vehicle.addWheel({
    body: wheelBody1,
    position: new CANNON.Vec3(-2, 0, axisWidth),
    axis: new CANNON.Vec3(1, 0, 0),
    direction: down,
  });

  const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial });
  wheelBody2.addShape(wheelShape);
  wheelBody2.angularDamping = 0.6;
  vehicle.addWheel({
    body: wheelBody2,
    position: new CANNON.Vec3(-2, 0, -axisWidth),
    axis: new CANNON.Vec3(1, 0, 0),
    direction: down,
  });

  const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial });
  wheelBody3.addShape(wheelShape);
  wheelBody3.angularDamping = 0.6;
  vehicle.addWheel({
    body: wheelBody3,
    position: new CANNON.Vec3(2, 0, axisWidth),
    axis: new CANNON.Vec3(1, 0, 0),
    direction: down,
  });

  const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial });
  wheelBody4.addShape(wheelShape);
  wheelBody4.angularDamping = 0.6;
  vehicle.addWheel({
    body: wheelBody4,
    position: new CANNON.Vec3(2, 0, -axisWidth),
    axis: new CANNON.Vec3(1, 0, 0),
    direction: down,
  });

  vehicle.addToWorld(world);
}

//create Asteroid
function createAsteroid(size, position, texture) {
  //Asteroid geometry, material and texture
  const asteroidGeometry = new THREE.SphereGeometry(size, 8, 3);
  const asteroidMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.5,
    map: textureLoader.load(texture),
  });
  const mesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
  mesh.position.set(position.x, position.y, position.z);
  Sun.add(mesh);
  return { mesh };
}

//load asteroids
function LoadAsteroids() {
  createAsteroid(4, new THREE.Vector3(-49, 0, -163), asteroid1);
  createAsteroid(2, new THREE.Vector3(83, 0, 216), asteroid2);
  createAsteroid(4.5, new THREE.Vector3(110, 0, -335), asteroid1);
  createAsteroid(2, new THREE.Vector3(-115, 0, 282), asteroid2);
  createAsteroid(4, new THREE.Vector3(-194, 0, 348), asteroid1);
  createAsteroid(2, new THREE.Vector3(150, 0, -110), asteroid2);
  createAsteroid(3, new THREE.Vector3(17, 0, -123), asteroid1);
  createAsteroid(5.5, new THREE.Vector3(-89, 0, 110), asteroid2);
}

//create planet
function createPlanet(size, texture, posx, posy, posz, ring) {
  //Creates Planet body and texture
  const geo = new THREE.SphereGeometry(size, 30, 30);
  const mat = new THREE.MeshStandardMaterial({
    map: textureLoader.load(texture),
  });
  const mesh = new THREE.Mesh(geo, mat);
  const obj = new THREE.Object3D();
  obj.add(mesh);

  //Creates Ring of planet
  if (ring) {
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      32
    );
    const ringMat = new THREE.MeshBasicMaterial({
      map: textureLoader.load(ring.texture),
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    obj.add(ringMesh);
    ringMesh.position.x = posx;
    ringMesh.position.y = posy;
    ringMesh.position.z = posz;
    ringMesh.rotation.x = -0.5 * Math.PI;
  }
  scene.add(obj);

  // Adjusts the position of the planet
  mesh.position.x = posx;
  mesh.position.y = posy;
  mesh.position.z = posz;

  //returns tha planet
  return { mesh, obj };
}
//to load text
function LoadText() {
  addText("Mercury", 20, 0, -15, 7, Mercury.mesh);
  addText("Mars", 27, 0, -30, 10, Mars.mesh);
  addText("Venus", 27, 0, -20, 8, Venus.mesh);
  addText("Jupiter", 27, 0, -30, 12, Jupiter.mesh);
  addText("Saturn", 27, 0, -50, 15, Saturn.mesh);
  addText("Uranus", 27, 0, -50, 10, Uranus.mesh);
  addText("Neptune", 27, 0, -30, 8, Neptune.mesh);
  addText("Pluto", 20, 0, -20, 8, Pluto.mesh);
  addText("Earth", 27, 0, -30, 12, Earth);
}

//loading planets
function LoadPlanets() {
  Mercury = createPlanet(15, mercury, 80, 0, 60);
  Pluto = createPlanet(12, pluto, -128, 0, 1300);
  Mars = createPlanet(23, mars, -200, 0, 150);
  Venus = createPlanet(18, venus, -150, 0, 700);
  Jupiter = createPlanet(32, jupiter, 660, 0, 840);
  Saturn = createPlanet(45, saturn, 250, 0, 950, {
    innerRadius: 45,
    outerRadius: 66,
    texture: saturnRing,
  });

  //Tilts Saturn's rings
  Saturn.obj.children[1].rotateY(0.2);
  Uranus = createPlanet(32, uranus, -300, 0, 1140, {
    innerRadius: 32,
    outerRadius: 46,
    texture: uranusRing,
  });

  Neptune = createPlanet(20, neptune, -350, 0, 450);
}
// Loads environment map
function LoadEnviornment() {
  new RGBELoader()
    .setPath("/Assets/Textures/")
    .load("venice_sunset.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });
}

// Load object
function LoadObject() {
  const loader = new GLTFLoader();
  loader.load(
    "/Assets/Spaceship/scene.gltf",
    (gltf) => {
      // called when the resource is loaded

      root = gltf.scene;
      root.scale.set(0.003, 0.003, 0.003);
      scene.add(root);

      ASSETS_LOADED = true;
      document.querySelector(".loading-pulse").classList.add("hide");
      document.querySelector(".speed-text").style.opacity = 1;
    },
    (xhr) => {
      // called while loading is progressing
      console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
      // called when loading has errors
      console.error("An error happened", error);
    }
  );
}

// apply force to the spaceship to move forward
function OnKeyDown(event) {
  const maxSteerVal = Math.PI / 24;
  const maxForce = 60;

  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.setWheelForce(maxForce, 0);
      vehicle.setWheelForce(maxForce, 2);
      break;

    case "s":
    case "ArrowDown":
      vehicle.setWheelForce(-maxForce * 0.7, 0);
      vehicle.setWheelForce(-maxForce * 0.7, 2);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(maxSteerVal, 0);
      vehicle.setSteeringValue(maxSteerVal, 2);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(-maxSteerVal, 0);
      vehicle.setSteeringValue(-maxSteerVal, 2);
      break;
    case "Enter":
      HandleRedirect();
      break;
  }
}

// reset spaceship force to zero when key is released
function OnKeyUp(event) {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.setWheelForce(0, 0);
      vehicle.setWheelForce(0, 2);
      break;

    case "s":
    case "ArrowDown":
      vehicle.setWheelForce(0, 0);
      vehicle.setWheelForce(0, 2);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 2);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 2);
      break;
  }
}

function HandleRedirect() {
  if (ASSETS_LOADED) {
    if (CheckDistance(Mercury.mesh.position, 60)) {
      window
        .open(
          "https://solarsystem.nasa.gov/planets/mercury/overview/",
          "_blank"
        )
        .focus();
    } else if (CheckDistance(Venus.mesh.position, 70)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/venus/overview/";
    } else if (CheckDistance(Earth.position, 90)) {
      window
        .open("https://solarsystem.nasa.gov/planets/earth/overview/", "_blank")
        .focus();
    } else if (CheckDistance(Mars.mesh.position, 70)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/mars/overview/";
    } else if (CheckDistance(Jupiter.mesh.position, 100)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/jupiter/overview/";
    } else if (CheckDistance(Saturn.mesh.position, 110)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/saturn/overview/";
    } else if (CheckDistance(Uranus.mesh.position, 70)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/uranus/overview/";
    } else if (CheckDistance(Neptune.mesh.position, 70)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/neptune/overview/";
    } else if (CheckDistance(Pluto.mesh.position, 70)) {
      window.location.href =
        "https://solarsystem.nasa.gov/planets/dwarf-planets/pluto/overview/";
    }
  }
}

// Sync Physics with Three.js
function SyncThree() {
  root.position.copy(carBody.position);
  root.quaternion.copy(carBody.quaternion);
}

///Updates speed
function UpdateSpeed() {
  document.querySelector(".speed-text").innerHTML =
    "Speed: " + Math.round(vehicle.getWheelSpeed(0) * 2.5);
}
//Update camera to move with spaceship
function UpdateCamera() {
  //Ideal distance of spaceship from camera
  const cameraOffset = new THREE.Vector3(0, 130, -100);

  const objectPosition = new THREE.Vector3();
  root.getWorldPosition(objectPosition);
  //Moves Camera
  camera.position.copy(objectPosition).add(cameraOffset);
}
function CalculateDistance() {
  if (
    CheckDistance(Mercury.mesh.position, 60) ||
    CheckDistance(Earth.position, 90) ||
    CheckDistance(Venus.mesh.position, 70) ||
    CheckDistance(Mars.mesh.position, 70) ||
    CheckDistance(Jupiter.mesh.position, 100) ||
    CheckDistance(Saturn.mesh.position, 110) ||
    CheckDistance(Uranus.mesh.position, 70) ||
    CheckDistance(Neptune.mesh.position, 70) ||
    CheckDistance(Pluto.mesh.position, 70)
  ) {
    SHOW_TEXT = true;
  } else {
    SHOW_TEXT = false;
  }
}

function CheckDistance(position, distance) {
  return root.position.distanceTo(position) < distance;
}
// Render Loop
function render() {
  requestAnimationFrame(render);

  //Only render if spaceship is loaded
  if (ASSETS_LOADED) {
    // Update Physics
    SyncThree();
    //Update camera to move with spaceship
    UpdateCamera();
    //Updates speed on screen
    UpdateSpeed();

    // Run the simulation independently of framerate every 1 / 60 ms
    world.fixedStep();

    //Rotates the planets
    Earth.rotateY(0.004);
    Sun.rotateY(0.001);
    Mercury.mesh.rotateY(-0.007);
    Jupiter.mesh.rotateY(0.005);
    Saturn.obj.children[0].rotateY(0.005);
    Saturn.obj.children[1].rotateZ(0.007);
    Uranus.mesh.rotateY(0.01);
    Neptune.mesh.rotateY(0.009);
    Pluto.mesh.rotateY(0.002);
    Mars.mesh.rotateY(0.008);
    Venus.mesh.rotateY(0.007);

    CalculateDistance();
    SHOW_TEXT
      ? (document.getElementById("redirection-text").style.display = "block")
      : (document.getElementById("redirection-text").style.display = "none");
    renderer.render(scene, camera);
  }
}

// On resize
function onResize() {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

//function to add 3d text using fontLoader
function addText(text, x, y, z, size, parent) {
  const fontLoader = new FontLoader();
  fontLoader.load("/Assets/Fonts/Roboto_Bold.json", function (font) {
    //Change size
    const geometry = new TextGeometry(text, {
      font: font,
      size: size,
      height: 1.5,
    });

    //Change color
    // const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { type: "c", value: new THREE.Color(0x00ead3) },
      },
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShaderText").textContent,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(0, 3, 0);
    //making text children of the planet
    parent.add(mesh);
    mesh.position.set(x, y, z);

    //to return mesh to use in other functions
    return { mesh };
  });
}

const { createCanvas } = require("canvas");
const THREE = global.THREE = require("three");
const fs = require("fs");
const glContext = require('gl')(1, 1); //headless-gl
async function Virtuealize_Canvas() {

    this.width = 512
    this.height = 512
    const canvas = createCanvas(this.width, this.height, { alpha: true })
    canvas.addEventListener = function (event, func, bind_) { };

    const renderer = new THREE.WebGLRenderer({ canvas, context: glContext });
    renderer.setSize(this.width, this.height);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    camera.position.z = 11

    const ambientLight = new THREE.AmbientLight('white', 0.8);
    scene.add(ambientLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    renderer.render(scene, camera);

    const buffer = canvas.toBuffer();

    fs.writeFileSync(__dirname + `image.png`, buffer)

}

Virtuealize_Canvas();
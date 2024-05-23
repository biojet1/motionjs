import * as THREE from 'three';
import * as m3 from '3motion';

const W = 200;
const H = 200;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00

    , flatShading: true,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);


THREE.Euler.prototype.num$ = function (name) {
    console.log(`num_prop(${name})`);
    // return 24;
    return new m3.NumericProperty(this, name);

}
const camZ = new m3.NumericProperty(camera.position, 'z');
// camera.position.z = 5;

// console.log(cube.rotation.constructor);

// console.log(Object.keys(cube.rotation));

// const roX = NumericProp(cube.rotation, 'x');

// cube.rotation.num_prop('x')
// cube.rotation.kf();
// console.log(THREE.Euler);
// camZ.key_value();

const cuber = cube.rotation.num$('y');
// cuber.rotation
// function animate() {
//     requestAnimationFrame(animate);
//     // cube.material
//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;

//     renderer.render(scene, camera);
// }
camZ.key_value(0, 4)
camZ.key_value(60 * 2, 5)
camZ.key_value(60 * 3, 3)
camZ.repeat_count = -1;
camZ.bounce = true;

const root = new m3.Root();

const tr1 = root.track(0);
tr1.run(m3.Step(
    [
        { t: 0, cuber: 0 },
        { dur: 2, cuber: 0.5 },
        { dur: 2, cuber: -1 },
        { dur: 2, cuber: 0 },
    ]
    , { cuber }
));


cuber.repeat_count = 2;
cuber.bounce = true;
// console.log(cuber);
m3.animate(60, 0, 60 * 10, function (f) {
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    cuber.owner[cuber.name] = cuber.get_value(f);
    camZ.owner[camZ.name] = camZ.get_value(f);


    renderer.render(scene, camera);
})

// animate();
import * as THREE from 'three';
import * as m3 from '3motion';
import { OrbitControls } from 'three/addons/controls/OrbitControls'

const canvas = document.querySelector('#c');
const W = 544;
const H = 306;
const light = new THREE.AmbientLight(0x404040);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000);
const material2 = new THREE.MeshLambertMaterial({
    color: 0xFF0000,    // red (can also use a CSS color string here)
    flatShading: true,
});

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(W, H);
// document.body.appendChild(renderer.domElement);


{
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
}
{
    let grid = new THREE.GridHelper(10, 10);
    scene.add(grid);
}

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00

});
const cube = new THREE.Mesh(geometry, material2);
scene.add(cube);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);
directionalLight.position.set(0, 1, 1);
THREE.Euler.prototype.num$ = function (name) {
    // console.log(`num_prop(${name})`);
    // return 24;
    return new m3.NumericProperty(this, name);

}
const camZ = new m3.NumericProperty(camera.position, 'z');
const iro1 = new m3.ColorProperty(cube.material, 'color');

const cuber = cube.rotation.num$('y');
camera.position.z = 5;
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

root.track(0).run(m3.Step(
    [
        { t: 0, iro1: 'white' },
        { dur: 2, iro1: 'blue' },
        { dur: 2, iro1: 'red' },
        { dur: 1, iro1: 'green' },
    ]
    , { iro1 }
));

iro1.bounce = true;
iro1.repeat_count = 5;

cuber.repeat_count = -1;
cuber.bounce = true;
// root.update(10000000);
console.log(root.prop_set);

m3.animate({
    fps: 60,
    end: 30 * 60,
    // frames: 5 * 60,
    update: function (f) {
        // console.log(`f:${f} ${iro1.get_value(200).getHexString()}`);

        // cuber.owner[cuber.name] = cuber.get_value(f);
        // camZ.owner[camZ.name] = camZ.get_value(f);
        // iro1.owner[iro1.name] = iro1.get_value(f);
        root.update(f);

        // renderer.clear();
        renderer.render(scene, camera);
    }
}

)

// animate();
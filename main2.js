// Three.js - Primitives
// from https://threejs.org/manual/examples/primitives.html

import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import * as m3 from "3motion";
import { To, Seq, Rel, Add } from "3motion";
import CameraControls from 'camera-controls';


function main(renderer) {


    const fov = 40;
    const aspect = 640 / 360; //
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 120;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);




    {
        const color = 0xffffff;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    {
        const color = 0xffffff;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(1, -2, -4);
        scene.add(light);
    }

    const objects = [];
    const spread = 15;

    function addObject(x, y, obj) {
        obj.position.x = x * spread;
        obj.position.y = y * spread;

        scene.add(obj);
        objects.push(obj);
    }

    function createMaterial() {
        const material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
        });

        const hue = Math.random();
        const saturation = 1;
        const luminance = 0.5;
        material.color.setHSL(hue, saturation, luminance);

        return material;
    }

    function addSolidGeometry(x, y, geometry) {
        const mesh = new THREE.Mesh(geometry, createMaterial());
        addObject(x, y, mesh);
        return mesh;
    }

    function addLineGeometry(x, y, geometry) {
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        const mesh = new THREE.LineSegments(geometry, material);
        addObject(x, y, mesh);
        return mesh;
    }

    const box = (() => {
        const width = 8;
        const height = 8;
        const depth = 8;
        return addSolidGeometry(-2, 2, new THREE.BoxGeometry(width, height, depth));
    })();

    const circle = (() => {
        const radius = 7;
        const segments = 24;
        return addSolidGeometry(-1, 2, new THREE.CircleGeometry(radius, segments));
    })();

    const cone = (() => {
        const radius = 6;
        const height = 8;
        const segments = 16;
        return addSolidGeometry(
            0,
            2,
            new THREE.ConeGeometry(radius, height, segments)
        );
    })();

    const cylin = (() => {
        const radiusTop = 4;
        const radiusBottom = 4;
        const height = 8;
        const radialSegments = 12;
        return addSolidGeometry(
            1,
            2,
            new THREE.CylinderGeometry(
                radiusTop,
                radiusBottom,
                height,
                radialSegments
            )
        );
    })();

    const dode = (() => {
        const radius = 7;
        return addSolidGeometry(2, 2, new THREE.DodecahedronGeometry(radius));
    })();

    const exct = (() => {
        const shape = new THREE.Shape();
        const x = -2.5;
        const y = -5;
        shape.moveTo(x + 2.5, y + 2.5);
        shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
        shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
        shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
        shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
        shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
        shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

        const extrudeSettings = {
            steps: 2,
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelSegments: 2,
        };

        return addSolidGeometry(
            -2,
            1,
            new THREE.ExtrudeGeometry(shape, extrudeSettings)
        );
    })();

    const icos = (() => {
        const radius = 7;
        return addSolidGeometry(-1, 1, new THREE.IcosahedronGeometry(radius));
    })();

    const lath = (() => {
        const points = [];
        for (let i = 0; i < 10; ++i) {
            points.push(new THREE.Vector2(Math.sin(i * 0.2) * 3 + 3, (i - 5) * 0.8));
        }

        return addSolidGeometry(0, 1, new THREE.LatheGeometry(points));
    })();

    const octa = (() => {
        const radius = 7;
        return addSolidGeometry(1, 1, new THREE.OctahedronGeometry(radius));
    })();

    const klein = (() => {
        /*
        from: https://github.com/mrdoob/three.js/blob/b8d8a8625465bd634aa68e5846354d69f34d2ff5/examples/js/ParametricGeometries.js
    
        The MIT License
    
        Copyright © 2010-2018 three.js authors
    
        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:
    
        The above copyright notice and this permission notice shall be included in
        all copies or substantial portions of the Software.
    
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
        THE SOFTWARE.
    
        */
        function klein(v, u, target) {
            u *= Math.PI;
            v *= 2 * Math.PI;
            u = u * 2;

            let x;
            let z;

            if (u < Math.PI) {
                x =
                    3 * Math.cos(u) * (1 + Math.sin(u)) +
                    2 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v);
                z =
                    -8 * Math.sin(u) -
                    2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
            } else {
                x =
                    3 * Math.cos(u) * (1 + Math.sin(u)) +
                    2 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI);
                z = -8 * Math.sin(u);
            }

            const y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);

            target.set(x, y, z).multiplyScalar(0.75);
        }

        const slices = 25;
        const stacks = 25;
        return addSolidGeometry(2, 1, new ParametricGeometry(klein, slices, stacks));
    })();


    const plane = (() => {

        const width = 9;
        const height = 9;
        const widthSegments = 2;
        const heightSegments = 2;
        return addSolidGeometry(
            -2,
            0,
            new THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
        );
    })();

    {
        const verticesOfCube = [
            -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
            -1, 1, 1,
        ];
        const indicesOfFaces = [
            2, 1, 0, 0, 3, 2, 0, 4, 7, 7, 3, 0, 0, 1, 5, 5, 4, 0, 1, 2, 6, 6, 5, 1, 2,
            3, 7, 7, 6, 2, 4, 5, 6, 6, 7, 4,
        ];
        const radius = 7;
        const detail = 2;
        addSolidGeometry(
            -1,
            0,
            new THREE.PolyhedronGeometry(
                verticesOfCube,
                indicesOfFaces,
                radius,
                detail
            )
        );
    }

    {
        const innerRadius = 2;
        const outerRadius = 7;
        const segments = 18;
        addSolidGeometry(
            0,
            0,
            new THREE.RingGeometry(innerRadius, outerRadius, segments)
        );
    }

    {
        const shape = new THREE.Shape();
        const x = -2.5;
        const y = -5;
        shape.moveTo(x + 2.5, y + 2.5);
        shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
        shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
        shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
        shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
        shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
        shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);
        addSolidGeometry(1, 0, new THREE.ShapeGeometry(shape));
    }

    {
        const radius = 7;
        const widthSegments = 12;
        const heightSegments = 8;
        addSolidGeometry(
            2,
            0,
            new THREE.SphereGeometry(radius, widthSegments, heightSegments)
        );
    }

    {
        const radius = 7;
        addSolidGeometry(-2, -1, new THREE.TetrahedronGeometry(radius));
    }

    {
        const loader = new FontLoader();
        // promisify font loading
        function loadFont(url) {
            return new Promise((resolve, reject) => {
                loader.load(url, resolve, undefined, reject);
            });
        }

        async function doit() {
            const font = await loadFont(
                "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
            );
            const geometry = new TextGeometry("three.js", {
                font: font,
                size: 3.0,
                depth: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.15,
                bevelSize: 0.3,
                bevelSegments: 5,
            });
            const mesh = new THREE.Mesh(geometry, createMaterial());
            geometry.computeBoundingBox();
            geometry.boundingBox.getCenter(mesh.position).multiplyScalar(-1);

            const parent = new THREE.Object3D();
            parent.add(mesh);

            addObject(-1, -1, parent);
        }

        doit();
    }

    {
        const radius = 5;
        const tubeRadius = 2;
        const radialSegments = 8;
        const tubularSegments = 24;
        addSolidGeometry(
            0,
            -1,
            new THREE.TorusGeometry(
                radius,
                tubeRadius,
                radialSegments,
                tubularSegments
            )
        );
    }

    {
        const radius = 3.5;
        const tube = 1.5;
        const radialSegments = 8;
        const tubularSegments = 64;
        const p = 2;
        const q = 3;
        addSolidGeometry(
            1,
            -1,
            new THREE.TorusKnotGeometry(
                radius,
                tube,
                tubularSegments,
                radialSegments,
                p,
                q
            )
        );
    }

    {
        class CustomSinCurve extends THREE.Curve {
            constructor(scale) {
                super();
                this.scale = scale;
            }
            getPoint(t) {
                const tx = t * 3 - 1.5;
                const ty = Math.sin(2 * Math.PI * t);
                const tz = 0;
                return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);
            }
        }

        const path = new CustomSinCurve(4);
        const tubularSegments = 20;
        const radius = 1;
        const radialSegments = 8;
        const closed = false;
        addSolidGeometry(
            2,
            -1,
            new THREE.TubeGeometry(
                path,
                tubularSegments,
                radius,
                radialSegments,
                closed
            )
        );
    }

    {
        const width = 8;
        const height = 8;
        const depth = 8;
        const thresholdAngle = 15;
        addLineGeometry(
            -1,
            -2,
            new THREE.EdgesGeometry(
                new THREE.BoxGeometry(width, height, depth),
                thresholdAngle
            )
        );
    }

    {
        const width = 8;
        const height = 8;
        const depth = 8;
        addLineGeometry(
            1,
            -2,
            new THREE.WireframeGeometry(new THREE.BoxGeometry(width, height, depth))
        );
    }

    const root = new m3.Root();
    const iro1 = new m3.ColorProperty(cone.material, "color");
    const sbg = new m3.ColorProperty(scene, "background");

    root.track(0).run(
        Rel(0).to(iro1, "white")
            .d(2).to(iro1, "blue")
            .d(2).to(iro1, "red")
            .d(1).to(iro1, "green")
    );

    root.track(0).run(
        Rel(0).to(sbg, "white")
            .d(2).to(sbg, "grey")
            .d(2).to(sbg, "wheat")
            .d(1).to(sbg, "slategrey")
            .d(1).to(sbg, "white")
    );

    // console.b
    const wid = new m3.NumericProperty(box.scale, "y");
    const ro1 = new m3.NumericProperty(dode.rotation, "y");
    const pox = new m3.NumericProperty(cylin.position, "x");

    const poz = new m3.NumericProperty(dode.position, "z");
    const p3 = new m3.PositionProperty(klein, "position");
    const r3 = new m3.NumericProperty(klein.rotation, "x");
    // klein
    // console.log(klein.position);
    // console.log(p3.initial_value());
    root.track(0).run(Add(p3, [15, -5, 50], { dur: 2, curve: [[20, -100, 4], [-15, 40, 1]] }));
    root.track(0).run(To(r3, 3, { dur: 2 }));

    const { Easing } = m3;
    // console.log(p3);
    p3.check_stepper((s) => s.bounce(2));
    root.track(0).run(
        Rel(0).to(wid, 1).to(ro1, 0).initial(pox)
            .d(1).to(wid, 3).to(ro1, 1)
            .d(1).to(wid, 1, { easing: Easing.inoutexpo }).to(ro1, -1, { easing: Easing.inoutexpo })
            .add(pox, 50)
            .d(1).to(wid, 2).to(ro1, 2).initial(pox)
        // m3.Step(
        //     [
        //         { t: 0, wid: 1, ro1: 0, pox: m3.Step.initial },
        //         { dur: 1, wid: 3, ro1: 1 },
        //         {
        //             dur: 1,
        //             wid: 1,
        //             ro1: -1,
        //             easing: Easing.inoutexpo,
        //             pox: m3.Step.add(50),
        //         },
        //         { dur: 1, wid: 2, ro1: 2, easing: Easing.inoutsine, pox: m3.Step.first },
        //     ],
        //     { wid, ro1, pox: [pox, poz] }
        // )
    );
    {
        const { Par, Add } = m3;
        const tr1 = root.track(0);
        const r3 = new m3.NumericProperty(octa.rotation, "y");
        const r1 = new m3.NumericProperty(icos.rotation, "y");
        const r2 = new m3.NumericProperty(lath.rotation, "x");
        // tr1.run(To([r1], 2));
        // tr1.run(To([r2], 2));
        // tr1.run(To([r3], 2));
        tr1.run(Seq([To([r3], -3), To([r2], -3), To([r1], -3)]));
        // console.log(r3.value);
        // console.log(r2.value);
        tr1.run(Par([To([r3], 2), To([r2], 2), To([r1], 2)]));
        tr1.run(Seq([To([r3], 0), To([r2], 0), To([r1], 0)], { delay: 0.5 }));
        tr1.run(Par([To([r3], 3), To([r2], 3), To([r1], 3)]));
        tr1.run(Seq([To([r3], 0), To([r2], 0), To([r1], 0)], { stagger: 0.5 }));
    }
    {
        const pos = new m3.PositionProperty(exct, "position");
        const rx = new m3.NumericProperty(exct.rotation, "x");
        const tr1 = root.track(0);
        console.log("TR", tr1.frame);
        tr1.run(Rel(3).to(pos, [-1, 2, 3])
            .at(1).to([pos], [-3, -2, -1])
            .at('66%').to([pos], [0, 0, 0]).add(rx, 1)
            .at('33%').add(rx, -2, { easing: Easing.inback })
            .at('90%').to(rx, 0, { easing: Easing.inoutexpo })
        );
        console.log("TR", tr1.frame);
        pos.check_stepper((s) => s.bounce(Infinity));
        rx.check_stepper((s) => s.bounce(Infinity));
        // tr1.run(To(pos, [1, 2, 3]));
        // pos.set_value(new THREE.Vector3(1, 2, 3));
        // root.track(0).run(To(pos, [2, 2, 2]))
        // console.log(...pos.enum_values(0, 1.5 * 60));
        // pos.set_value(new THREE.Vector3(-2, -2, 2));
    }
    wid.check_stepper((s) => s.bounce(Infinity));


    return { root, scene, camera };
}

function web() {
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    {
        renderer.setSize(640, 360);
    }
    const { root, scene, camera } = main(renderer);
    {
        let controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
    }
    const upd = root.stepper();

    const { start, end } = upd;
    const { frame_rate: fps } = root;
    globalThis.cam = camera;

    let clock = new THREE.Clock();
    CameraControls.install({ THREE: THREE });
    let cameraControls = new CameraControls(camera, canvas);
    if (end <= start) {
        throw RangeError(`${start} => ${end}`);
    }

    m3.animate({
        fps,
        start,
        end,
        update: function (f) {
            // console.log(`f:${f} ${iro1.get_value(200).getHexString()}`);
            // const delta = clock.getDelta();

            // cuber.owner[cuber.name] = cuber.get_value(f);
            // camZ.owner[camZ.name] = camZ.get_value(f);
            // iro1.owner[iro1.name] = iro1.get_value(f);
            // root.update(f);
            upd.step(f);
            const hasControlsUpdated = cameraControls.update(f);
            // renderer.clear();
            renderer.render(scene, camera);
        },
    });
}

web();

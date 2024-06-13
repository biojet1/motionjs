const { createCanvas, Image } = require('canvas');
const THREE = require('three');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set the ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Create a canvas
const width = 800;
const height = 600;
const canvas = createCanvas(width, height);
{
    canvas.addEventListener = function (event, func, bind_) { };
}
const renderer = new THREE.WebGLRenderer({ canvas });

// Set up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;

let frame = 0;
const frames = 300; // Number of frames for the video
const frameRate = 30;
const frameDuration = 1 / frameRate;
const outputDir = path.join(__dirname, 'frames');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

function animate() {
    // Animate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene
    renderer.render(scene, camera);

    // Save the frame as a PNG file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `frame-${String(frame).padStart(4, '0')}.png`), buffer);

    frame++;

    if (frame < frames) {
        setTimeout(animate, frameDuration * 1000);
    } else {
        // All frames are captured, encode video
        encodeVideo();
    }
}

// Start the animation
animate();
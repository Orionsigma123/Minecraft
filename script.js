// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Generate a simple block world using Perlin noise
const blockSize = 1;
const worldWidth = 50; // Increase for larger worlds
const worldHeight = 50; // Increase for larger worlds
const noiseScale = 0.1; // Adjust for terrain smoothness
const simplex = new SimplexNoise();

// Function to create a block
function createBlock(x, y, z, color) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    scene.add(block);
}

// Generate the world using Perlin noise
for (let x = 0; x < worldWidth; x++) {
    for (let z = 0; z < worldHeight; z++) {
        // Get height based on noise value
        const height = Math.floor(simplex.noise2D(x * noiseScale, z * noiseScale) * 5); // Max height of 5 blocks
        const blockType = height > 0 ? 0x00ff00 : 0x8B4513; // Green for grass, brown for dirt
        for (let y = 0; y <= height; y++) {
            createBlock(x, y, z, blockType);
        }
    }
}

// Position the camera
camera.position.set(25, 10, 25); // Center the camera on the generated world
camera.lookAt(25, 0, 25);

// Player controls
const playerSpeed = 0.1;
let velocity = new THREE.Vector3(0, 0, 0);
const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Mouse movement for looking around
let yaw = 0;

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement) {
        yaw -= event.movementX * 0.1; // Look left/right
        camera.rotation.y = THREE.MathUtils.degToRad(yaw); // Rotate the camera
    }
});

// Handle movement
function updatePlayer() {
    velocity.set(0, 0, 0); // Reset velocity

    if (keys['KeyS']) { // Move forward (W)
        velocity.z = -playerSpeed; // Move backward
    } else if (keys['KeyW']) { // Move backward (S)
        velocity.z = playerSpeed; // Move forward
    }

    if (keys['KeyA']) { // Move left
        velocity.x = -playerSpeed;
    } else if (keys['KeyD']) { // Move right
        velocity.x = playerSpeed;
    }

    // Update camera position
    camera.position.x += velocity.x * Math.sin(camera.rotation.y);
    camera.position.z += velocity.z * Math.cos(camera.rotation.y);
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updatePlayer(); // Update player movement
    renderer.render(scene, camera);
}

// Start animation
animate();

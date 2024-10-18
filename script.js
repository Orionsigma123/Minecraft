// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable alpha for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the scene
renderer.setClearColor(0x87CEEB, 1); // Sky blue color

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

// Position the camera to be just above the ground
camera.position.set(25, 1.5, 25); // Adjust height to be just above the blocks

// Player controls
const playerSpeed = 0.1;
const lookSpeed = 0.1; // Speed of looking around
let velocity = new THREE.Vector3(0, 0, 0);
const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Function to lock the mouse pointer
function lockPointer() {
    document.body.requestPointerLock();
}

// Lock the pointer on mouse click
document.body.addEventListener('click', lockPointer);

// Mouse movement for looking around
let pitch = 0; // Up and down rotation
let yaw = 0; // Left and right rotation

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement) {
        yaw -= event.movementX * lookSpeed; // Look left/right
        pitch -= event.movementY * lookSpeed; // Look up/down

        // Clamp pitch to prevent flipping
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        // Apply camera rotation
        camera.rotation.x = pitch; // Up/down rotation
        camera.rotation.y = THREE.MathUtils.degToRad(yaw); // Left/right rotation
    }
});

// Handle movement
function updatePlayer() {
    velocity.set(0, 0, 0); // Reset velocity

    if (keys['KeyS']) { // Move backward (S)
        velocity.z = playerSpeed; // Move forward
    } else if (keys['KeyW']) { // Move forward (W)
        velocity.z = -playerSpeed; // Move backward
    }

    if (keys['KeyA']) { // Move left
        velocity.x = -playerSpeed;
    } else if (keys['KeyD']) { // Move right
        velocity.x = playerSpeed;
    }

    // Update camera position based on the direction it's facing
    camera.position.x += velocity.x * Math.sin(camera.rotation.y);
    camera.position.z += velocity.z * Math.cos(camera.rotation.y);

    // Ensure the camera stays above ground level
    camera.position.y = 1.5; // Maintain a height above the ground
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

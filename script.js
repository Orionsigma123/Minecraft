// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the scene
renderer.setClearColor(0x87CEEB, 1); // Sky blue color

// Load the grass texture
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('Textures/grass.png');

// Inventory and hotbar
const inventory = [];
const maxInventorySize = 10; // Max blocks in inventory
const hotbar = [];
const maxHotbarSize = 1; // Only allow one item in hand

// Block sizes
const blockSize = 1;
const worldWidth = 50;
const worldHeight = 50;
const noiseScale = 0.1;
const simplex = new SimplexNoise();

// Function to create a block
function createBlock(x, y, z, color, isWater = false) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = isWater ? new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 }) : new THREE.MeshBasicMaterial({ map: color });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    scene.add(block);
}

// Generate the world
for (let x = 0; x < worldWidth; x++) {
    for (let z = 0; z < worldHeight; z++) {
        const height = Math.floor(simplex.noise2D(x * noiseScale, z * noiseScale) * 5);
        for (let y = 0; y <= height; y++) {
            createBlock(x, y, z, grassTexture); // Create grass blocks
        }
        // Add water for gaps
        if (height < 5) {
            createBlock(x, 0, z, null, true); // Create water blocks
        }
    }
}

// Position the camera to be just above the ground
camera.position.set(25, 1.5, 25);

// Player controls
const playerSpeed = 0.1;
const jumpForce = 0.2;
let velocity = new THREE.Vector3(0, 0, 0);
let isJumping = false;
let isSwimming = false;
const keys = {};

// Lock the pointer
function lockPointer() {
    document.body.requestPointerLock();
}
document.body.addEventListener('click', lockPointer);

// Mouse movement for looking around
let pitch = 0;
let yaw = 0;
const lookSensitivity = 0.1;

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement) {
        yaw -= event.movementX * lookSensitivity;
        pitch -= event.movementY * lookSensitivity;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        camera.rotation.order = "YXZ";
        camera.rotation.set(pitch, yaw, 0);
    }
});

// Handle movement
function updatePlayer() {
    velocity.set(0, 0, 0);

    if (keys['KeyS']) {
        velocity.z = playerSpeed;
    } else if (keys['KeyW']) {
        velocity.z = -playerSpeed;
    }

    if (keys['KeyA']) {
        velocity.x = -playerSpeed;
    } else if (keys['KeyD']) {
        velocity.x = playerSpeed;
    }

    // Jumping logic
    if (keys['Space'] && !isJumping && !isSwimming) {
        isJumping = true;
        velocity.y = jumpForce;
    }

    // Apply gravity
    if (camera.position.y > 1.5) {
        velocity.y -= 0.01;
    } else {
        isJumping = false;
        camera.position.y = 1.5;
        velocity.y = 0;
    }

    // Move the camera based on the direction it's facing
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    camera.position.x += direction.x * -velocity.z;
    camera.position.z += direction.z * -velocity.z;
    camera.position.y += velocity.y;

    // Swimming logic
    const groundHeight = Math.floor(simplex.noise2D(camera.position.x * noiseScale, camera.position.z * noiseScale) * 5);
    if (camera.position.y < 0.5) {
        isSwimming = true; // In water
        camera.position.y = 0.5; // Float on the water surface
    } else {
        isSwimming = false; // Not swimming
    }

    // Collision detection
    camera.position.x = Math.max(0, Math.min(camera.position.x, worldWidth - 1));
    camera.position.z = Math.max(0, Math.min(camera.position.z, worldHeight - 1));
}

// Function to collect blocks
function collectBlock() {
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    raycaster.set(camera.position, direction);

    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const block = intersects[0].object;
        // If the block is grass
        if (block.material.map === grassTexture) {
            if (inventory.length < maxInventorySize) {
                inventory.push(grassTexture);
                scene.remove(block);
                console.log("Collected a block! Inventory size: ", inventory.length);
            }
        }
    }
}

// Listen for mouse down to start collecting blocks
document.addEventListener('mousedown', collectBlock);

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
    updatePlayer();
    renderer.render(scene, camera);
}

// Start the animation loop
animate();

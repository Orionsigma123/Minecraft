// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable alpha for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the scene
renderer.setClearColor(0x87CEEB, 1); // Sky blue color

// Textures
const grassTexture = new THREE.TextureLoader().load('textures/grass.png'); // Replace with your grass texture path 

// Inventory
const inventory = [];

// Constants
const blockSize = 1;
const chunkSize = 16; // Size of a chunk (16x16 blocks)
const chunkHeight = 10; // Height of the chunks
const renderDistance = 4; // Number of chunks to render in each direction
const noiseScale = 0.1; // Adjust for terrain smoothness
const simplex = new SimplexNoise();

// Store chunks
const chunks = {};
let currentChunk = { x: 0, z: 0 };

// Function to create a block
function createBlock(x, y, z, texture) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    block.userData = { x, y, z };
    return block;
}

// Function to generate a single chunk
function generateChunk(chunkX, chunkZ) {
    const chunk = new THREE.Group();
    
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const height = Math.floor(simplex.noise2D((chunkX + x) * noiseScale, (chunkZ + z) * noiseScale) * chunkHeight);
            for (let y = 0; y <= height; y++) {
                const block = createBlock(chunkX + x, y, chunkZ + z, grassTexture);
                chunk.add(block);
            }
        }
    }

    chunks[`${chunkX},${chunkZ}`] = chunk;
    scene.add(chunk);
}

// Function to update chunks based on player position
function updateChunks() {
    const playerChunkX = Math.floor(camera.position.x / chunkSize);
    const playerChunkZ = Math.floor(camera.position.z / chunkSize);
    
    // Unload chunks that are too far away
    for (const key in chunks) {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        if (Math.abs(chunkX - playerChunkX) > renderDistance || Math.abs(chunkZ - playerChunkZ) > renderDistance) {
            scene.remove(chunks[key]);
            delete chunks[key];
        }
    }

    // Load new chunks
    for (let x = -renderDistance; x <= renderDistance; x++) {
        for (let z = -renderDistance; z <= renderDistance; z++) {
            const chunkKey = `${playerChunkX + x},${playerChunkZ + z}`;
            if (!chunks[chunkKey]) {
                generateChunk(playerChunkX + x, playerChunkZ + z);
            }
        }
    }
}

// Initial chunk generation
updateChunks();

// Position the camera to be just above the ground
camera.position.set(25, 2, 25); // Adjust height to be 2 blocks tall

// Player controls
const playerSpeed = 0.1;
const jumpForce = 0.3;
let velocity = new THREE.Vector3(0, 0, 0);
let isJumping = false;
const keys = {};
let mousePressed = false;
let selectedBlock = null;

// Inventory management functions
function addToInventory(block) {
    const emptySlot = inventory.findIndex(item => item === undefined);
    if (emptySlot !== -1) {
        inventory[emptySlot] = block;
        renderInventory(); // Update the inventory UI
    }
}

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Function to simulate block breaking and add to inventory
function breakBlock(block) {
    const blockPosition = block.userData;
    addToInventory({ name: 'Grass Block', texture: grassTexture });
    scene.remove(block);
}

// Function to get the block under the crosshair
function getBlockUnderCrosshair() {
    const raycaster = new THREE.Raycaster();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    raycaster.set(camera.position, cameraDirection);
    const intersects = raycaster.intersectObjects(scene.children);

    return intersects.length > 0 ? intersects[0].object : null;
}

// Handle left mouse button down event (to break a block)
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        const block = getBlockUnderCrosshair();
        if (block) {
            breakBlock(block);
        }
    }
});

// Function to lock the mouse pointer
function lockPointer() {
    document.body.requestPointerLock();
}

// Lock the pointer on mouse click
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

    if (keys['Space'] && !isJumping) {
        isJumping = true;
        velocity.y = jumpForce;
    }

    if (camera.position.y > 2) {
        velocity.y -= 0.1;
    } else {
        isJumping = false;
        camera.position.y = 2;
        velocity.y = 0;
    }

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    camera.position.x += direction.x * -velocity.z;
    camera.position.z += direction.z * -velocity.z;
    camera.position.y += velocity.y;

    camera.position.x = Math.max(0, Math.min(camera.position.x, worldWidth - 1));
    camera.position.z = Math.max(0, Math.min(camera.position.z, worldHeight - 1));

    const groundHeight = Math.floor(simplex.noise2D(camera.position.x * noiseScale, camera.position.z * noiseScale) * chunkHeight);
    if (camera.position.y < groundHeight + 2) {
        camera.position.y = groundHeight + 2;
    }

    updateChunks(); // Check for chunk updates based on new camera position
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
    updatePlayer();
    renderer.render(scene, camera);
}

// Start animation
animate();

// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable alpha for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the scene
renderer.setClearColor(0x87CEEB, 1); // Sky blue color

// Load the grass texture
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('textures/grass.png');

// World parameters
const blockSize = 1;
const chunkSize = 10; // 10 by 10 blocks per chunk
const maxChunks = 32; // Adjust based on maximum render distance
const noiseScale = 0.1; // Adjust for terrain smoothness
const simplex = new SimplexNoise();

// To store generated chunks
let chunks = {}; // Store rendered chunks

// Function to create a block
function createBlock(x, y, z, texture) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    return block;
}

// Function to generate a chunk
function generateChunk(chunkX, chunkZ) {
    const chunk = new THREE.Group(); // Create a group to contain blocks of this chunk
    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const worldX = chunkX * chunkSize + x;
            const worldZ = chunkZ * chunkSize + z;
            const height = Math.floor(simplex.noise2D(worldX * noiseScale, worldZ * noiseScale) * 5); // Max height of 5 blocks
            for (let y = 0; y <= height; y++) {
                const block = createBlock(worldX, y, worldZ, grassTexture); // Create blocks using grass texture
                chunk.add(block); // Add the block to the chunk
            }
        }
    }
    return chunk; // Return the chunk group
}

// Function to update the rendered chunks based on render distance
function updateChunks(renderDistance) {
    // Clear existing chunks
    for (const chunkKey in chunks) {
        scene.remove(chunks[chunkKey]); // Remove from scene
        delete chunks[chunkKey]; // Remove from storage
    }

    const radius = Math.floor(renderDistance / 2); // Calculate the chunk radius
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const chunkKey = `${x}_${z}`;
            if (!chunks[chunkKey]) {
                const newChunk = generateChunk(x, z); // Generate new chunk
                chunks[chunkKey] = newChunk; // Store the chunk in chunks object
                scene.add(newChunk); // Add the chunk to the scene
            }
        }
    }
}

// Initial render distance and world generation
let renderDistance = 16; // Starting render distance
updateChunks(renderDistance);

// Position the camera to be just above the ground
camera.position.set(100, 1.5, 100); // Adjust height and position to be just above the blocks

// Player controls
const playerSpeed = 0.1;
const jumpForce = 0.2; // Jumping force
let velocity = new THREE.Vector3(0, 0, 0);
let isJumping = false;
const keys = {};

// Timer for holding the left-click
let holdTimer = 0;
let isHoldingBlock = false;

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
let pitch = 0; // Up and down rotation (X-axis)
let yaw = 0; // Left and right rotation (Y-axis)
const lookSensitivity = 0.1; // Sensitivity for vertical look

// Adjust the camera rotation logic to lock the Z-axis (roll)
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement) {
        yaw -= event.movementX * lookSensitivity; // Left/right
        pitch -= event.movementY * lookSensitivity; // Up/down

        // Clamp pitch to prevent flipping (X-axis rotation between -90° and 90°)
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        // Apply camera rotation using Euler angles (yaw for left/right, pitch for up/down)
        camera.rotation.order = "YXZ"; // Yaw (Y) first, then pitch (X)
        camera.rotation.set(pitch, yaw, 0); // Keep Z-axis (roll) locked at 0
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

    // Jumping logic
    if (keys['Space'] && !isJumping) {
        isJumping = true;
        velocity.y = jumpForce; // Initial jump velocity
    }

    // Apply gravity
    if (camera.position.y > 1.5) {
        velocity.y -= 0.01; // Gravity effect
    } else {
        isJumping = false; // Reset jumping when hitting the ground
        camera.position.y = 1.5; // Ensure the camera stays above ground
        velocity.y = 0; // Reset vertical velocity when on the ground
    }

    // Move the camera based on the direction it's facing
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get the direction the camera is facing
    direction.y = 0; // Ignore vertical direction for horizontal movement
    direction.normalize(); // Normalize direction to ensure consistent speed

    // Update camera position based on direction
    camera.position.x += direction.x * -velocity.z; // Reverse movement for forward
    camera.position.z += direction.z * -velocity.z; // Reverse movement for forward
    camera.position.y += velocity.y; // Update vertical position

    // Collision detection to prevent phasing through blocks
    camera.position.x = Math.max(0, Math.min(camera.position.x, worldWidth - 1)); // Constrain camera within bounds
    camera.position.z = Math.max(0, Math.min(camera.position.z, worldHeight - 1));

    // Check collision with ground (simple method)
    const groundHeight = Math.floor(simplex.noise2D(camera.position.x * noiseScale, camera.position.z * noiseScale) * 5); // Check height at camera position
    if (camera.position.y < groundHeight + 1.5) {
        camera.position.y = groundHeight + 1.5; // Place the camera on top of the ground
    }
}

// Function to collect blocks
function collectBlock() {
    // Raycaster to detect which block is being looked at
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get the direction the camera is facing
    raycaster.set(camera.position, direction); // Set the raycaster from the camera position in the direction of the camera

    const intersects = raycaster.intersectObjects(scene.children); // Check for intersections with the blocks
    if (intersects.length > 0) {
        const block = intersects[0].object; // Get the first intersected object
        if (!isHoldingBlock) {
            isHoldingBlock = true; // Start holding the block
            holdTimer = 0; // Reset hold timer
            const holdInterval = setInterval(() => {
                holdTimer += 0.1; // Increment hold timer by 0.1 seconds
                if (holdTimer >= 2) { // If holding for 2 seconds
                    if (inventory.length < maxInventorySize) { // Check if there's room in the inventory
                        inventory.push(block); // Add block to inventory
                        scene.remove(block); // Remove block from scene
                        clearInterval(holdInterval); // Stop the interval
                        isHoldingBlock = false; // Reset holding state
                    }
                }
            }, 100); // Check every 100ms
        }
    } else {
        isHoldingBlock = false; // Reset holding state if nothing is intersected
    }
}

// Update render distance based on slider input
const renderDistanceInput = document.getElementById('renderDistance');
const renderDistanceValueDisplay = document.getElementById('renderDistanceValue');

function updateRenderDistance() {
    renderDistance = parseInt(renderDistanceInput.value);
    renderDistanceValueDisplay.textContent = renderDistance; // Update the display value
    updateChunks(renderDistance); // Update the rendered chunks
}

renderDistanceInput.addEventListener('input', updateRenderDistance);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updatePlayer(); // Update player movement
    collectBlock(); // Check for block collection
    renderer.render(scene, camera); // Render the scene
}

animate(); // Start the animation loop

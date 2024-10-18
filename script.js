// Setup basic scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); // Enable alpha for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the background color of the scene
renderer.setClearColor(0x87CEEB, 1); // Sky blue color

// Load textures
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('Textures/grass.png');
const dirtTexture = textureLoader.load('Textures/dirt.png'); // If you want to add a dirt texture later

// Create water material
const waterMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: 0.5,
});

// Generate a simple block world using Perlin noise
const blockSize = 1;
const worldWidth = 50; // Increase for larger worlds
const worldHeight = 50; // Increase for larger worlds
const noiseScale = 0.1; // Adjust for terrain smoothness
const simplex = new SimplexNoise();

// Inventory setup
let inventory = [];
const hotbarSize = 9; // Size of hotbar
let selectedSlot = 0; // Current selected slot in the hotbar

// Function to create a block
function createBlock(x, y, z, texture) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshBasicMaterial({ map: texture }); // Use texture for material
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    return block;
}

// Function to create water block
function createWaterBlock(x, y, z) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const waterBlock = new THREE.Mesh(geometry, waterMaterial);
    waterBlock.position.set(x * blockSize, y * blockSize, z * blockSize);
    return waterBlock;
}

// To store chunks
let chunks = {};

// Function to generate a chunk based on its coordinates
function generateChunk(chunkX, chunkZ) {
    const chunk = new THREE.Group();
    for (let x = 0; x < 10; x++) {
        for (let z = 0; z < 10; z++) {
            const worldX = chunkX * 10 + x;
            const worldZ = chunkZ * 10 + z;
            const height = Math.floor(simplex.noise2D(worldX * noiseScale, worldZ * noiseScale) * 5); // Max height of 5 blocks
            const blockType = height > 0 ? 'grass' : 'dirt'; // Use 'grass' or 'dirt' for block type
            for (let y = 0; y <= height; y++) {
                const texture = blockType === 'grass' ? grassTexture : dirtTexture; // Select texture based on block type
                const block = createBlock(worldX, y, worldZ, texture); // Create the block
                chunk.add(block); // Add the block to the chunk
            }

            // Check for gaps and create water blocks
            if (height === 0) {
                // If there's a gap (no blocks), create water
                const waterBlock = createWaterBlock(worldX, 0, worldZ); // Place water at the ground level
                chunk.add(waterBlock); // Add water block to the chunk
            } else {
                // Add grass block at the top of the grass layer
                const grassBlock = createBlock(worldX, height, worldZ, grassTexture);
                grassBlock.userData = { type: 'grass' }; // Mark this block as grass
                chunk.add(grassBlock);
            }
        }
    }
    return chunk;
}

// Function to update rendered chunks based on render distance
function updateChunks(renderDistance) {
    // Clear existing chunks
    for (const chunkKey in chunks) {
        scene.remove(chunks[chunkKey]);
        delete chunks[chunkKey];
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
camera.position.set(25, 1.5, 25); // Adjust height to be just above the blocks

// Player controls
const playerSpeed = 0.1;
const jumpForce = 0.2; // Jumping force
let velocity = new THREE.Vector3(0, 0, 0);
let isJumping = false;
let isSwimming = false; // Swimming state
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

// Function to handle breaking a block
function breakBlock(worldX, worldY, worldZ) {
    const blockToBreak = scene.children.find(child => {
        return (
            child instanceof THREE.Mesh &&
            child.position.x === worldX * blockSize &&
            child.position.y === worldY * blockSize &&
            child.position.z === worldZ * blockSize
        );
    });

    if (blockToBreak) {
        const grassColor = 0x00ff00; // Grass color
        if (blockToBreak.userData.type === 'grass') {
            // Create a collectible item when breaking grass
            const grassItem = createBlock(worldX, worldY, worldZ, grassTexture);
            grassItem.userData = { type: 'grass_item' }; // Mark this block as a collectible item
            grassItem.position.y += 0.5; // Slightly above ground
            scene.add(grassItem); // Add the grass item to the scene
        }
        scene.remove(blockToBreak); // Remove the broken block from the scene
    }
}

// Function to collect items
function collectItem(worldX, worldZ) {
    const itemToCollect = scene.children.find(child => {
        return (
            child instanceof THREE.Mesh &&
            child.userData.type === 'grass_item' &&
            child.position.x === worldX * blockSize &&
            child.position.z === worldZ * blockSize
        );
    });

    if (itemToCollect) {
        if (inventory.length < hotbarSize) {
            inventory.push(itemToCollect.userData.type); // Add the item type to the inventory
            scene.remove(itemToCollect); // Remove the item from the scene
        }
    }
}

// Function to place an item from the inventory
function placeItem(worldX, worldY, worldZ) {
    if (inventory[selectedSlot] === 'grass') { // Only allowing placement of grass for simplicity
        const grassBlock = createBlock(worldX, worldY, worldZ, grassTexture);
        scene.add(grassBlock); // Add the grass block to the scene
        inventory[selectedSlot] = null; // Remove the item from the hotbar
    }
}

// Function to check if player is in water
function checkWaterCollision() {
    const worldX = Math.floor(camera.position.x);
    const worldZ = Math.floor(camera.position.z);

    // Check if there's a water block at the player's current position
    const waterBlock = scene.children.find(child => {
        return (
            child instanceof THREE.Mesh &&
            child.material === waterMaterial &&
            child.position.x === worldX * blockSize &&
            child.position.z === worldZ * blockSize
        );
    });

    isSwimming = !!waterBlock; // Set swimming state based on whether the player is in water
}

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

    // Check if player is swimming
    checkWaterCollision(); // Check if the player is in water

    // Modify movement speed when swimming
    if (isSwimming) {
        velocity.y = 0.05; // Adjust swimming speed (could be modified for more realistic swimming)
        camera.position.y += velocity.y; // Move up slightly while swimming
    }

    // Collision detection to prevent phasing through blocks
    camera.position.x = Math.max(0, Math.min(camera.position.x, worldWidth - 1)); // Constrain camera within bounds
    camera.position.z = Math.max(0, Math.min(camera.position.z, worldHeight - 1));

    // Check collision with ground (simple method)
    const groundHeight = Math.floor(simplex.noise2D(camera.position.x * noiseScale, camera.position.z * noiseScale) * 5); // Check height at camera position
    if (camera.position.y < groundHeight + 1.5) {
        camera.position.y = groundHeight + 1.5; // Place the camera on top of the ground
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

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
    renderer.render(scene, camera);
}

// Start animation
animate();

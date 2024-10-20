// Globals
let scene, camera, renderer, world, inventory, selectedBlock;
const blockTypes = [
    { name: 'grass', color: 0x00FF00 },
    { name: 'dirt', color: 0x8B4513 },
    { name: 'stone', color: 0x3E3E3E }
];
const playerPosition = { x: 0, y: 0, z: 0 };
const movementSpeed = 0.1;
let forward = 0, sideways = 0;
let mouseSensitivity = 0.1;
let isMouseLocked = false;
const gravity = -0.01; // Gravity strength
let velocityY = 0; // Vertical velocity
const jumpStrength = 0.2; // Jump strength
const groundLevel = -0.5; // Adjust this to set ground level
const simplex = new SimplexNoise(); // Initialize Simplex Noise

// Initialize the game
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('gameArea').appendChild(renderer.domElement);
    
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);
    document.getElementById('singlePlayer').addEventListener('click', startGame);
    document.getElementById('multiplayer').addEventListener('click', () => alert('Multiplayer not implemented yet.'));
    
    inventory = { slots: Array(16).fill(null) }; // Initialize 16 slots inventory
    loadInventory();
    generateWorld();
    updateInventoryDisplay();

    // Request mouse lock on body click
    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    // Handle mouse lock state
    document.addEventListener('pointerlockchange', () => {
        isMouseLocked = document.pointerLockElement === document.body;
    });
}

// Start the game
function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    camera.position.set(playerPosition.x, playerPosition.y + 1, playerPosition.z); // Start camera at position
    animate();
}

// Generate the world using Simplex noise
function generateWorld() {
    const size = 50; // Size of the world
    const scale = 10; // Scale for the Simplex noise
    world = new THREE.Group();

    for (let x = -size; x < size; x++) {
        for (let z = -size; z < size; z++) {
            const height = Math.floor(simplex.noise2D(x / scale, z / scale) * 10); // Get height based on Simplex noise
            const material = getBlockMaterial(height);
            const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
            block.position.set(x, height / 2, z);
            world.add(block);
        }
    }

    scene.add(world);
}

// Get block material based on height
function getBlockMaterial(height) {
    if (height < 1) {
        return new THREE.MeshBasicMaterial({ color: 0x3E3E3E }); // Stone
    } else if (height < 3) {
        return new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Dirt
    } else {
        return new THREE.MeshBasicMaterial({ color: 0x00FF00 }); // Grass
    }
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition();
    renderer.render(scene, camera);
}

// Update player position based on input
function updatePlayerPosition() {
    // Handle gravity
    velocityY += gravity; // Apply gravity
    playerPosition.y += velocityY; // Update vertical position
    
    // Check if player is on the ground
    if (playerPosition.y < groundLevel) {
        playerPosition.y = groundLevel; // Set to ground level
        velocityY = 0; // Reset vertical velocity
    }
    
    // Update camera position
    camera.position.set(playerPosition.x, playerPosition.y + 1, playerPosition.z);
    
    // Handle movement based on input
    playerPosition.x += sideways * movementSpeed;
    playerPosition.z += forward * movementSpeed;

    // Check for collision with blocks
    checkCollisions();
}

// Check for collisions with the world
function checkCollisions() {
    world.children.forEach(block => {
        if (block.position.y - 0.5 < playerPosition.y && block.position.y + 0.5 > playerPosition.y) {
            if (Math.abs(block.position.x - playerPosition.x) < 0.5 && Math.abs(block.position.z - playerPosition.z) < 0.5) {
                playerPosition.y = block.position.y + 0.5; // Position player on top of the block
                velocityY = 0; // Reset vertical velocity
            }
        }
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle key down events
function handleKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
            forward = -1;
            break;
        case 'KeyS':
            forward = 1;
            break;
        case 'KeyA':
            sideways = -1;
            break;
        case 'KeyD':
            sideways = 1;
            break;
        case 'Space':
            if (playerPosition.y === groundLevel) { // Only jump if on the ground
                velocityY += jumpStrength; // Apply jump strength
            }
            break;
        case 'KeyE':
            openInventory();
            break;
        default:
            break;
    }
}

// Handle key up events
function handleKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'KeyS':
            forward = 0;
            break;
        case 'KeyA':
        case 'KeyD':
            sideways = 0;
            break;
        default:
            break;
    }
}

// Mouse move event
function onMouseMove(event) {
    if (isMouseLocked) {
        // Adjust camera rotation based on mouse movement
        camera.rotation.y -= event.movementX * mouseSensitivity; // Horizontal movement
        camera.rotation.x -= event.movementY * mouseSensitivity; // Vertical movement
        
        // Limit the vertical rotation
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
}

// Open the inventory
function openInventory() {
    const inventoryDiv = document.getElementById('inventory');
    if (inventoryDiv.style.display === 'none') {
        inventoryDiv.style.display = 'block';
    } else {
        inventoryDiv.style.display = 'none';
    }
}

// Load and save inventory, and other related functions...
function addToInventory(blockName) {
    const index = inventory.slots.indexOf(null);
    if (index !== -1) {
        inventory.slots[index] = blockName;
        saveInventory();
        updateInventoryDisplay();
    }
}

// Save inventory to local storage
function saveInventory() {
    localStorage.setItem('minecraft_inventory', JSON.stringify(inventory));
}

// Load inventory from local storage
function loadInventory() {
    const savedInventory = localStorage.getItem('minecraft_inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    }
}

// Update inventory display
function updateInventoryDisplay() {
    const inventorySlots = document.getElementById('inventorySlots');
    inventorySlots.innerHTML = ''; // Clear current inventory display
    inventory.slots.forEach((block, index) => {
        const slot = document.createElement('div');
        slot.classList.add('inventory-slot');
        slot.style.backgroundColor = block ? blockTypes.find(b => b.name === block).color : '#FFF';
        slot.innerText = block || '';
        slot.addEventListener('click', () => selectBlock(block));
        inventorySlots.appendChild(slot);
    });
}

// Select a block from the inventory
function selectBlock(blockName) {
    selectedBlock = blockTypes.find(block => block.name === blockName);
}

// Initialize the game
init();

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Player setup
const player = { x: 0, y: 1.5, z: 0, inventory: [], selectedBlock: 'grass' };
const blockSize = 1;

// Load textures
const textureLoader = new THREE.TextureLoader();
const textures = {
    grass: textureLoader.load('textures/grass.jpg'),
    dirt: textureLoader.load('textures/dirt.png'),
    stone: textureLoader.load('textures/stone.png'),
};

// Create a skybox
const skyBoxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
const skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
scene.add(skyBox);

// Create a block
function createBlock(x, y, z, texture) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    return block;
}

// Generate terrain using Perlin noise
function generateTerrain() {
    const terrainSize = 16; // Size of the terrain in chunks
    for (let x = -terrainSize; x < terrainSize; x++) {
        for (let z = -terrainSize; z < terrainSize; z++) {
            const height = Math.floor((noise.perlin2(x * 0.1, z * 0.1) + 1) * 5); // Adjust height scaling
            for (let y = 0; y <= height; y++) {
                let blockType = 'dirt';
                if (y === height) {
                    blockType = 'grass';
                } else if (y < height - 1 && Math.random() < 0.1) { // Add some stone blocks
                    blockType = 'stone';
                }
                const block = createBlock(x * blockSize, y * blockSize, z * blockSize, textures[blockType]);
                scene.add(block);
            }
        }
    }
}

// Player controls setup
let isMouseLocked = false;
document.addEventListener('click', () => {
    if (isMouseLocked) {
        document.exitPointerLock();
    } else {
        document.body.requestPointerLock();
    }
    isMouseLocked = !isMouseLocked;
});

let prevTime = Date.now();
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Function to update the player's position
function updatePlayerPosition() {
    const speed = 0.1; // Movement speed
    const deltaTime = (Date.now() - prevTime) / 1000; // Time since last frame

    if (keys['ArrowUp']) {
        player.z -= speed * deltaTime;
    }
    if (keys['ArrowDown']) {
        player.z += speed * deltaTime;
    }
    if (keys['ArrowLeft']) {
        player.x -= speed * deltaTime;
    }
    if (keys['ArrowRight']) {
        player.x += speed * deltaTime;
    }
}

// Handle mouse movement for looking around
document.addEventListener('mousemove', (event) => {
    if (isMouseLocked) {
        const sensitivity = 0.1;
        camera.rotation.y -= event.movementX * sensitivity;
        camera.rotation.x -= event.movementY * sensitivity;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); // Limit vertical rotation
    }
});

// Block breaking and placing
function breakBlock() {
    const blockDistance = 5; // Distance to break a block
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    raycaster.set(camera.position, direction);
    
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const block = intersects[0].object;
        scene.remove(block);
        console.log("Block broken:", block);
    }
}

function placeBlock() {
    const blockDistance = 5; // Distance to place a block
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    raycaster.set(camera.position, direction);
    
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        const block = createBlock(Math.floor(point.x), Math.floor(point.y) + 1, Math.floor(point.z), textures[player.selectedBlock]);
        scene.add(block);
        console.log("Block placed:", block);
    }
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition();
    
    camera.position.set(player.x

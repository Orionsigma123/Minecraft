let scene, camera, renderer, controls;
let inventory = [];
let currentBlock = 'grass';
let worldSize = 100;
let chunkSize = 16;
let chunks = {};
let player;

// Initialize the game
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Initialize player
    player = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    scene.add(player);
    camera.position.set(0, 2, 5);
    camera.lookAt(player.position);

    // Initialize controls
    controls = new THREE.PointerLockControls(camera, document.body);
    document.body.appendChild(controls.getObject());

    document.getElementById('singleplayerBtn').addEventListener('click', startSinglePlayer);
    document.getElementById('multiplayerBtn').addEventListener('click', startMultiplayer);
    document.getElementById('loadWorldBtn').addEventListener('click', loadWorld);

    window.addEventListener('resize', onWindowResize, false);
    generateWorld();
    animate();
}

// Start single-player mode
function startSinglePlayer() {
    // Load or generate the world
    loadWorld();
}

// Start multiplayer mode
function startMultiplayer() {
    alert("Multiplayer mode not implemented yet.");
}

// Load world from local storage
function loadWorld() {
    const savedWorld = localStorage.getItem('minecraftWorld');
    if (savedWorld) {
        const blocks = JSON.parse(savedWorld);
        blocks.forEach(block => {
            placeBlock(block.position, block.type);
        });
    } else {
        alert("No saved world found.");
    }
}

// Save world to local storage
function saveWorld() {
    const blocks = Object.values(chunks).flat();
    localStorage.setItem('minecraftWorld', JSON.stringify(blocks));
}

// Generate an infinite world using Perlin noise
function generateWorld() {
    const simplex = new SimplexNoise();
    for (let x = -worldSize; x < worldSize; x += chunkSize) {
        for (let z = -worldSize; z < worldSize; z += chunkSize) {
            let height = Math.floor(simplex.noise2D(x / 20, z / 20) * 10) + 10; // Height based on Perlin noise
            for (let y = 0; y < height; y++) {
                placeBlock({ x, y, z }, 'grass');
            }
            for (let y = height; y < height + 5; y++) {
                placeBlock({ x, y, z }, 'dirt');
            }
        }
    }
}

// Place a block in the world
function placeBlock(position, type) {
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterial = new THREE.MeshBasicMaterial({ color: type === 'grass' ? 0x00ff00 : 0x8B4513 });
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(position.x + 0.5, position.y + 0.5, position.z + 0.5);
    scene.add(block);
    if (!chunks[position.x]) chunks[position.x] = {};
    if (!chunks[position.x][position.z]) chunks[position.x][position.z] = [];
    chunks[position.x][position.z].push({ position, type });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

init();

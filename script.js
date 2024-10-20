// script.js
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// World Generation
const noise = new SimplexNoise();
const worldSize = 100;
const blocks = [];
const chunkSize = 16;
const player = { position: { x: 0, y: 5, z: 0 } }; // Player position

function generateWorld() {
    // Clear existing blocks
    blocks.forEach(block => scene.remove(block));
    blocks.length = 0; // Reset blocks array

    for (let x = -worldSize / 2; x < worldSize / 2; x++) {
        for (let z = -worldSize / 2; z < worldSize / 2; z++) {
            const height = Math.floor(noise.noise2D(x / 10, z / 10) * 10) + 5;
            for (let y = 0; y < height; y++) {
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const block = new THREE.Mesh(geometry, material);
                block.position.set(x, y, z);
                scene.add(block);
                blocks.push(block);
            }
        }
    }
    camera.position.set(player.position.x, player.position.y, player.position.z + 10); // Set camera position
}

// Inventory System
let selectedBlock = 0; // index of the selected block in the inventory
const inventory = [];

function addToInventory(block) {
    inventory.push(block);
}

function placeBlock() {
    if (inventory[selectedBlock]) {
        const block = inventory[selectedBlock].clone();
        block.position.set(Math.floor(player.position.x), Math.floor(player.position.y), Math.floor(player.position.z));
        scene.add(block);
        blocks.push(block);
    }
}

// Mouse Controls
let isMouseDown = false;
document.addEventListener('mousedown', () => { isMouseDown = true; });
document.addEventListener('mouseup', () => { isMouseDown = false; });

let pitch = 0;
let yaw = 0;
document.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        yaw -= event.movementX * 0.1;
        pitch -= event.movementY * 0.1;
        pitch = Math.max(-89, Math.min(89, pitch)); // Limit pitch
        camera.rotation.set(THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(yaw), 0);
    }
});

// Menu Functionality
document.getElementById('singleplayer').addEventListener('click', () => {
    startSingleplayer();
});

document.getElementById('multiplayer').addEventListener('click', () => {
    alert("Multiplayer feature is not implemented yet.");
});

function startSingleplayer() {
    // Hide menu and start game
    document.getElementById('menu').style.display = 'none';
    generateWorld(); // Generate a new world
    animate();
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Save/Load World
function saveWorld() {
    const worldData = blocks.map(block => block.position);
    localStorage.setItem('minecraftWorld', JSON.stringify(worldData));
}

function loadWorld() {
    const worldData = JSON.parse(localStorage.getItem('minecraftWorld'));
    if (worldData) {
        worldData.forEach(pos => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const block = new THREE.Mesh(geometry, material);
            block.position.set(pos.x, pos.y, pos.z);
            scene.add(block);
            blocks.push(block);
        });
    }
}

// Call loadWorld on start
loadWorld();

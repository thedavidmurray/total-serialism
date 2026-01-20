// QT Bags Generative Art System
// A p5.js implementation for creating unique bag NFTs with weighted traits

// Trait system configuration
const baseWeights = {
  Tiny: Math.pow(2, 1),
  Small: Math.pow(2, 2),
  Medium: Math.pow(2, 3),
  "Super Medium": Math.pow(2, 3.5),
  Large: Math.pow(2, 4),
  "X-Large": Math.pow(2, 5),
  Mega: Math.pow(2, 6),
  Giga: Math.pow(2, 7),
  Tera: Math.pow(2, 8),
  Peta: Math.pow(2, 9),
  Exa: Math.pow(2, 10),
  Zetta: Math.pow(2, 11),
  Yotta: Math.pow(2, 12),
  Bottomless: Math.pow(2, 10)
};

// Type to weight mapping
const TypeWeightOptions = {
  Satchel: ["Small", "Medium", "Super Medium"],
  Pouch: ["Tiny", "Small", "Medium"],
  Backpack: ["Medium", "Large", "Super Medium"],
  Chest: ["Large", "X-Large", "Mega"],
  Barrel: ["X-Large", "Mega", "Giga"],
  Crate: ["Medium", "Large", "X-Large"],
  "Vial Pack": ["Small", "Medium", "Large"],
  "Scroll Case": ["Tiny", "Small", "Medium"],
  Quiver: ["Small", "Medium", "Large"],
  Trunk: ["Large", "X-Large", "Mega"],
  Tote: ["Small", "Medium", "Large"],
  Carryall: ["Medium", "Large", "Super Medium"],
  Bagpack: ["Medium", "Large", "Super Medium"],
  Duffel: ["Medium", "Large", "X-Large"],
  Case: ["Small", "Medium", "Large"],
  Box: ["Small", "Medium", "Large"],
  Coffer: ["Medium", "Large", "Super Medium"],
  Bin: ["Medium", "Large", "X-Large"],
  Basket: ["Small", "Medium", "Large"],
  Pot: ["Tiny", "Small", "Medium"],
  Jar: ["Tiny", "Small", "Medium"],
  Haversack: ["Medium", "Large", "Super Medium"],
  Rucksack: ["Medium", "Large", "Super Medium"],
  Canister: ["Small", "Medium", "Large"],
  Chalice: ["Tiny", "Small", "Medium"],
  Sack: ["Small", "Medium", "Large"],
  Kitbag: ["Medium", "Large", "Super Medium"],
  Lockbox: ["Small", "Medium", "Large"],
  Packet: ["Tiny", "Small", "Medium"],
  Silo: ["Mega", "Giga", "Tera"],
  Cask: ["Large", "X-Large", "Mega"],
  Drum: ["Large", "X-Large", "Mega"],
  "Fanny Pack": ["Tiny", "Small", "Medium"],
  Envelope: ["Tiny", "Small"],
  Goblet: ["Tiny", "Small", "Medium"],
  Knapsack: ["Medium", "Large", "Super Medium"],
  Pannier: ["Medium", "Large", "X-Large"],
  Reliquary: ["Small", "Medium", "Large"],
  Sheath: ["Tiny", "Small", "Medium"],
  Tube: ["Tiny", "Small", "Medium"],
  Urn: ["Small", "Medium", "Large"],
  Vase: ["Small", "Medium", "Large"],
  Wallet: ["Tiny", "Small"],
  Wardrobe: ["Mega", "Giga", "Tera"],
  Wineskin: ["Small", "Medium", "Large"],
  Wrapsack: ["Medium", "Large", "Super Medium"],
  Briefcase: ["Small", "Medium", "Large"],
  Hamper: ["Medium", "Large", "X-Large"],
  Hopper: ["Medium", "Large", "X-Large"],
  Jug: ["Small", "Medium", "Large"],
  Vault: ["Peta", "Exa", "Zetta"],
  Infinite: ["Bottomless"]
};

// Rarity-based trait selection
const rarityWeights = {
  Common: 100,
  Uncommon: 50,
  Rare: 20,
  Epic: 10,
  Legendary: 5,
  Mythic: 2,
  Artifact: 1
};

// Full trait definitions
const traits = {
  Capacity: [
    { name: "Tiny", rarity: "Common" },
    { name: "Nano", rarity: "Common" },
    { name: "Pico", rarity: "Uncommon" },
    { name: "Small", rarity: "Common" },
    { name: "Medium", rarity: "Uncommon" },
    { name: "Super Medium", rarity: "Uncommon" },
    { name: "Large", rarity: "Rare" },
    { name: "X-Large", rarity: "Epic" },
    { name: "Mega", rarity: "Legendary" },
    { name: "Giga", rarity: "Mythic" },
    { name: "Tera", rarity: "Legendary" },
    { name: "Peta", rarity: "Mythic" },
    { name: "Exa", rarity: "Legendary" },
    { name: "Zetta", rarity: "Mythic" },
    { name: "Yotta", rarity: "Legendary" },
    { name: "Yocto", rarity: "Mythic" },
    { name: "Planck", rarity: "Legendary" },
    { name: "Bottomless", rarity: "Artifact" }
  ],
  Material: [
    { name: "Cloth", rarity: "Common" },
    { name: "Recycled Felt", rarity: "Common" },
    { name: "Old Leather", rarity: "Uncommon" },
    { name: "Rod Iron", rarity: "Uncommon" },
    { name: "New Leather", rarity: "Rare" },
    { name: "Cork", rarity: "Rare" },
    { name: "Double Hide", rarity: "Epic" },
    { name: "Mythril", rarity: "Legendary" },
    { name: "Spider Silk", rarity: "Uncommon" },
    { name: "Dragonhide", rarity: "Legendary" },
    { name: "Etherweave", rarity: "Mythic" },
    { name: "Liquid Metal", rarity: "Artifact" },
    { name: "Titanium", rarity: "Artifact" },
    { name: "Star Fabric", rarity: "Artifact" }
  ],
  Enchantment: [
    { name: "None", rarity: "Common" },
    { name: "Glowing", rarity: "Uncommon" },
    { name: "Shrouded", rarity: "Rare" },
    { name: "Whispering", rarity: "Epic" },
    { name: "Enlightened", rarity: "Uncommon" },
    { name: "Haunted", rarity: "Rare" },
    { name: "Timeless", rarity: "Legendary" },
    { name: "Cosmic", rarity: "Artifact" },
    { name: "Eldritch", rarity: "Artifact" }
  ],
  History: [
    { name: "Brand New", rarity: "Common" },
    { name: "Antique", rarity: "Uncommon" },
    { name: "Forgotten", rarity: "Uncommon" },
    { name: "Legendary", rarity: "Legendary" },
    { name: "Relic", rarity: "Rare" },
    { name: "Time-Worn", rarity: "Epic" },
    { name: "Lost Era", rarity: "Legendary" },
    { name: "Future Perfect", rarity: "Mythic" },
    { name: "Prehistoric", rarity: "Artifact" },
    { name: "Parallel World", rarity: "Artifact" }
  ],
  Color: [
    { name: "Red", rarity: "Common" },
    { name: "Blue", rarity: "Common" },
    { name: "Green", rarity: "Uncommon" },
    { name: "Yellow", rarity: "Uncommon" },
    { name: "Pink", rarity: "Common" },
    { name: "Purple", rarity: "Rare" },
    { name: "Orange", rarity: "Rare" },
    { name: "Black", rarity: "Epic" },
    { name: "White", rarity: "Epic" },
    { name: "Grey", rarity: "Common" },
    { name: "Silver", rarity: "Uncommon" },
    { name: "Gold", rarity: "Rare" },
    { name: "Iridescent", rarity: "Rare" },
    { name: "Neon", rarity: "Epic" },
    { name: "Spectral", rarity: "Artifact" },
    { name: "Prismatic", rarity: "Artifact" }
  ],
  Type: [
    { name: "Satchel", rarity: "Common" },
    { name: "Pouch", rarity: "Common" },
    { name: "Backpack", rarity: "Uncommon" },
    { name: "Chest", rarity: "Rare" },
    { name: "Barrel", rarity: "Epic" },
    { name: "Crate", rarity: "Common" },
    { name: "Vial Pack", rarity: "Uncommon" },
    { name: "Scroll Case", rarity: "Uncommon" },
    { name: "Quiver", rarity: "Common" },
    { name: "Trunk", rarity: "Rare" },
    { name: "Tote", rarity: "Common" },
    { name: "Carryall", rarity: "Uncommon" },
    { name: "Duffel", rarity: "Uncommon" },
    { name: "Case", rarity: "Common" },
    { name: "Box", rarity: "Common" },
    { name: "Briefcase", rarity: "Common" },
    { name: "Vault", rarity: "Legendary" },
    { name: "Infinite", rarity: "Artifact" }
  ]
};

// Color palette mapping
const colorPalettes = {
  Red: ['#FF0000', '#CC0000', '#990000'],
  Blue: ['#0000FF', '#0066CC', '#003366'],
  Green: ['#00FF00', '#00CC00', '#006600'],
  Yellow: ['#FFFF00', '#FFD700', '#FFA500'],
  Pink: ['#FFC0CB', '#FF69B4', '#FF1493'],
  Purple: ['#800080', '#9370DB', '#8B008B'],
  Orange: ['#FFA500', '#FF8C00', '#FF6347'],
  Black: ['#000000', '#1C1C1C', '#2F2F2F'],
  White: ['#FFFFFF', '#F8F8FF', '#F5F5F5'],
  Grey: ['#808080', '#696969', '#A9A9A9'],
  Silver: ['#C0C0C0', '#D3D3D3', '#E5E5E5'],
  Gold: ['#FFD700', '#FFC125', '#FFB90F'],
  Iridescent: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA'],
  Neon: ['#39FF14', '#FF073A', '#FFF700', '#FF10F0'],
  Spectral: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
  Prismatic: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#EE82EE']
};

// Global variables
let currentBag = null;
let seed = null;

// Weighted random selection
function selectWeightedTrait(traitArray) {
  const weightedArray = [];
  traitArray.forEach(trait => {
    const weight = rarityWeights[trait.rarity] || 1;
    for (let i = 0; i < weight; i++) {
      weightedArray.push(trait);
    }
  });
  return random(weightedArray);
}

// Generate a complete bag
function generateBag() {
  const bag = {};
  
  // Select type first (it determines valid capacities)
  bag.type = selectWeightedTrait(traits.Type);
  
  // Select capacity based on type
  const validCapacities = TypeWeightOptions[bag.type.name] || ["Medium"];
  const capacityName = random(validCapacities);
  bag.capacity = traits.Capacity.find(c => c.name === capacityName) || traits.Capacity[4];
  
  // Select other traits
  bag.material = selectWeightedTrait(traits.Material);
  bag.enchantment = selectWeightedTrait(traits.Enchantment);
  bag.history = selectWeightedTrait(traits.History);
  bag.color = selectWeightedTrait(traits.Color);
  
  // Calculate weight based on capacity
  bag.weight = baseWeights[bag.capacity.name] || 8;
  
  // Generate unique ID
  bag.id = Math.random().toString(36).substr(2, 9);
  
  return bag;
}

// Draw the bag visualization
function drawBag(bag) {
  push();
  
  // Get color palette
  const colors = colorPalettes[bag.color.name] || colorPalettes.Grey;
  
  // Calculate size based on capacity
  const sizeMultiplier = Math.log2(bag.weight) / 10;
  const baseSize = min(width, height) * 0.3;
  const bagSize = baseSize * (0.5 + sizeMultiplier);
  
  // Draw bag shape based on type
  translate(width/2, height/2);
  
  // Apply enchantment effects
  if (bag.enchantment.name === "Glowing") {
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = colors[0];
  } else if (bag.enchantment.name === "Cosmic") {
    rotate(frameCount * 0.001);
  }
  
  // Set material properties
  strokeWeight(2);
  if (bag.material.name.includes("Metal") || bag.material.name === "Titanium") {
    stroke(100);
  } else {
    stroke(50);
  }
  
  // Draw based on bag type
  drawBagShape(bag.type.name, bagSize, colors);
  
  // Add details based on history
  if (bag.history.name === "Antique" || bag.history.name === "Relic") {
    drawWearMarks(bagSize);
  }
  
  pop();
}

// Draw specific bag shapes
function drawBagShape(type, size, colors) {
  fill(colors[0]);
  
  switch(type) {
    case "Satchel":
      // Rectangular with flap
      rect(-size/2, -size/3, size, size*0.8, 10);
      fill(colors[1]);
      arc(0, -size/3, size, size*0.4, PI, TWO_PI);
      break;
      
    case "Pouch":
      // Small circular
      ellipse(0, 0, size, size*1.2);
      fill(colors[1]);
      ellipse(0, -size/2, size*0.8, 20);
      break;
      
    case "Backpack":
      // Large rectangular with straps
      rect(-size/2, -size/2, size, size*1.2, 20);
      strokeWeight(5);
      noFill();
      // Straps
      arc(-size/3, 0, size*0.3, size*0.8, -PI/2, PI/2);
      arc(size/3, 0, size*0.3, size*0.8, PI/2, -PI/2);
      break;
      
    case "Chest":
      // Treasure chest shape
      fill(colors[0]);
      rect(-size/2, 0, size, size*0.6);
      fill(colors[1]);
      arc(0, 0, size, size*0.8, PI, TWO_PI);
      // Lock
      fill(colors[2] || colors[0]);
      rect(-size/10, -5, size/5, size/4);
      break;
      
    case "Barrel":
      // Cylindrical
      fill(colors[0]);
      ellipse(0, -size/3, size*0.9, size*0.3);
      rect(-size*0.45, -size/3, size*0.9, size*0.8);
      ellipse(0, size/2, size*0.9, size*0.3);
      // Bands
      stroke(colors[2] || 0);
      strokeWeight(4);
      line(-size*0.45, -size/6, size*0.45, -size/6);
      line(-size*0.45, size/6, size*0.45, size/6);
      break;
      
    case "Vault":
      // Heavy door shape
      fill(colors[0]);
      rect(-size/2, -size/2, size, size, 5);
      // Door
      fill(colors[1]);
      rect(-size*0.4, -size*0.4, size*0.8, size*0.8, 3);
      // Handle
      noFill();
      strokeWeight(8);
      circle(size*0.25, 0, size*0.2);
      break;
      
    case "Infinite":
      // Abstract infinite shape
      noFill();
      strokeWeight(3);
      for (let i = 0; i < 5; i++) {
        stroke(colors[i % colors.length]);
        push();
        rotate(i * PI/5);
        scale(1 - i*0.15);
        beginShape();
        for (let angle = 0; angle < TWO_PI; angle += 0.1) {
          const r = size/2 * (1 + 0.3 * sin(angle * 3));
          const x = r * cos(angle);
          const y = r * sin(angle);
          vertex(x, y);
        }
        endShape(CLOSE);
        pop();
      }
      break;
      
    default:
      // Generic bag shape
      rect(-size/2, -size/3, size, size, 20);
      fill(colors[1]);
      ellipse(0, -size/3, size*0.9, 30);
  }
}

// Add wear marks for aged bags
function drawWearMarks(size) {
  push();
  stroke(0, 30);
  strokeWeight(1);
  for (let i = 0; i < 10; i++) {
    const x = random(-size/2, size/2);
    const y = random(-size/2, size/2);
    const len = random(5, 20);
    const angle = random(TWO_PI);
    line(x, y, x + cos(angle)*len, y + sin(angle)*len);
  }
  pop();
}

// Draw UI elements
function drawUI() {
  push();
  fill(255);
  noStroke();
  rect(0, 0, width, 80);
  rect(0, height-120, width, 120);
  
  fill(0);
  textAlign(CENTER);
  textSize(24);
  text("QT Bags Generator", width/2, 30);
  textSize(14);
  text("Press SPACE to generate a new bag | S to save | R to reset seed", width/2, 55);
  
  if (currentBag) {
    textAlign(LEFT);
    textSize(12);
    const info = [
      `Type: ${currentBag.type.name} (${currentBag.type.rarity})`,
      `Capacity: ${currentBag.capacity.name} (Weight: ${currentBag.weight})`,
      `Material: ${currentBag.material.name}`,
      `Color: ${currentBag.color.name}`,
      `Enchantment: ${currentBag.enchantment.name}`,
      `History: ${currentBag.history.name}`,
      `ID: ${currentBag.id}`
    ];
    
    info.forEach((line, i) => {
      text(line, 20, height - 90 + i * 15);
    });
    
    // Rarity score
    const rarityScore = calculateRarityScore(currentBag);
    textAlign(RIGHT);
    textSize(16);
    fill(getRarityColor(rarityScore));
    text(`Rarity Score: ${rarityScore}`, width - 20, height - 20);
  }
  
  pop();
}

// Calculate overall rarity score
function calculateRarityScore(bag) {
  let score = 0;
  const traits = [bag.type, bag.capacity, bag.material, bag.enchantment, bag.history, bag.color];
  traits.forEach(trait => {
    score += (100 - (rarityWeights[trait.rarity] || 1));
  });
  return Math.round(score / traits.length);
}

// Get color based on rarity score
function getRarityColor(score) {
  if (score >= 90) return color(255, 215, 0); // Gold
  if (score >= 70) return color(147, 112, 219); // Purple
  if (score >= 50) return color(0, 100, 255); // Blue
  if (score >= 30) return color(0, 255, 0); // Green
  return color(150); // Grey
}

// p5.js setup
function setup() {
  createCanvas(800, 800);
  seed = Math.floor(random(100000));
  randomSeed(seed);
  currentBag = generateBag();
  noLoop();
}

// p5.js draw
function draw() {
  // Background gradient
  for (let i = 0; i <= height; i++) {
    const inter = map(i, 0, height, 0, 1);
    const c = lerpColor(color(240), color(200), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw the bag
  if (currentBag) {
    drawBag(currentBag);
  }
  
  // Draw UI
  drawUI();
}

// Keyboard controls
function keyPressed() {
  if (key === ' ') {
    currentBag = generateBag();
    redraw();
  } else if (key === 's' || key === 'S') {
    saveCanvas(`qt-bag-${currentBag.id}`, 'png');
  } else if (key === 'r' || key === 'R') {
    seed = Math.floor(random(100000));
    randomSeed(seed);
    currentBag = generateBag();
    redraw();
  }
}

// Mouse interaction for regeneration
function mousePressed() {
  if (mouseY > 80 && mouseY < height - 120) {
    currentBag = generateBag();
    redraw();
  }
}
const makeItems = (folder, prefix, count) =>
  Array.from({ length: count }, (_, i) =>
    `${folder}/${prefix} ${i + 1}.png`
  );

const garments = {
  "dresses & gowns": makeItems("dresses", "dress", 15),

  "blouses": makeItems("blouses", "blouse", 8),

  "aprons & pinafores": makeItems("aprons", "apron", 6),

  "petticoats & skirts": makeItems("skirts", "skirt", 8),

  "bloomers & pantaloons": makeItems("bloomers", "bloomers", 6),

  "woolens, wraps & cloaks": [
    ...makeItems("woolens", "cape", 3),
    ...makeItems("woolens", "cardigan", 6)
  ],

  "ballet attire": makeItems("ballet", "ballet", 8),

  "bathing finery": makeItems("swimwear", "swimwear", 3),

  "jewellery & eyewear": [
    ...makeItems("jewellery", "jewellery", 3),
    ...makeItems("jewellery", "glasses", 2)
  ],

  "headwear & hair adornments": [
    ...makeItems("headwear", "headwear", 2),
    ...makeItems("headwear", "accessories", 8)
  ],

  "undergarments & hosiery": [
    ...makeItems("undergarments", "camisole", 6),
    ...makeItems("undergarments", "socks", 5)
  ],

  "footwear": makeItems("footwear", "shoes", 9)
};


const drawerButtons = document.querySelectorAll(".drawer");
const categoryTitle = document.getElementById("category-title");
const garmentGrid = document.getElementById("garment-grid");
const garmentDisplay = document.querySelector(".garment-display");

const outfitArea = document.getElementById("outfit-area");
const clearButton = document.getElementById("clear-outfit");

const outfit = new Map();

let selectedItem = null;
let activeInteraction = null;


function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getImagePath(filename) {
  return `./garments/${filename}`;
}

function getItemLabel(filename) {
  return filename.split("/").pop().replace(".png", "");
}

function getDefaultWidth(category) {
  const widths = {
    "dresses & gowns": 0.65,
    "blouses": 0.42,
    "aprons & pinafores": 0.45,
    "petticoats & skirts": 0.52,
    "bloomers & pantaloons": 0.42,
    "woolens, wraps & cloaks": 0.52,
    "ballet attire": 0.42,
    "bathing finery": 0.42,
    "jewellery & eyewear": 0.22,
    "headwear & hair adornments": 0.30,
    "undergarments & hosiery": 0.30,
    "footwear": 0.32
  };

  return widths[category] || 0.45;
}

function showCategory(category) {
  categoryTitle.textContent = category;
  garmentGrid.innerHTML = "";

  const items = garments[category] || [];

  items.forEach(filename => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "garment";
    button.dataset.filename = filename;

    const image = document.createElement("img");
    image.src = getImagePath(filename);
    image.alt = getItemLabel(filename);
    image.loading = "lazy";
    image.draggable = false;

    button.setAttribute("aria-label", image.alt);
    button.setAttribute(
      "aria-pressed",
      String(outfit.has(filename))
    );

    if (outfit.has(filename)) {
      button.classList.add("in-outfit");
    }

    button.appendChild(image);

    button.addEventListener("click", () => {
      toggleGarment(filename, category);
    });

    garmentGrid.appendChild(button);
  });

  garmentDisplay.scrollTop = 0;
}

drawerButtons.forEach(button => {
  button.addEventListener("click", () => {
    drawerButtons.forEach(drawer => {
      drawer.classList.remove("active");
    });

    button.classList.add("active");
    showCategory(button.dataset.category);
  });
});


function toggleGarment(filename, category) {
  if (outfit.has(filename)) {
    removeGarment(filename);
  } else {
    addGarment(filename, category);
  }

  updateThumbnail(filename);
}

function updateThumbnail(filename) {
  const buttons = garmentGrid.querySelectorAll(".garment");

  buttons.forEach(button => {
    if (button.dataset.filename === filename) {
      const isAdded = outfit.has(filename);

      button.classList.toggle("in-outfit", isAdded);
      button.setAttribute(
        "aria-pressed",
        String(isAdded)
      );
    }
  });
}

function addGarment(filename, category) {
  const image = new Image();
  image.src = getImagePath(filename);
  image.draggable = false;
  image.alt = getItemLabel(filename);

  const item = document.createElement("div");
  item.className = "outfit-item";
  item.dataset.filename = filename;
  item.dataset.rotation = "0";

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";

  const rotateHandle = document.createElement("div");
  rotateHandle.className = "rotate-handle";

  const removeHandle = document.createElement("button");
  removeHandle.type = "button";
  removeHandle.className = "remove-handle";
  removeHandle.textContent = "×";
  removeHandle.setAttribute(
    "aria-label",
    `Remove ${getItemLabel(filename)}`
  );

  item.appendChild(image);
  item.appendChild(resizeHandle);
  item.appendChild(rotateHandle);
  item.appendChild(removeHandle);

  outfitArea.appendChild(item);
  outfit.set(filename, item);


  const placeImage = () => {
    if (!outfit.has(filename)) return;

    const areaWidth = outfitArea.clientWidth;
    const areaHeight = outfitArea.clientHeight;

    if (!areaWidth || !areaHeight) return;

    const aspect =
      image.naturalWidth / image.naturalHeight;

    if (!Number.isFinite(aspect) || aspect <= 0) {
      return;
    }

    const desiredWidth =
      areaWidth * getDefaultWidth(category);

    const width = Math.min(
      desiredWidth,
      areaHeight * 0.75 * aspect
    );

    const height = width / aspect;

    item.style.width = `${width}px`;
    item.style.height = `${height}px`;

    item.style.left =
      `${(areaWidth - width) / 2}px`;

    item.style.top =
      `${(areaHeight - height) / 2}px`;
  };

  if (image.complete && image.naturalWidth) {
    placeImage();
  } else {
    image.addEventListener(
      "load",
      placeImage,
      { once: true }
    );
  }

  item.addEventListener("pointerdown", event => {
    if (
      event.target === resizeHandle ||
      event.target === rotateHandle ||
      event.target === removeHandle
    ) {
      return;
    }

    startInteraction(event, item, "move");
  });

  resizeHandle.addEventListener(
    "pointerdown",
    event => {
      event.stopPropagation();
      startInteraction(event, item, "resize");
    }
  );

  rotateHandle.addEventListener(
    "pointerdown",
    event => {
      event.stopPropagation();
      startInteraction(event, item, "rotate");
    }
  );

  removeHandle.addEventListener(
    "pointerdown",
    event => {
      event.stopPropagation();
    }
  );

  removeHandle.addEventListener("click", event => {
    event.stopPropagation();

    removeGarment(filename);
    updateThumbnail(filename);
  });

  selectItem(item);
}

function removeGarment(filename) {
  const item = outfit.get(filename);
  if (!item) return;

  if (activeInteraction?.item === item) {
    activeInteraction = null;
  }

  if (selectedItem === item) {
    selectedItem = null;
  }

  item.remove();
  outfit.delete(filename);
}

function selectItem(item) {
  if (selectedItem) {
    selectedItem.classList.remove("selected");
  }

  selectedItem = item;

  if (item) {
    item.classList.add("selected");

    outfitArea.appendChild(item);
  }
}

outfitArea.addEventListener("pointerdown", event => {
  if (event.target === outfitArea) {
    selectItem(null);
  }
});

function startInteraction(event, item, mode) {
  if (
    event.button !== 0 &&
    event.pointerType === "mouse"
  ) {
    return;
  }

  event.preventDefault();
  selectItem(item);

  const rect = item.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  activeInteraction = {
    item,
    mode,
    pointerId: event.pointerId,

    startX: event.clientX,
    startY: event.clientY,

    left: item.offsetLeft,
    top: item.offsetTop,

    width: item.offsetWidth,
    height: item.offsetHeight,

    centerX,
    centerY,

    startAngle: Math.atan2(
      event.clientY - centerY,
      event.clientX - centerX
    ),

    initialRotation:
      Number(item.dataset.rotation || 0)
  };

  item.classList.add("dragging");

  event.currentTarget.setPointerCapture(event.pointerId);
}

function moveInteraction(event) {
  const interaction = activeInteraction;

  if (
    !interaction ||
    interaction.pointerId !== event.pointerId
  ) {
    return;
  }

  const { item, mode } = interaction;

  const dx = event.clientX - interaction.startX;
  const dy = event.clientY - interaction.startY;


  if (mode === "move") {
    const maxLeft = Math.max(
      0,
      outfitArea.clientWidth - item.offsetWidth
    );

    const maxTop = Math.max(
      0,
      outfitArea.clientHeight - item.offsetHeight
    );

    item.style.left =
      `${clamp(interaction.left + dx, 0, maxLeft)}px`;

    item.style.top =
      `${clamp(interaction.top + dy, 0, maxTop)}px`;
  }


  if (mode === "resize") {
    const aspect =
      interaction.width / interaction.height;

    if (
      !Number.isFinite(aspect) ||
      aspect <= 0
    ) {
      return;
    }

    const proposedWidth = Math.max(
      interaction.width + dx,
      (interaction.height + dy) * aspect
    );

    const maxWidth = Math.min(
      outfitArea.clientWidth - interaction.left,
      (outfitArea.clientHeight - interaction.top) * aspect
    );

    const width = clamp(
      proposedWidth,
      Math.min(30, maxWidth),
      maxWidth
    );

    item.style.width = `${width}px`;
    item.style.height = `${width / aspect}px`;
  }


  if (mode === "rotate") {
    const currentAngle = Math.atan2(
      event.clientY - interaction.centerY,
      event.clientX - interaction.centerX
    );

    const angleDifference =
      (currentAngle - interaction.startAngle) *
      (180 / Math.PI);

    const newRotation =
      interaction.initialRotation + angleDifference;

    item.dataset.rotation = String(newRotation);

    item.style.transform =
      `rotate(${newRotation}deg)`;
  }
}


function endInteraction(event) {
  if (!activeInteraction) return;

  if (
    event.pointerId !==
    activeInteraction.pointerId
  ) {
    return;
  }

  activeInteraction.item.classList.remove("dragging");
  activeInteraction = null;
}

outfitArea.addEventListener(
  "pointermove",
  moveInteraction
);

outfitArea.addEventListener(
  "pointerup",
  endInteraction
);

outfitArea.addEventListener(
  "pointercancel",
  endInteraction
);


clearButton.addEventListener("click", () => {
  outfit.clear();
  outfitArea.innerHTML = "";

  selectedItem = null;
  activeInteraction = null;

  garmentGrid
    .querySelectorAll(".garment")
    .forEach(button => {
      button.classList.remove("in-outfit");
      button.setAttribute(
        "aria-pressed",
        "false"
      );
    });
});

showCategory("dresses & gowns");

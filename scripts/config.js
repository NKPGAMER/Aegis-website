const version = '1.0-alpha';
let configData = {};
let draggedElement = null;
let draggedElementInitialY = 0;
let draggedElementCurrentY = 0;

async function fetchConfig() {
  try {
    updateStatus("Đang tải cấu hình mặc định...");
    const response = await fetch('https://api.github.com/repos/NKPGAMER/Aegis/contents/default.json');
    const data = await response.json();
    const content = atob(data.content);
    configData = JSON.parse(content);
    renderConfig(configData, document.getElementById('config-container'));
    updateStatus("Lấy dữ liệu hoàn tất.");
  } catch (error) {
    console.error('Error fetching config:', error);
    updateStatus("Lỗi khi tải cấu hình. Vui lòng thử lại.");
  }
}

function renderConfig(data, container, path = '') {
  for (const [key, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'boolean') {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'input-container';
      const label = document.createElement('label');
      label.textContent = `${key}:`;
      const switchLabel = document.createElement('label');
      switchLabel.className = 'switch';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = value;
      input.dataset.path = currentPath;
      const slider = document.createElement('span');
      slider.className = 'slider';
      switchLabel.appendChild(input);
      switchLabel.appendChild(slider);
      inputContainer.appendChild(label);
      inputContainer.appendChild(switchLabel);
      container.appendChild(inputContainer);
    } else if (typeof value === 'string' || typeof value === 'number') {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'input-container';
      const label = document.createElement('label');
      label.textContent = `${key} (${typeof value}):`;
      const input = document.createElement('input');
      input.type = typeof value === 'number' ? 'number' : 'text';
      input.value = value;
      input.dataset.path = currentPath;
      inputContainer.appendChild(label);
      inputContainer.appendChild(input);
      container.appendChild(inputContainer);
    } else if (Array.isArray(value)) {
      const group = document.createElement('div');
      group.className = 'group';
      const groupHeader = document.createElement('div');
      groupHeader.className = 'group-header';
      const groupTitle = document.createElement('h3');
      groupTitle.textContent = key;
      const addButton = document.createElement('button');
      addButton.textContent = 'Thêm';
      addButton.className = 'add-button';
      addButton.onclick = () => showAddItemDialog(group, currentPath);
      groupHeader.appendChild(groupTitle);
      groupHeader.appendChild(addButton);
      group.appendChild(groupHeader);
      container.appendChild(group);
      value.forEach((item, index) => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'input-container';
        itemContainer.draggable = true;
        itemContainer.addEventListener('dragstart', dragStart);
        itemContainer.addEventListener('dragover', dragOver);
        itemContainer.addEventListener('dragend', dragEnd);
        itemContainer.addEventListener('drop', drop);
        const menuButton = createMenuButton(itemContainer, group, currentPath, index);
        itemContainer.appendChild(menuButton);
        renderConfig({ [`${key}[${index}]`]: item }, itemContainer, currentPath);
        group.appendChild(itemContainer);
      });
    } else if (typeof value === 'object') {
      const group = document.createElement('div');
      group.className = 'group';
      const groupTitle = document.createElement('h3');
      groupTitle.textContent = key;
      group.appendChild(groupTitle);
      container.appendChild(group);
      renderConfig(value, group, currentPath);
    }
  }
}

function createMenuButton(itemContainer, group, path, index) {
  const menuButton = document.createElement('button');
  menuButton.className = 'menu-button';
  menuButton.style = 'color: rgb(220, 220, 20);';
  menuButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;

  let menu = null;
  let longPressTimer = null;

  menuButton.addEventListener('mousedown', (e) => {
    longPressTimer = setTimeout(() => {
      itemContainer.draggable = true;
    }, 500);
  });

  menuButton.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
    itemContainer.draggable = false;
  });

  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu) {
      menu.remove();
      menu = null;
    } else {
      menu = document.createElement('div');
      menu.className = 'menu';
      const editButton = document.createElement('button');
      editButton.textContent = 'Chỉnh sửa';
      editButton.onclick = () => showEditItemDialog(itemContainer, group, path, index);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Xóa';
      deleteButton.onclick = () => {
        group.removeChild(itemContainer);
        updateArrayIndices(group, path);
      };
      menu.appendChild(editButton);
      menu.appendChild(deleteButton);
      menuButton.appendChild(menu);
    }
  });

  return menuButton;
}

function showAddItemDialog(container, path) {
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  dialog.style.position = 'fixed';
  dialog.style.top = '50%';
  dialog.style.left = '50%';
  dialog.style.transform = 'translate(-50%, -50%)';
  dialog.style.zIndex = '1000';
  dialog.style.padding = '20px';
  dialog.style.backgroundColor = '#2a2a2a';

  let Type = '';
  const typeSelect = document.createElement('select');
  ['string', 'number', 'boolean', 'array', 'object'].forEach(type => {
    const option = document.createElement('option');
    option.style.margin = '10px';
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });

  const keyInput = document.createElement('input');
  keyInput.placeholder = 'Key';

  const valueInput = document.createElement('input');
  valueInput.placeholder = 'Value';

  const addButton = document.createElement('button');
  addButton.textContent = 'Thêm';
  addButton.className = 'ADD';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Huỷ';
  closeBtn.className = 'CANCEL';

  const overlay = document.createElement('div');
  overlay.className = 'blur-overlay';

  typeSelect.addEventListener("change", () => {
    // Xóa các phần tử cũ trước khi thêm cái mới
    dialog.innerHTML = '';
    dialog.appendChild(typeSelect);

    if (typeSelect.value === 'string' || typeSelect.value === 'number' || typeSelect.value === 'boolean') {
      dialog.appendChild(valueInput);
    } else if (typeSelect.value === 'object') {
      dialog.appendChild(keyInput);
      dialog.appendChild(valueInput);
    }

    dialog.appendChild(addButton);
    dialog.appendChild(closeBtn);
  });

  addButton.onclick = () => {
    const type = typeSelect.value;
    let value = valueInput.value;

    if (type === 'number') {
      value = Number(value);
    } else if (type === 'boolean') {
      value = value.toLowerCase() === 'true';
    } else if (type === 'array') {
      value = [];
    } else if (type === 'object') {
      const key = keyInput.value;
      if (!key) {
        alert('Key không được để trống!');
        return;
      }
      value = { [key]: null };
    }

    const newPath = `${path}[${container.children.length - 1}]`;
    const itemContainer = document.createElement('div');
    itemContainer.className = 'input-container';
    const menuButton = createMenuButton(itemContainer, container, path, container.children.length - 1);
    itemContainer.appendChild(menuButton);
    renderConfig({ ["new"]: value }, itemContainer, newPath);
    container.appendChild(itemContainer);

    document.body.removeChild(overlay);
    document.body.removeChild(dialog);

    if (type === 'object') {
      const objectContainer = container.lastChild;
      showAddItemDialog(objectContainer, `${newPath}[${keyInput.value}]`);
    }
  };

  closeBtn.onclick = () => {
    document.body.removeChild(dialog);
    document.body.removeChild(overlay);
  };

  dialog.appendChild(typeSelect);
  dialog.appendChild(valueInput);
  dialog.appendChild(addButton);
  dialog.appendChild(closeBtn);

  document.body.appendChild(overlay);
  document.body.appendChild(dialog);
}


function showEditItemDialog(itemContainer, group, path, index) {
  const dialog = document.createElement('div');
  dialog.className = 'group';
  dialog.style.position = 'fixed';
  dialog.style.top = '50%';
  dialog.style.left = '50%';
  dialog.style.transform = 'translate(-50%, -50%)';
  dialog.style.zIndex = '1000';
  dialog.style.padding = '20px';
  dialog.style.backgroundColor = '#2a2a2a';

  const currentValue = getValueFromPath(configData, `${path}[${index}]`);
  const currentKey = Object.keys(currentValue)[0];
  const currentValueType = typeof currentValue[currentKey];

  const typeSelect = document.createElement('select');
  ['string', 'number', 'boolean', 'array', 'object'].forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    if (type === currentValueType || (Array.isArray(currentValue[currentKey]) && type === 'array')) {
      option.selected = true;
    }
    typeSelect.appendChild(option);
  });

  const keyInput = document.createElement('input');
  keyInput.value = currentKey;
  keyInput.placeholder = 'Tên key';

  const valueInput = document.createElement('input');
  valueInput.value = JSON.stringify(currentValue[currentKey]);
  valueInput.placeholder = 'Giá trị';

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Lưu';
  saveButton.onclick = () => {
    const type = typeSelect.value;
    const key = keyInput.value;
    let value = valueInput.value;

    if (type === 'number') {
      value = Number(value);
    } else if (type === 'boolean') {
      value = value.toLowerCase() === 'true';
    } else if (type === 'array') {
      value = JSON.parse(value);
    } else if (type === 'object') {
      value = JSON.parse(value);
    }

    const newPath = `${path}[${index}]`;
    updateConfigValue(newPath, { [key]: value });

    itemContainer.innerHTML = '';
    const menuButton = createMenuButton(itemContainer, group, path, index);
    itemContainer.appendChild(menuButton);
    renderConfig({ [key]: value }, itemContainer, newPath);

    document.body.removeChild(dialog);
  };

  dialog.appendChild(typeSelect);
  dialog.appendChild(keyInput);
  dialog.appendChild(valueInput);
  dialog.appendChild(saveButton);

  document.body.appendChild(dialog);
}

function updateConfigData() {
  try {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      const path = input.dataset.path.split('.');
      let current = configData;

      for (let i = 0; i < path.length - 1; i++) {
        if (path[i].includes('[')) {
          const [arrayName, index] = path[i].split(/[\[\]]/);
          if (!current[arrayName]) {
            current[arrayName] = [];
          }
          if (!current[arrayName][parseInt(index)]) {
            current[arrayName][parseInt(index)] = {};
          }
          current = current[arrayName][parseInt(index)];
        } else {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }
      }

      const lastKey = path[path.length - 1];
      if (lastKey.includes('[')) {
        const [arrayName, index] = lastKey.split(/[\[\]]/);
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        if (input.type === 'checkbox') {
          current[arrayName][parseInt(index)] = input.checked;
        } else {
          current[arrayName][parseInt(index)] = input.type === 'number' ? Number(input.value) : input.value;
        }
      } else {
        if (input.type === 'checkbox') {
          current[lastKey] = input.checked;
        } else {
          current[lastKey] = input.type === 'number' ? Number(input.value) : input.value;
        }
      }
    });
  } catch (err) {
    updateStatus(err.message + err.stack);
    throw err;
  }
}

function updateConfigValue(path, value) {
  const parts = path.split('.');
  let current = configData;
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i].includes('[')) {
      const [arrayName, index] = parts[i].split(/[\[\]]/);
      current = current[arrayName][parseInt(index)];
    } else {
      current = current[parts[i]];
    }
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart.includes('[')) {
    const [arrayName, index] = lastPart.split(/[\[\]]/);
    current[arrayName][parseInt(index)] = value;
  } else {
    current[lastPart] = value;
  }
}

function getValueFromPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (part.includes('[')) {
      const [arrayName, index] = part.split(/[\[\]]/);
      current = current[arrayName][parseInt(index)];
    } else {
      current = current[part];
    }
  }
  return current;
}

function updateArrayIndices(container, path) {
  const items = container.querySelectorAll('.input-container');
  items.forEach((item, index) => {
    const inputs = item.querySelectorAll('input');
    inputs.forEach(input => {
      const inputPath = input.dataset.path;
      const newPath = inputPath.replace(/\[\d+\]/, `[${index}]`);
      input.dataset.path = newPath;
    });
  });
}

function dragStart(e) {
  draggedElement = this;
  draggedElementInitialY = e.clientY;
  setTimeout(() => this.classList.add('dragging'), 0);
}

function dragOver(e) {
  e.preventDefault();
  draggedElementCurrentY = e.clientY;
  const items = [...this.parentNode.querySelectorAll('.input-container:not(.dragging)')];
  const nextSibling = items.find(item => {
    return draggedElementCurrentY <= item.offsetTop + item.offsetHeight / 2;
  });
  this.parentNode.insertBefore(draggedElement, nextSibling);
}

function dragEnd() {
  this.classList.remove('dragging');
  draggedElement = null;
  updateArrayIndices(this.parentNode, this.parentNode.dataset.path);
}

function drop(e) {
  e.preventDefault();
}

async function saveConfig() {
  updateStatus("Xử lý cấu hinh");
  updateConfigData();
  const configContent = `export default ${JSON.stringify(configData, null, 2)};`;

  try {
    updateStatus("Tạo tệp nén...");
    const zip = new JSZip();

    updateStatus("Lấy dữ liệu");
    const repoContent = await fetchRepoContent('');
    await addFilesToZip(zip, repoContent);

    updateStatus("Tạo tệp config");
    zip.file('scripts/Data/config.js', configContent);

    updateStatus("Đang nén...");
    const content = await zip.generateAsync({ type: "blob" });
    const zipBlob = new Blob([content], { type: 'application/zip' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `Aegis_${version}.mcpack.zip`;

    downloadLink.click();

    updateStatus("Xong! Bắt đầu tải...");
  } catch (error) {
    console.error('Error saving config:', error);
    updateStatus("Lỗi khi lưu cấu hình. Vui lòng thử lại.");
  }
}

async function fetchRepoContent(path) {
  const response = await fetch(`https://api.github.com/repos/NKPGAMER/Aegis/contents/${path}`);
  return await response.json();
}

async function addFilesToZip(zip, items) {
  let totalFiles = items.filter(item => item.type === 'file').length;
  let processedFiles = 0;

  for (const item of items) {
    if (item.type === 'file') {
      const fileContent = await fetchFileContent(item.download_url);
      zip.file(item.path, fileContent);

      processedFiles += 1;
      const percent = (processedFiles / totalFiles) * 100;
      updateProgress(percent);
    } else if (item.type === 'dir') {
      const subItems = await fetchRepoContent(item.path);
      await addFilesToZip(zip, subItems);
    }
    updateStatus(`Đang xử lý\n${item.path}`);
  }
}


async function fetchFileContent(url) {
  const response = await fetch(url);
  const contentLength = response.headers.get('content-length');

  if (!contentLength) {
    return await response.arrayBuffer();
  }

  const reader = response.body.getReader();
  let receivedLength = 0;
  let chunks = [];
  const totalLength = parseInt(contentLength, 10);

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    const percent = (receivedLength / totalLength) * 100;
    updateProgress(percent);
  }

  let chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (let chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return chunksAll.buffer;
}


function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

function updateProgress(percent) {
  document.getElementById('progress').style.width = `${percent}%`;
}

updateStatus("Bắt đầu");

fetchConfig();
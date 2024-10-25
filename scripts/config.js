const version = '1.0-alpha';
const PackName = `Aegis_Anti_Cheat_v${version}.mcpack.zip`;
let configData = {};
let draggedElement = null;
let draggedElementInitialY = 0;
let draggedElementCurrentY = 0;

const API = {
  defaultConfig: 'https://api.github.com/repos/NKPGAMER/Aegis/contents/default.json',
  content: 'https://api.github.com/repos/NKPGAMER/Aegis/contents',
  download: 'https://github.com/NKPGAMER/Aegis/archive/refs/heads/main.zip'
}

async function fetchConfig() {
  try {
    updateStatus("Đang tải cấu hình...");
    const response = await fetch(API.defaultConfig);
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
  updateStatus("Processing configuration");
  updateConfigData();
  const configContent = `export default ${JSON.stringify(configData, null, 2)};`;

  try {
    updateStatus("Creating zip file...");
    const zip = new JSZip();

    updateStatus("Fetching data");
    const repoContent = await fetchRepoContent('');
    await addFilesToZip(zip, repoContent);

    updateStatus("Creating config file");
    zip.file('scripts/Data/config.js', configContent);

    updateStatus("Compressing...");
    const content = await zip.generateAsync({ type: "blob" });
    const zipBlob = new Blob([content], { type: 'application/zip' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `Aegis_${version}.mcpack.zip`;

    downloadLink.click();

    updateStatus("Done! Starting download...");
  } catch (error) {
    console.error('Error saving config:', error);
    updateStatus("Error saving configuration. Please try again.");
  }
}

async function addFilesToZip(zip, items) {
  const fileItems = items.filter(item => item.type === 'file');
  const dirItems = items.filter(item => item.type === 'dir');

  const totalFiles = fileItems.length;
  let processedFiles = 0;

  // Process all files concurrently
  await Promise.all(fileItems.map(async (item) => {
    const fileContent = await fetchFileContent(item.download_url);
    zip.file(item.path, fileContent);

    processedFiles += 1;
    const percent = (processedFiles / totalFiles) * 100;
    updateProgress(percent);
    updateStatus(`Processing ${item.path}`);
  }));

  // Process directories
  for (const item of dirItems) {
    const subItems = await fetchRepoContent(item.path);
    await addFilesToZip(zip, subItems);
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

async function fetchRepoContent(path) {
  const response = await fetch(`${API.content}/${path}`);
  return await response.json();
}

function OpenConfig() {
  fetchConfig();
  document.getElementById('container').style.display = 'grid';
  document.getElementById('download-config').style.display = 'none';
}
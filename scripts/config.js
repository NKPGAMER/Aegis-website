/* Made By NKPGAMER */
const version = '1.0-alpha';
const Package = `Aegis_V${version}.mcpack.zip`;
let configData = {};
let draggedElement = null;
let draggedElementInitialY = 0;
let draggedElementCurrentY = 0;

const api_defaultConfig = 'https://api.github.com/repos/NKPGAMER/Aegis/contents/default.json';
const api_contents = 'https://api.github.com/repos/NKPGAMER/Aegis/contents/';

async function fetchConfig() {
  try {
    updateStatus("Loading configuration...");
    const response = await fetch(api_defaultConfig);
    const data = await response.json();
    const content = atob(data.content);
    configData = JSON.parse(content);
    renderConfig(configData, document.getElementById('config-container'));
    updateStatus("Configuration load complete");
  } catch (error) {
    loadConfigFail(error);
  }
}

function loadConfigFail(error) {
  console.error(error);
  updateStatus("Configuration loading failed, please try again in a few seconds or minutes...");
}

function renderConfig(data, container, path = '') {
  for (const [key, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'boolean') {
      renderButton(container, key, value, currentPath);
    } else if (typeof value === 'string') {
      renderString(container, key, value, currentPath);
    } else if (typeof value === 'number') {
      renderNumber(container, key, value, currentPath);
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        //renderArray(container, key, value, currentPath);
      } else {
        renderObject(container, key, value, currentPath);
      }
    }
  }
}
function renderString(container, key, value, currentPath) {
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';

  const label = document.createElement('label');
  label.textContent = `${key}:`;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.dataset.path = currentPath;

  inputContainer.appendChild(label);
  inputContainer.appendChild(input);
  container.appendChild(inputContainer);
}

function renderNumber(container, key, value, currentPath) {
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';

  const label = document.createElement('label');
  label.textContent = `${key}:`;

  const input = document.createElement('input');
  input.type = 'number';
  input.value = value;
  input.dataset.path = currentPath;

  inputContainer.appendChild(label);
  inputContainer.appendChild(input);
  container.appendChild(inputContainer);
}

function renderButton(container, key, value, currentPath) {
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
}

function renderObject(container, key, value, currentPath) {
  const group = document.createElement('div');
  group.className = 'group';
  
  const groupTitle = document.createElement('h3');
  groupTitle.textContent = key;
  group.appendChild(groupTitle);
  
  container.appendChild(group);
  renderConfig(value, group, currentPath);
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
  updateStatus("Processing configuration...");
  updateConfigData();
  const configContent = `export default ${JSON.stringify(configData, null, 2)};`;

  try {
    const zip = new JSZip();
    const repoContent = await fetchRepoContent('');
    await addFilesToZip(zip, repoContent);
    
    zip.file('scripts/Data/config.js', configContent);

    updateStatus("Compressing...");
    const content = await zip.generateAsync({
      type: "blob"
    });
    const zipBlob = new Blob([content], {
      type: 'application/zip'
    });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = Package;

    downloadLink.click();
    updateStatus("Done. Start downloading");
  } catch (error) {
    console.error('Error saving config:', error);
    updateStatus("Lỗi khi lưu cấu hình. Vui lòng thử lại.");
  }
}

async function fetchRepoContent(path) {
  const response = await fetch(`${api_contents}${path}`);
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
    updateStatus(`Processing\n${item.path}`);
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
    const {
      done,
      value
    } = await reader.read();

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

fetchConfig();

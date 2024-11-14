const version = '1.0-alpha';
let configData = {};
let draggedElement = null;
let draggedElementInitialY = 0;
let draggedElementCurrentY = 0;

const API = {
  DEFAULT_CONFIG: 'https://api.github.com/repos/NKPGAMER/Aegis/contents/default.json',
  CONTENTS: 'https://api.github.com/repos/NKPGAMER/Aegis/contents'
};

async function fetchConfig(params) {
  try {
    const response = await fetch(API.DEFAULT_CONFIG);
    const data = await response.json();
    const content = atob(data.content);
    configData = JSON.parse(content);
    renderConfig(configData, document.getElementById('config-container'));
  } catch (error) {
    console.error(error);
    updateStatus("Error when load config");
  }
}

function headerString(container, key, value, currentPath) {
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  const label = document.createElement('label');
  label.textContent = key;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.dataset.path = currentPath;
  inputContainer.appendChild(label);
  inputContainer.appendChild(input);
  container.appendChild(inputContainer);
}

function headerNumber(container, key, value, currentPath) {
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  const label = document.createElement('label');
  label.textContent = key;
  const input = document.createElement('input');
  input.type = 'number';
  input.value = value;
  input.dataset.path = currentPath;
  inputContainer.appendChild(label);
  inputContainer.appendChild(input);
  container.appendChild(inputContainer);
}

function headerBoolean(container, key, value, currentPath) {
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

function renderConfig(data, container, path = '') {
  for (const [key, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string') headerString(container, key, value, currentPath);
    else if (typeof value === 'number') headerNumber(container, key, value, currentPath);
    else if (typeof value === 'boolean') headerBoolean(container, key, value, currentPath);
    else if (typeof value === 'object') {
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
  const response = await fetch(`${API.CONTENTS}/${path}`);
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

async function OpenConfig() {
  document.getElementById('download-config').style.display = 'none';
  document.getElementById('container').style.display = 'inline';
  updateStatus("Đang lấy dữ  liệu...");
  await fetchConfig();
}
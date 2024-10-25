const version = '1.0-alpha';
const PackName = `Aegis_Anti_Cheat_v${version}.mcpack.zip`;
let configData = {};
let draggedElement = null;
let draggedElementInitialY = 0;
let draggedElementCurrentY = 0;

// Giả định rằng bạn có tệp Config.js trong cùng thư mục hoặc đường dẫn tương ứng
import config from '../src/project/aegis/scripts/Data/Config';

async function loadConfig() {
  try {
    updateStatus("Đang tải cấu hình...");
    configData = config; // Gán trực tiếp cấu hình từ tệp Config.js
    renderConfig(configData, document.getElementById('config-container'));
    updateStatus("Lấy dữ liệu hoàn tất.");
  } catch (error) {
    console.error('Error loading config:', error);
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

async function saveConfig() {
  updateStatus("Đang xử lý cấu hình");
  updateConfigData();
  
  const configContent = `export default ${JSON.stringify(configData, null, 2)};`;

  try {
    updateStatus("Đang ghi vào tệp Config.js...");

    // Ghi đè tệp Config.js
    await writeFile('./Config.js', configContent); // Hàm này cần được định nghĩa

    updateStatus("Đang nén thư mục aegis...");
    const zip = new JSZip();
    
    // Thêm các file từ thư mục src/project/aegis/
    await addFilesToZip(zip, './src/project/aegis/'); // Cần một hàm đọc thư mục và thêm file vào zip

    updateStatus("Đang tạo file zip...");
    const content = await zip.generateAsync({ type: "blob" });
    const zipBlob = new Blob([content], { type: 'application/zip' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${PackName}`;

    downloadLink.click();
    updateStatus("Hoàn thành! Đang bắt đầu tải xuống...");
  } catch (error) {
    console.error('Error saving config:', error);
    updateStatus("Lỗi khi lưu cấu hình. Vui lòng thử lại.");
  }
}

async function addFilesToZip(zip, folderPath) {
  const items = await getFilesFromFolder(folderPath); // Cần hàm này để lấy danh sách file trong thư mục
  const totalFiles = items.length;
  let processedFiles = 0;

  // Xử lý tất cả các file đồng thời
  await Promise.all(items.map(async (item) => {
    const fileContent = await fetchFileContent(item); // Cần một hàm để lấy nội dung file
    zip.file(item.name, fileContent);

    processedFiles += 1;
    const percent = (processedFiles / totalFiles) * 100;
    updateProgress(percent);
    updateStatus(`Đang xử lý ${item.name}`);
  }));
}

async function fetchFileContent(filePath) {
  // Sử dụng File API hoặc tương tự để đọc nội dung file từ hệ thống
}

function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

function updateProgress(percent) {
  document.getElementById('progress').style.width = `${percent}%`;
}

async function writeFile(filePath, content) {
  // Hàm này cần được định nghĩa để ghi nội dung vào tệp
}

function getFilesFromFolder(folderPath) {
  // Hàm này cần được định nghĩa để trả về danh sách file trong thư mục
}

function OpenConfig() {
  loadConfig();
  document.getElementById('container').style.display = 'grid';
  document.getElementById('download-config').style.display = 'none';
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('pdfFile');
const previewList = document.getElementById('previewList');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const resetBtn = document.getElementById('resetBtn');
const reorderBtn = document.getElementById('reorderBtn');
const spinner = document.getElementById('loadingSpinner');
const message = document.getElementById('reorderMessage');
const downloadBtn = document.getElementById('downloadBtn');
const instructionBox = document.getElementById('instructionBox');

let originalFile = null;
let pages = [];
let pageOrder = [];
let sortableList = null;

['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('drop', async e => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type === 'application/pdf') {
        fileInput.files = e.dataTransfer.files;
        await handlePDF(files[0]);
    }
});

fileInput.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
        await handlePDF(fileInput.files[0]);
    }
});

resetBtn.addEventListener('click', () => {
    fileInput.value = '';
    originalFile = null;
    pages = [];
    pageOrder = [];
    previewList.innerHTML = '';
    fileNameDisplay.textContent = '';
    resetBtn.style.display = 'none';
    reorderBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    instructionBox.style.display = 'none';
    message.textContent = '';
    message.className = '';
    
    if (sortableList) {
        sortableList.destroy();
        sortableList = null;
    }
});

async function handlePDF(file) {
    originalFile = file;
    pages = [];
    pageOrder = [];
    previewList.innerHTML = '';
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    message.textContent = '';
    message.className = '';
    downloadBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    reorderBtn.style.display = 'inline-block';
    instructionBox.style.display = 'block';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pages.push(page);
        pageOrder.push(i - 1); 
        
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'preview-item';
        wrapper.dataset.index = i - 1;
        
        const label = document.createElement('span');
        label.textContent = `Strana ${i}`;
        
        const arrows = document.createElement('div');
        arrows.className = 'arrows';
        
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        upBtn.title = 'Posunúť hore';
        upBtn.onclick = (e) => {
            e.stopPropagation(); 
            movePageUp(parseInt(wrapper.dataset.index));
        };
        
        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        downBtn.title = 'Posunúť dole';
        downBtn.onclick = (e) => {
            e.stopPropagation(); 
            movePageDown(parseInt(wrapper.dataset.index));
        };
        
        arrows.appendChild(upBtn);
        arrows.appendChild(downBtn);
        
        wrapper.appendChild(canvas);
        wrapper.appendChild(label);
        wrapper.appendChild(arrows);
        previewList.appendChild(wrapper);
    }
    
    sortableList = Sortable.create(previewList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: updatePageOrder
    });
}

function updatePageOrder() {
    pageOrder = [];
    document.querySelectorAll('.preview-item').forEach(item => {
        pageOrder.push(parseInt(item.dataset.index));
    });
}

function movePageUp(index) {
    const items = document.querySelectorAll('.preview-item');
    const currentIndex = Array.from(items).findIndex(item => parseInt(item.dataset.index) === index);
    
    if (currentIndex <= 0) return; 
    
    const currentItem = items[currentIndex];
    const prevItem = items[currentIndex - 1];
    
    prevItem.parentNode.insertBefore(currentItem, prevItem);
    
    updatePageOrder();
}

function movePageDown(index) {
    const items = document.querySelectorAll('.preview-item');
    const currentIndex = Array.from(items).findIndex(item => parseInt(item.dataset.index) === index);
    
    if (currentIndex >= items.length - 1) return; 
    
    const currentItem = items[currentIndex];
    const nextItem = items[currentIndex + 1];
    
    if (nextItem.nextSibling) {
        nextItem.parentNode.insertBefore(currentItem, nextItem.nextSibling);
    } else {
        nextItem.parentNode.appendChild(currentItem);
    }
    
    updatePageOrder();
}

reorderBtn.addEventListener('click', async () => {
    if (!originalFile || pages.length === 0) return;
    
    spinner.style.display = 'block';
    message.textContent = '';
    message.className = '';
    downloadBtn.style.display = 'none';
    
    try {
        const formData = new FormData();
        formData.append('file', originalFile);
        formData.append('pageOrder', JSON.stringify(pageOrder));
        
        const accessToken = localStorage.getItem('access_token');
        
        const response = await fetch(`${BACKEND_URL}/pdf/reorder?access_type=frontend`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            downloadBtn.href = url;
            downloadBtn.download = 'reordered_' + originalFile.name;
            downloadBtn.style.display = 'inline-block';
            
            message.textContent = 'Poradie strán bolo úspešne zmenené.';
            message.classList.add('text-success');
        } else {
            const errorData = await response.json().catch(() => ({}));
            message.textContent = errorData.detail || 'Chyba pri zmene poradia strán.';
            message.classList.add('text-danger');
        }
    } catch (err) {
        console.error(err);
        message.textContent = 'Chyba pri komunikácii so serverom.';
        message.classList.add('text-danger');
    } finally {
        spinner.style.display = 'none';
    }
});
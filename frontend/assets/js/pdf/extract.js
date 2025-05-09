const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('pdfFile');
const previewList = document.getElementById('previewList');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const resetBtn = document.getElementById('resetBtn');
const extractBtn = document.getElementById('extractBtn');
const spinner = document.getElementById('loadingSpinner');
const message = document.getElementById('extractMessage');
const downloadBtn = document.getElementById('downloadBtn');
const rangeInputContainer = document.getElementById('rangeInputContainer');
const pageRangeInput = document.getElementById('pageRange');

let originalFile = null;
let totalPages = 0;
let selectedPages = [];

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
    totalPages = 0;
    selectedPages = [];
    previewList.innerHTML = '';
    fileNameDisplay.textContent = '';
    resetBtn.style.display = 'none';
    extractBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    rangeInputContainer.style.display = 'none';
    message.textContent = '';
    message.className = '';
    pageRangeInput.value = '';
});

async function handlePDF(file) {
    originalFile = file;
    selectedPages = [];
    previewList.innerHTML = '';
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    message.textContent = '';
    message.className = '';
    downloadBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    extractBtn.style.display = 'inline-block';
    rangeInputContainer.style.display = 'block';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    totalPages = pdf.numPages;

    const pagesToShow = Math.min(10, totalPages);
    
    for (let i = 1; i <= pagesToShow; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const wrapper = document.createElement('div');
        wrapper.className = 'preview-item';
        
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'page-checkbox';
        checkbox.dataset.page = i; 
        
        checkbox.addEventListener('change', function() {
            const pageNum = parseInt(this.dataset.page);
            const index = selectedPages.indexOf(pageNum);
            
            if (this.checked && index === -1) {
                selectedPages.push(pageNum);
                wrapper.classList.add('selected');
            } else if (!this.checked && index !== -1) {
                selectedPages.splice(index, 1);
                wrapper.classList.remove('selected');
            }
            
            updatePageRangeInput();
        });
        
        checkboxContainer.appendChild(checkbox);
        
        const label = document.createElement('span');
        label.textContent = `Strana ${i}`;

        wrapper.appendChild(canvas);
        wrapper.appendChild(checkboxContainer);
        wrapper.appendChild(label);
        
        wrapper.addEventListener('click', function(e) {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                const event = new Event('change');
                checkbox.dispatchEvent(event);
            }
        });
        
        previewList.appendChild(wrapper);
    }
    
    if (totalPages > 10) {
        const morePages = document.createElement('div');
        morePages.className = 'text-center mt-3 mb-3';
        morePages.innerHTML = `<p class="text-muted">Zobrazených prvých 10 z ${totalPages} strán. Pre extrakciu konkrétnych strán použite textové pole nižšie.</p>`;
        previewList.appendChild(morePages);
    }
    
    pageRangeInput.value = '';
}

function updatePageRangeInput() {
    if (selectedPages.length === 0) {
        pageRangeInput.value = '';
        return;
    }
    
    selectedPages.sort((a, b) => a - b);
    
    const ranges = [];
    let start = selectedPages[0];
    let end = start;
    
    for (let i = 1; i < selectedPages.length; i++) {
        if (selectedPages[i] === end + 1) {
            end = selectedPages[i];
        } else {
            ranges.push(start === end ? start.toString() : `${start}-${end}`);
            start = end = selectedPages[i];
        }
    }
    
    ranges.push(start === end ? start.toString() : `${start}-${end}`);
    pageRangeInput.value = ranges.join(',');
}

pageRangeInput.addEventListener('input', function() {
    document.querySelectorAll('.page-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        const wrapper = checkbox.closest('.preview-item');
        if (wrapper) wrapper.classList.remove('selected');
    });
    
    selectedPages = [];
    
    if (!this.value.trim()) return;
    
    try {
        selectedPages = parsePageRanges(this.value, totalPages);
        
        selectedPages.forEach(pageNum => {
            const checkbox = document.querySelector(`.page-checkbox[data-page="${pageNum}"]`);
            if (checkbox) {
                checkbox.checked = true;
                const wrapper = checkbox.closest('.preview-item');
                if (wrapper) wrapper.classList.add('selected');
            }
        });
    } catch (error) {
        console.error('Chyba pri parsovaní rozsahu strán:', error);
    }
});

function parsePageRanges(rangeText, maxPage) {
    const pages = new Set();
    
    const parts = rangeText.split(',');
    
    parts.forEach(part => {
        part = part.trim();
        
        if (!part) return;
        
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-').map(s => s.trim());
            
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            
            if (isNaN(start) || isNaN(end)) {
                throw new Error(`Neplatný rozsah: ${part}`);
            }
            
            if (start > end) {
                throw new Error(`Neplatný rozsah, začiatok je väčší ako koniec: ${part}`);
            }
            
            for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= maxPage) {
                    pages.add(i);
                }
            }
        } else {
            const pageNum = parseInt(part);
            
            if (isNaN(pageNum)) {
                throw new Error(`Neplatné číslo strany: ${part}`);
            }
            
            if (pageNum >= 1 && pageNum <= maxPage) {
                pages.add(pageNum);
            }
        }
    });
    
    return Array.from(pages);
}

extractBtn.addEventListener('click', async () => {
    if (!originalFile) return;
    
    if (selectedPages.length === 0 && !pageRangeInput.value.trim()) {
        message.textContent = 'Vyberte aspoň jednu stranu na extrahovanie.';
        message.classList.add('text-danger');
        return;
    }
    
    spinner.style.display = 'block';
    message.textContent = '';
    message.className = '';
    downloadBtn.style.display = 'none';
    
    try {
        if (pageRangeInput.value.trim() && selectedPages.length === 0) {
            try {
                selectedPages = parsePageRanges(pageRangeInput.value, totalPages);
            } catch (error) {
                message.textContent = 'Neplatný formát rozsahu strán. Použite formát: 1-3,5,7-9';
                message.classList.add('text-danger');
                spinner.style.display = 'none';
                return;
            }
        }
        
        const formData = new FormData();
        formData.append('file', originalFile);
        formData.append('pagesToExtract', JSON.stringify(selectedPages));
        
        const accessToken = localStorage.getItem('access_token');
        
        const response = await fetch(`${BACKEND_URL}/pdf/extract?access_type=frontend`, {
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
            downloadBtn.download = 'extracted_' + originalFile.name;
            downloadBtn.style.display = 'inline-block';
            
            message.textContent = 'Strany boli úspešne extrahované.';
            message.classList.add('text-success');
        } else {
            const errorData = await response.json().catch(() => ({}));
            message.textContent = errorData.detail || 'Chyba pri extrahovaní strán.';
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
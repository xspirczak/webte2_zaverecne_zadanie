const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('pdfFile');
const previewArea = document.getElementById('previewArea');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const resetBtn = document.getElementById('resetBtn');
const convertBtn = document.getElementById('convertBtn');
const spinner = document.getElementById('loadingSpinner');
const message = document.getElementById('convertMessage');
const textPreview = document.getElementById('textPreview');
const textContent = document.getElementById('textContent');
const downloadButtons = document.getElementById('downloadButtons');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');

let originalFile = null;
let extractedText = '';

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
    extractedText = '';
    previewArea.innerHTML = '';
    fileNameDisplay.textContent = '';
    textContent.textContent = '';
    resetBtn.style.display = 'none';
    convertBtn.style.display = 'none';
    textPreview.style.display = 'none';
    downloadButtons.style.display = 'none';
    message.textContent = '';
    message.className = '';
});

async function handlePDF(file) {
    originalFile = file;
    extractedText = '';
    previewArea.innerHTML = '';
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    message.textContent = '';
    message.className = '';
    textPreview.style.display = 'none';
    downloadButtons.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    convertBtn.style.display = 'inline-block';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    if (pdf.numPages > 0) {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        previewArea.appendChild(canvas);
    }
}

convertBtn.addEventListener('click', async () => {
    if (!originalFile) return;
    
    spinner.style.display = 'block';
    message.textContent = '';
    message.className = '';
    textPreview.style.display = 'none';
    downloadButtons.style.display = 'none';
    
    try {
        const formData = new FormData();
        formData.append('file', originalFile);
        
        const accessToken = localStorage.getItem('access_token');
        
        const response = await fetch(`${BACKEND_URL}/pdf/convert?access_type=frontend`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            extractedText = result.text;
            
            const previewText = extractedText.length > 20000 
                ? extractedText.substring(0, 2000) + '...' 
                : extractedText;
            
            textContent.textContent = previewText;
            textPreview.style.display = 'block';
            
            const txtBlob = new Blob([extractedText], { type: 'text/plain' });
            const txtUrl = URL.createObjectURL(txtBlob);
            downloadTxtBtn.href = txtUrl;
            downloadTxtBtn.download = getFileNameWithoutExtension(originalFile.name) + '.txt';
            
            
         
            
            downloadButtons.style.display = 'block';
            
            message.textContent = 'PDF bolo úspešne konvertované do textu.';
            message.classList.add('text-success');
        } else {
            const errorData = await response.json().catch(() => ({}));
            message.textContent = errorData.detail || 'Chyba pri konverzii PDF do textu.';
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

function getFileNameWithoutExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
}
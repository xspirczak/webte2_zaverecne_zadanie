const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('pdfFile');
const previewArea = document.getElementById('previewArea');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const resetBtn = document.getElementById('resetBtn');
const compressBtn = document.getElementById('compressBtn');
const spinner = document.getElementById('loadingSpinner');
const message = document.getElementById('compressMessage');
const downloadBtn = document.getElementById('downloadBtn');
const sizeInfo = document.getElementById('sizeInfo');
const originalSizeElem = document.getElementById('originalSize');
const newSizeElem = document.getElementById('newSize');
const reductionElem = document.getElementById('reduction');

let originalFile = null;

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
    previewArea.innerHTML = '';
    fileNameDisplay.textContent = '';
    resetBtn.style.display = 'none';
    compressBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    sizeInfo.style.display = 'none';
    message.textContent = '';
    message.className = '';
});

async function handlePDF(file) {
    originalFile = file;
    previewArea.innerHTML = '';
    fileNameDisplay.textContent = `Vybraný súbor: ${file.name}`;
    message.textContent = '';
    message.className = '';
    downloadBtn.style.display = 'none';
    sizeInfo.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    compressBtn.style.display = 'inline-block';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;
    previewArea.appendChild(canvas);
}

compressBtn.addEventListener('click', async () => {
    if (!originalFile) return;

    spinner.style.display = 'block';
    message.textContent = '';
    message.className = '';
    downloadBtn.style.display = 'none';
    sizeInfo.style.display = 'none';

    const compressionLevel = document.getElementById('compressionLevel').value;

    const formData = new FormData();
    formData.append('file', originalFile);
    formData.append('compressionLevel', compressionLevel);

    try {
        const accessToken = localStorage.getItem('access_token');

        const response = await fetch(`${BACKEND_URL}/pdf/compress?access_type=frontend`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const originalFileSize = formatFileSize(originalFile.size);
            const compressedFileSize = formatFileSize(blob.size);
            const reductionPercentage = calculateReduction(originalFile.size, blob.size);

            originalSizeElem.textContent = originalFileSize;
            newSizeElem.textContent = compressedFileSize;
            reductionElem.textContent = reductionPercentage;

            sizeInfo.style.display = 'block';
            
            downloadBtn.href = url;
            downloadBtn.download = 'compressed_' + originalFile.name;
            downloadBtn.style.display = 'inline-block';
            
            message.textContent = 'PDF bolo úspešne komprimované.';
            message.classList.add('text-success');
        } else {
            const errorData = await response.json();
            message.textContent = errorData.detail || 'Chyba pri komprimovaní PDF.';
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

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function calculateReduction(originalSize, newSize) {
    const reduction = ((originalSize - newSize) / originalSize) * 100;
    return reduction.toFixed(2) + '%';
}
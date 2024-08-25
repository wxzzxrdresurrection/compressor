const dropArea = document.querySelector('.drop-area');
const dragText = dropArea.querySelector('h2');
const button = dropArea.querySelector('button');
const input = dropArea.querySelector('#input-file');
const compressBtn = document.querySelector('#compress-btn');
const progressBar = document.querySelector('#progress-bar');
const cleanBtn = document.querySelector('#clean-btn');
let files;

progressBar.style.display = 'none';
compressBtn.style.display = 'none';

document.querySelector("#preview").addEventListener('click', function(e) {
    if (e.target.classList.contains('img-rmv')) {
        console.log(e.target);
        const index = e.target.getAttribute('data-index'); // Obtiene el índice del atributo data-index
        const imgContainer = document.getElementById(`img-${index}`);
        imgContainer.remove();
    }    
});

button.addEventListener('click', (e) => {
    input.click();
});

input.addEventListener('change', (e) => {
    files = e.target.files;
    showFiles(files);
    dropArea.classList.remove('active');
    progressBar.style.display = 'block';
    compressBtn.style.display = 'block';
});

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('active');
    dragText.textContent = 'Suelta para subir las imágenes';
});

dropArea.addEventListener('dragleave', (e) => {
    dropArea.classList.remove('active');
    dragText.textContent = 'Arrastra y suelta las imágenes';
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    files = e.dataTransfer.files;
    showFiles(files);
    dropArea.classList.remove('active');
    dragText.textContent = 'Arrastra y suelta las imágenes';
});

compressBtn.addEventListener('click', () => {
    compressImages();
});

cleanBtn.addEventListener('click', () => {
    document.querySelector("#preview").innerHTML = '';
    compressBtn.style.display = 'none';
    progressBar.style.display = 'none';
    files = [];
});


function showFiles(files) {
    if (files.length > 0) {
        compressBtn.style.display = 'block';
    }
    let index = 0;

    if (files.length === undefined) {
        processFile(files, index);
    } else {
        for (const file of files) {
            processFile(file, index);
            index++;
        }
    }
}

function processFile(file, index) {
    const docType = file.type;
    const validExtensions = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (validExtensions.includes(docType)) {
        const reader = new FileReader();
        const id = `file-${Math.random().toString(32).substring(7)}`
        
        reader.addEventListener('load', e => {
            const fileUrl = reader.result;
            const img = `
                <div class="img-container" id="img-${index}">
                    <img src="${fileUrl}" alt="${file.name}" width="50">
                    <span class="img-name">${file.name}</span>
                    <span class="img-rmv" data-index="${index}">x</span>
                </div>
            `;
            console.log(index);
            document.querySelector("#preview").innerHTML += img;
        });
        reader.readAsDataURL(file);
    } else {
        alert('El archivo no es una imagen');
    }
}

function compressImages() {
    if (files.length === 0) {
        alert('No hay imágenes para comprimir');
        return;
    }
    progressBar.style.display = 'block';
    compressAndDownloadImages(files);
   
}

async function handleImageUpload(file, zip, progressCallback) {

    const imageFile = file;
    console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
    console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);
  
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }
    try {
        const compressedFile = await imageCompression(imageFile, options);
        console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
        console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB

        zip.file(file.name, compressedFile);
        progressCallback();
    } catch (error) {
      console.log(error);
    }  
}

function saveAs(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
}

async function compressAndDownloadImages(files) {
    const zip = new JSZip();
    const promises = [];
    const progressBar = document.getElementById('progress-bar');
    let completed = 0;

    const updateProgress = () => {
        completed += 1;
        progressBar.value = (completed / files.length) * 100;
    };

    for (const file of files) {
        promises.push(handleImageUpload(file, zip, updateProgress));
    }

    try {
        await Promise.all(promises);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "images.zip");
        console.log('ZIP file created and download triggered');
    } catch (error) {
        console.error('Error generating ZIP file:', error);
    }
}
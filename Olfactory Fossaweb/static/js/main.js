document.addEventListener('DOMContentLoaded', function () {
    // 1. Image Upload Preview
    const fileInput = document.getElementById('scan_file');
    const imagePreview = document.getElementById('image_preview');
    const previewContainer = document.getElementById('preview_container');
    const uploadLabel = document.getElementById('upload_label');

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.setAttribute('src', e.target.result);
                    previewContainer.classList.remove('d-none');
                    uploadLabel.innerHTML = `<i class="bi bi-file-earmark-check text-success fs-1"></i><br>File selected: <b>${file.name}</b>`;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. Loading Animation on Form Submission (Analysis)
    const analysisForm = document.getElementById('analysis_form');
    const loader = document.getElementById('analysis_loader');
    const loadingSteps = document.getElementById('loading_steps');

    if (analysisForm && loader) {
        analysisForm.addEventListener('submit', function () {
            loader.style.display = 'flex';
            
            // Cycle through simulation text steps for user experience
            const messages = [
                "Validating Scan Image Format...",
                "Running Adaptive Histogram Equalization...",
                "Segmenting Olfactory Region...",
                "Scanning Landmarks (Cribriform Plate / Fovea)...",
                "Calculating Left & Right Fossa Depth...",
                "Applying Keros Classifications...",
                "Compiling Surgical Risk Matrices...",
                "Writing Metadata & Generating PDF Report..."
            ];
            
            let i = 0;
            const timer = setInterval(() => {
                if (i < messages.length) {
                    loadingSteps.textContent = messages[i];
                    i++;
                } else {
                    clearInterval(timer);
                }
            }, 1200);
        });
    }

    // 3. Auto-dismiss alerts
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 4000);
});

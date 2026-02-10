export function initAdminAssetUploadDropzones() {
  const forms = document.querySelectorAll('[data-asset-upload-form]');
  if (!forms.length) return;

  const setDroppedFile = (input, file) => {
    if (!input || !file || typeof DataTransfer === 'undefined') return false;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    return true;
  };

  forms.forEach((form) => {
    const input = form.querySelector('[data-asset-file-input]');
    const dropzone = form.querySelector('[data-asset-dropzone]');
    const submit = form.querySelector('[data-asset-submit]');
    const fileName = form.querySelector('[data-asset-file-name]');

    if (!input || !dropzone || !submit) return;

    const updateState = () => {
      const hasFile = !!(input.files && input.files.length > 0);
      submit.disabled = !hasFile;

      if (!fileName) return;
      if (!hasFile) {
        fileName.classList.add('hidden');
        fileName.textContent = '';
        return;
      }

      fileName.classList.remove('hidden');
      fileName.textContent = 'Archivo: ' + input.files[0].name;
    };

    const clearDragState = () => {
      dropzone.classList.remove('border-sky-400', 'bg-sky-50', 'text-sky-700');
    };

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-sky-400', 'bg-sky-50', 'text-sky-700');
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-sky-400', 'bg-sky-50', 'text-sky-700');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (e.target === dropzone) {
        clearDragState();
      }
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      clearDragState();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      if (!setDroppedFile(input, files[0])) {
        input.click();
        return;
      }

      updateState();
    });

    input.addEventListener('change', updateState);
    updateState();
  });
}

import { useEffect } from 'react';

type ProductFormEnhancementsProps = {
  rootId: string;
};

type Nullable<T> = T | null;

export default function ProductFormEnhancements({ rootId }: ProductFormEnhancementsProps) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const preventNegativeMargin = root.dataset.preventNegativeMargin === '1';
    const priceResolveUrl = root.dataset.priceResolveUrl || '';
    const productId = Number(root.dataset.productId || 0);

    const byId = <T extends HTMLElement>(idKey: string): Nullable<T> => {
      const id = root.dataset[idKey];
      if (!id) return null;
      return document.getElementById(id) as Nullable<T>;
    };

    const form = byId<HTMLFormElement>('formId');
    const categoryInput = document.querySelector('select[name="category_id"]') as Nullable<HTMLSelectElement>;
    const costInput = byId<HTMLInputElement>('costInputId');
    const priceInput = byId<HTMLInputElement>('priceInputId');
    const priceHint = byId<HTMLElement>('priceHintId');
    const marginAlert = byId<HTMLElement>('marginAlertId');
    const applyRecommendedBtn = byId<HTMLButtonElement>('applyRecommendedBtnId');
    const recommendedBadge = byId<HTMLElement>('recommendedBadgeId');

    const imageInput = byId<HTMLInputElement>('imageInputId');
    const preview = byId<HTMLImageElement>('previewId');
    const previewEmpty = byId<HTMLElement>('previewEmptyId');
    const openCameraBtn = byId<HTMLButtonElement>('openCameraBtnId');
    const captureCameraBtn = byId<HTMLButtonElement>('captureCameraBtnId');
    const closeCameraBtn = byId<HTMLButtonElement>('closeCameraBtnId');
    const cameraWrap = byId<HTMLElement>('cameraWrapId');
    const cameraVideo = byId<HTMLVideoElement>('cameraVideoId');

    const canUseCamera = !!(
      imageInput &&
      preview &&
      previewEmpty &&
      openCameraBtn &&
      captureCameraBtn &&
      closeCameraBtn &&
      cameraWrap &&
      cameraVideo
    );

    let stream: MediaStream | null = null;
    let suggestedPrice: number | null = null;

    const money = (n: number): string => {
      const value = Number.isFinite(n) ? n : 0;
      return `$ ${new Intl.NumberFormat('es-AR').format(value)}`;
    };

    const toPreview = (file: File): void => {
      if (!preview || !previewEmpty) return;
      const objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      preview.classList.remove('hidden');
      previewEmpty.classList.add('hidden');
    };

    const loadImage = (file: File): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('image_load_failed'));
        img.src = URL.createObjectURL(file);
      });

    const cropToSquare = async (file: File): Promise<File | null> => {
      const img = await loadImage(file);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = Math.floor((img.naturalWidth - side) / 2);
      const sy = Math.floor((img.naturalHeight - side) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);

      const type = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
      if (!blob) return null;

      const ext = type === 'image/png' ? 'png' : (type === 'image/webp' ? 'webp' : 'jpg');
      const name = (file.name || 'producto').replace(/\.[^.]+$/, '');
      return new File([blob], `${name}_square.${ext}`, { type });
    };

    const setInputFile = (file: File): void => {
      if (!imageInput || typeof DataTransfer === 'undefined') return;
      const dt = new DataTransfer();
      dt.items.add(file);
      imageInput.files = dt.files;
    };

    const stopCamera = (): void => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (!canUseCamera || !cameraVideo || !cameraWrap || !captureCameraBtn || !closeCameraBtn) return;
      cameraVideo.srcObject = null;
      cameraWrap.classList.add('hidden');
      captureCameraBtn.classList.add('hidden');
      closeCameraBtn.classList.add('hidden');
    };

    const startCamera = async (): Promise<void> => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        window.alert('Tu navegador no soporta camara web.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!canUseCamera || !cameraVideo || !cameraWrap || !captureCameraBtn || !closeCameraBtn) return;
        cameraVideo.srcObject = stream;
        cameraWrap.classList.remove('hidden');
        captureCameraBtn.classList.remove('hidden');
        closeCameraBtn.classList.remove('hidden');
      } catch (_error) {
        window.alert('No se pudo acceder a la camara. Revisa permisos del navegador.');
      }
    };

    const updateMarginGuardUI = (): boolean => {
      if (!costInput || !priceInput || !marginAlert) return true;
      const cost = parseInt(String(costInput.value || '').trim(), 10);
      const price = parseInt(String(priceInput.value || '').trim(), 10);

      marginAlert.classList.add('hidden');
      marginAlert.textContent = '';
      marginAlert.classList.remove(
        'border-rose-200',
        'bg-rose-50',
        'text-rose-700',
        'border-amber-200',
        'bg-amber-50',
        'text-amber-700',
        'border-emerald-200',
        'bg-emerald-50',
        'text-emerald-700'
      );

      if (!Number.isFinite(cost) || !Number.isFinite(price) || cost < 0 || price < 0) return true;

      const diff = price - cost;
      const marginPercent = cost > 0 ? (diff / cost) * 100 : 0;
      const marginLabel = `${marginPercent >= 0 ? '+' : ''}${marginPercent.toFixed(1)}%`;

      if (price < cost) {
        marginAlert.classList.remove('hidden');
        marginAlert.classList.add('border-rose-200', 'bg-rose-50', 'text-rose-700');
        marginAlert.textContent = preventNegativeMargin
          ? `Atencion: margen ${marginLabel} (${money(diff)}). Con el guard activo no se puede guardar.`
          : `Atencion: margen ${marginLabel} (${money(diff)}).`;
        return !preventNegativeMargin;
      }

      if (price === cost) {
        marginAlert.classList.remove('hidden');
        marginAlert.classList.add('border-amber-200', 'bg-amber-50', 'text-amber-700');
        marginAlert.textContent = 'Margen 0.0% (sin utilidad).';
        return true;
      }

      marginAlert.classList.remove('hidden');
      marginAlert.classList.add('border-emerald-200', 'bg-emerald-50', 'text-emerald-700');
      marginAlert.textContent = `Margen ${marginLabel}. Utilidad: ${money(diff)}.`;
      return true;
    };

    const applyRecommendedPrice = async (): Promise<void> => {
      if (
        !priceResolveUrl ||
        !categoryInput ||
        !costInput ||
        !priceInput ||
        !priceHint ||
        !applyRecommendedBtn ||
        !recommendedBadge
      ) return;

      const categoryId = String(categoryInput.value || '').trim();
      const costRaw = String(costInput.value || '').trim();
      const costValue = parseInt(costRaw, 10);

      if (!categoryId || !Number.isFinite(costValue) || costValue < 0) {
        priceHint.textContent = productId > 0
          ? 'Ajusta costo/categoria para recalcular precio recomendado.'
          : 'Define categoria + costo para calcular automaticamente.';
        recommendedBadge.classList.add('hidden');
        applyRecommendedBtn.disabled = true;
        suggestedPrice = null;
        return;
      }

      const query = new URLSearchParams({
        category_id: categoryId,
        cost_price: String(costValue),
      });
      if (productId > 0) query.set('product_id', String(productId));

      try {
        const response = await fetch(`${priceResolveUrl}?${query.toString()}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
          credentials: 'same-origin',
        });
        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; recommended_price?: number; margin_percent?: number; rule?: { name?: string } }
          | null;

        if (!response.ok || !data || !data.ok) {
          priceHint.textContent = 'No se pudo calcular precio recomendado.';
          recommendedBadge.classList.add('hidden');
          applyRecommendedBtn.disabled = true;
          suggestedPrice = null;
          return;
        }

        suggestedPrice = parseInt(String(data.recommended_price ?? '0'), 10);
        if (!Number.isFinite(suggestedPrice) || suggestedPrice < 0) {
          suggestedPrice = null;
          recommendedBadge.classList.add('hidden');
          applyRecommendedBtn.disabled = true;
          return;
        }

        recommendedBadge.textContent = `Recomendado: ${money(suggestedPrice)}`;
        recommendedBadge.classList.remove('hidden');
        applyRecommendedBtn.disabled = false;
        priceHint.textContent = data.rule?.name
          ? `Regla: ${data.rule.name} (${data.margin_percent}% margen).`
          : `Sin regla especifica. Margen base: ${data.margin_percent}%.`;
      } catch (_error) {
        priceHint.textContent = 'No se pudo calcular precio recomendado.';
        recommendedBadge.classList.add('hidden');
        applyRecommendedBtn.disabled = true;
        suggestedPrice = null;
      }
    };

    const onImageChange = async (): Promise<void> => {
      if (!imageInput || !preview || !previewEmpty) return;
      const file = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
      if (!file) {
        preview.src = '';
        preview.classList.add('hidden');
        previewEmpty.classList.remove('hidden');
        return;
      }

      let finalFile = file;
      try {
        if (file.type.startsWith('image/')) {
          const cropped = await cropToSquare(file);
          if (cropped) {
            finalFile = cropped;
            setInputFile(cropped);
          }
        }
      } catch (_error) {
        finalFile = file;
      }
      toPreview(finalFile);
    };

    const onCapture = async (): Promise<void> => {
      if (!cameraVideo || !imageInput) return;
      if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) return;

      const side = Math.min(cameraVideo.videoWidth, cameraVideo.videoHeight);
      const sx = Math.floor((cameraVideo.videoWidth - side) / 2);
      const sy = Math.floor((cameraVideo.videoHeight - side) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(cameraVideo, sx, sy, side, side, 0, 0, side, side);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) return;

      const file = new File([blob], `producto_${Date.now()}_square.jpg`, { type: 'image/jpeg' });
      setInputFile(file);
      toPreview(file);
      stopCamera();
    };

    const onApplyRecommended = (): void => {
      if (!priceInput || !Number.isFinite(suggestedPrice)) return;
      priceInput.value = String(suggestedPrice);
      if (priceHint) priceHint.textContent = 'Precio recomendado aplicado. Puedes ajustarlo manualmente si queres.';
      updateMarginGuardUI();
    };

    const onSubmit = (event: Event): void => {
      const ok = updateMarginGuardUI();
      if (!ok && priceInput) {
        event.preventDefault();
        priceInput.focus();
      }
    };

    const onBeforeUnload = (): void => stopCamera();

    if (canUseCamera && imageInput && openCameraBtn && closeCameraBtn && captureCameraBtn) {
      imageInput.addEventListener('change', onImageChange);
      openCameraBtn.addEventListener('click', startCamera);
      closeCameraBtn.addEventListener('click', stopCamera);
      captureCameraBtn.addEventListener('click', onCapture);
    }

    applyRecommendedBtn?.addEventListener('click', onApplyRecommended);
    categoryInput?.addEventListener('change', applyRecommendedPrice);
    costInput?.addEventListener('input', applyRecommendedPrice);
    costInput?.addEventListener('input', updateMarginGuardUI);
    priceInput?.addEventListener('input', updateMarginGuardUI);
    form?.addEventListener('submit', onSubmit);
    window.addEventListener('beforeunload', onBeforeUnload);

    void applyRecommendedPrice();
    updateMarginGuardUI();

    return () => {
      stopCamera();
      if (canUseCamera && imageInput && openCameraBtn && closeCameraBtn && captureCameraBtn) {
        imageInput.removeEventListener('change', onImageChange);
        openCameraBtn.removeEventListener('click', startCamera);
        closeCameraBtn.removeEventListener('click', stopCamera);
        captureCameraBtn.removeEventListener('click', onCapture);
      }
      applyRecommendedBtn?.removeEventListener('click', onApplyRecommended);
      categoryInput?.removeEventListener('change', applyRecommendedPrice);
      costInput?.removeEventListener('input', applyRecommendedPrice);
      costInput?.removeEventListener('input', updateMarginGuardUI);
      priceInput?.removeEventListener('input', updateMarginGuardUI);
      form?.removeEventListener('submit', onSubmit);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [rootId]);

  return null;
}

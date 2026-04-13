import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import {
  buildBrandOptions,
  buildDeviceTypeOptions,
  buildIssueOptions,
  buildModelOptions,
  normalizeNullable,
  type BrandItem,
  type DeviceTypeItem,
  type IssueItem,
  type ModelItem,
} from './admin-repair-create.helpers';

type Params = {
  deviceTypeId: string;
  deviceBrandId: string;
  deviceModelId: string;
  deviceIssueTypeId: string;
  deviceBrand: string;
  deviceModel: string;
  issueLabel: string;
  setDeviceBrandId: (value: string) => void;
  setDeviceModelId: (value: string) => void;
  setDeviceIssueTypeId: (value: string) => void;
  setDeviceBrand: (value: string) => void;
  setDeviceModel: (value: string) => void;
  setIssueLabel: (value: string) => void;
};

export function useAdminRepairCreateCatalog({
  deviceTypeId,
  deviceBrandId,
  deviceModelId,
  deviceIssueTypeId,
  deviceBrand,
  deviceModel,
  issueLabel,
  setDeviceBrandId,
  setDeviceModelId,
  setDeviceIssueTypeId,
  setDeviceBrand,
  setDeviceModel,
  setIssueLabel,
}: Params) {
  const catalogRequestId = useRef(0);
  const modelRequestId = useRef(0);

  const [catalogReloadToken, setCatalogReloadToken] = useState(0);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadTypes() {
      setLoadingTypes(true);
      setCatalogError('');
      try {
        const response = await adminApi.deviceTypes();
        if (!mounted) return;
        setDeviceTypes(response.items.filter((item) => item.active));
      } catch (error) {
        if (!mounted) return;
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar el catalogo.');
      } finally {
        if (mounted) setLoadingTypes(false);
      }
    }

    void loadTypes();
    return () => {
      mounted = false;
    };
  }, [catalogReloadToken]);

  useEffect(() => {
    const requestId = catalogRequestId.current + 1;
    catalogRequestId.current = requestId;
    let mounted = true;

    async function loadCatalogSlices() {
      setLoadingBrands(true);
      setLoadingIssues(true);
      setCatalogError('');
      try {
        const [brandResponse, issueResponse] = await Promise.all([
          deviceCatalogApi.brands(deviceTypeId || undefined),
          deviceCatalogApi.issues(deviceTypeId || undefined),
        ]);
        if (!mounted || requestId !== catalogRequestId.current) return;
        setBrands(brandResponse.items.filter((item) => item.active));
        setIssues(issueResponse.items.filter((item) => item.active));
      } catch (error) {
        if (!mounted || requestId !== catalogRequestId.current) return;
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar el catalogo de marcas y fallas.');
      } finally {
        if (mounted && requestId === catalogRequestId.current) {
          setLoadingBrands(false);
          setLoadingIssues(false);
        }
      }
    }

    void loadCatalogSlices();
    return () => {
      mounted = false;
    };
  }, [deviceTypeId, catalogReloadToken]);

  useEffect(() => {
    const requestId = modelRequestId.current + 1;
    modelRequestId.current = requestId;
    let mounted = true;

    if (!deviceBrandId) {
      setModels([]);
      setLoadingModels(false);
      return () => {
        mounted = false;
      };
    }

    async function loadModels() {
      setLoadingModels(true);
      setCatalogError('');
      try {
        const response = await deviceCatalogApi.models(deviceBrandId);
        if (!mounted || requestId !== modelRequestId.current) return;
        setModels(response.items.filter((item) => item.active));
      } catch (error) {
        if (!mounted || requestId !== modelRequestId.current) return;
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar los modelos.');
      } finally {
        if (mounted && requestId === modelRequestId.current) setLoadingModels(false);
      }
    }

    void loadModels();
    return () => {
      mounted = false;
    };
  }, [deviceBrandId, catalogReloadToken]);

  useEffect(() => {
    if (deviceBrandId && !brands.some((item) => item.id === deviceBrandId)) {
      setDeviceBrandId('');
    }
  }, [brands, deviceBrandId, setDeviceBrandId]);

  useEffect(() => {
    if (deviceIssueTypeId && !issues.some((item) => item.id === deviceIssueTypeId)) {
      setDeviceIssueTypeId('');
    }
  }, [deviceIssueTypeId, issues, setDeviceIssueTypeId]);

  useEffect(() => {
    if (deviceModelId && !models.some((item) => item.id === deviceModelId)) {
      setDeviceModelId('');
    }
  }, [deviceModelId, models, setDeviceModelId]);

  useEffect(() => {
    setDeviceModelId('');
  }, [deviceBrandId, setDeviceModelId]);

  const deviceTypeOptions = useMemo(() => buildDeviceTypeOptions(deviceTypes), [deviceTypes]);
  const brandOptions = useMemo(() => buildBrandOptions(brands), [brands]);
  const modelOptions = useMemo(() => buildModelOptions(models), [models]);
  const issueOptions = useMemo(() => buildIssueOptions(issues), [issues]);

  const selectedBrand = useMemo(() => brands.find((item) => item.id === deviceBrandId) ?? null, [brands, deviceBrandId]);
  const selectedModel = useMemo(() => models.find((item) => item.id === deviceModelId) ?? null, [models, deviceModelId]);
  const selectedIssue = useMemo(() => issues.find((item) => item.id === deviceIssueTypeId) ?? null, [issues, deviceIssueTypeId]);

  useEffect(() => {
    if (selectedBrand && !deviceBrand.trim()) setDeviceBrand(selectedBrand.name);
  }, [deviceBrand, selectedBrand, setDeviceBrand]);

  useEffect(() => {
    if (selectedModel && !deviceModel.trim()) setDeviceModel(selectedModel.name);
  }, [deviceModel, selectedModel, setDeviceModel]);

  useEffect(() => {
    if (selectedIssue && !issueLabel.trim()) setIssueLabel(selectedIssue.name);
  }, [issueLabel, selectedIssue, setIssueLabel]);

  return {
    loadingTypes,
    loadingBrands,
    loadingModels,
    loadingIssues,
    catalogError,
    catalogBusy: loadingTypes || loadingBrands || loadingModels || loadingIssues,
    deviceTypeOptions,
    brandOptions,
    modelOptions,
    issueOptions,
    selectedBrand,
    selectedModel,
    selectedIssue,
    resolvedBrand: normalizeNullable(deviceBrand) ?? selectedBrand?.name ?? null,
    resolvedModel: normalizeNullable(deviceModel) ?? selectedModel?.name ?? null,
    resolvedIssue: normalizeNullable(issueLabel) ?? selectedIssue?.name ?? null,
    reloadCatalog: () => setCatalogReloadToken((current) => current + 1),
  };
}

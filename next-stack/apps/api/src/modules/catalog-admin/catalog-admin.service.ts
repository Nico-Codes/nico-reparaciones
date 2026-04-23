import { Inject, Injectable } from '@nestjs/common';
import { CatalogAdminCategoriesService } from './catalog-admin-categories.service.js';
import { CatalogAdminPricingService } from './catalog-admin-pricing.service.js';
import { CatalogAdminProductsService } from './catalog-admin-products.service.js';
import { CatalogAdminSpecialOrderService } from './catalog-admin-special-order.service.js';
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  ProductCreateInput,
  ProductImageUpload,
  ProductListParams,
  ProductPricingRuleCreateInput,
  ProductPricingRuleUpdateInput,
  ProductPricingSettingsInput,
  SpecialOrderImportApplyInput,
  SpecialOrderImportPreviewInput,
  SpecialOrderProfileCreateInput,
  SpecialOrderProfileUpdateInput,
  ProductUpdateInput,
  ResolveProductPricingInput,
} from './catalog-admin.types.js';

@Injectable()
export class CatalogAdminService {
  constructor(
    @Inject(CatalogAdminCategoriesService)
    private readonly categoriesService: CatalogAdminCategoriesService,
    @Inject(CatalogAdminProductsService)
    private readonly productsService: CatalogAdminProductsService,
    @Inject(CatalogAdminPricingService)
    private readonly pricingService: CatalogAdminPricingService,
    @Inject(CatalogAdminSpecialOrderService)
    private readonly specialOrderService: CatalogAdminSpecialOrderService,
  ) {}

  async categories() {
    return this.categoriesService.categories();
  }

  async createCategory(input: CategoryCreateInput) {
    return this.categoriesService.createCategory(input);
  }

  async updateCategory(id: string, input: CategoryUpdateInput) {
    return this.categoriesService.updateCategory(id, input);
  }

  async deleteCategory(id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  async products(params?: ProductListParams) {
    return this.productsService.products(params);
  }

  async product(id: string) {
    return this.productsService.product(id);
  }

  async createProduct(input: ProductCreateInput) {
    return this.productsService.createProduct(input);
  }

  async updateProduct(id: string, input: ProductUpdateInput) {
    return this.productsService.updateProduct(id, input);
  }

  async uploadProductImage(id: string, file: ProductImageUpload) {
    return this.productsService.uploadProductImage(id, file);
  }

  async removeProductImage(id: string) {
    return this.productsService.removeProductImage(id);
  }

  async productPricingSettings() {
    return this.pricingService.productPricingSettings();
  }

  async updateProductPricingSettings(input: ProductPricingSettingsInput) {
    return this.pricingService.updateProductPricingSettings(input);
  }

  async productPricingRules() {
    return this.pricingService.productPricingRules();
  }

  async createProductPricingRule(input: ProductPricingRuleCreateInput) {
    return this.pricingService.createProductPricingRule(input);
  }

  async updateProductPricingRule(id: string, input: ProductPricingRuleUpdateInput) {
    return this.pricingService.updateProductPricingRule(id, input);
  }

  async deleteProductPricingRule(id: string) {
    return this.pricingService.deleteProductPricingRule(id);
  }

  async resolveRecommendedProductPrice(input: ResolveProductPricingInput) {
    return this.pricingService.resolveRecommendedProductPrice(input);
  }

  async specialOrderProfiles() {
    return this.specialOrderService.profiles();
  }

  async createSpecialOrderProfile(input: SpecialOrderProfileCreateInput) {
    return this.specialOrderService.createProfile(input);
  }

  async updateSpecialOrderProfile(id: string, input: SpecialOrderProfileUpdateInput) {
    return this.specialOrderService.updateProfile(id, input);
  }

  async previewSpecialOrderImport(input: SpecialOrderImportPreviewInput) {
    return this.specialOrderService.previewImport(input);
  }

  async applySpecialOrderImport(input: SpecialOrderImportApplyInput) {
    return this.specialOrderService.applyImport(input);
  }
}

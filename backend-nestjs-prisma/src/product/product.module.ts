import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { RecentlyViewedController } from './recently-viewed.controller';
import { ProductService } from './product.service';
import { ProductRecommendationService } from './product-recommendation.service';
import { MLIntegrationService } from './ml-integration.service';
import { MLRecommendationFacade } from './ml-recommendation-facade.service';

@Module({
  controllers: [ProductController, RecentlyViewedController],
  providers: [ProductService, ProductRecommendationService, MLIntegrationService, MLRecommendationFacade],
  exports: [ProductService, MLRecommendationFacade],
})
export class ProductModule {}

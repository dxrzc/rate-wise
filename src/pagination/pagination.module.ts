import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import {
    PAGINATION_CACHE_QUEUE,
    REPOSITORY_TOKEN,
    TRANSFORM_FUNCTION,
} from './constants/pagination.constants';
import { PaginationService } from './pagination.service';
import { IPaginationModuleOptions } from './interfaces/pagination.module-options.interface';

@Module({})
export class PaginationModule {
    static register(options: IPaginationModuleOptions): DynamicModule {
        return {
            module: PaginationModule,
            imports: [BullModule.registerQueue({ name: PAGINATION_CACHE_QUEUE })],
            providers: [
                PaginationService,
                {
                    provide: REPOSITORY_TOKEN,
                    useValue: options.repositoryToken,
                },
                {
                    provide: TRANSFORM_FUNCTION,
                    useValue: options.transformFunction,
                },
            ],
            exports: [PaginationService],
        };
    }
}

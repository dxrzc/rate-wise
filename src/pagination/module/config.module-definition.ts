import { ConfigurableModuleBuilder } from '@nestjs/common';
import { IPaginationModuleOptions } from '../interfaces/pagination.module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN: PAGINATION_MODULE_OPTIONS_TOKEN } =
    new ConfigurableModuleBuilder<IPaginationModuleOptions>().build();

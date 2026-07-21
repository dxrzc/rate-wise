import { ConfigurableModuleBuilder } from '@nestjs/common';
import { IPaginationOptions } from './pagination.options';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN: PAGINATION_MODULE_OPTIONS_TOKEN } =
    new ConfigurableModuleBuilder<IPaginationOptions>().build();

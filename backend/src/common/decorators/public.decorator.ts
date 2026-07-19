import { Reflector } from '@nestjs/core';
/**
 * Mark the operation as not requiring authentication
 */
export const Public = Reflector.createDecorator<null>();

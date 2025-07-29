import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserModel } from './models/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserInput } from './dtos/input/create-user.input';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findAll(): Promise<UserModel[]> {
        return await this.userRepository.find();
    }

    async findOneById(id: string): Promise<UserModel> {
        if (!validUUID(id))
            throw new BadRequestException('Id is not a valid UUID');
        const userFound = await this.userRepository.findOneBy({ id });
        if (!userFound)
            throw new NotFoundException(`User with id ${id} not found`);
        return userFound;
    }

    async createOne(user: CreateUserInput): Promise<UserModel> {
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            if (isDuplicatedKeyError(error))
                throw new BadRequestException('User already exists');
            throw new InternalServerErrorException();
        }
    }
}

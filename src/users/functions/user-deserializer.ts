import { User } from '../entities/user.entity';

// export function serializeUser(user: User) {
//     return {
//         ...user,
//         createdAt: user.createdAt.toISOString(),
//         updatedAt: user.updatedAt.toISOString(),
//     };
// }

export function deserializeUser(data: object): User {
    const typedData = data as User;
    return <User>{
        ...typedData,
        createdAt: new Date(typedData.createdAt),
        updatedAt: new Date(typedData.updatedAt),
    };
}

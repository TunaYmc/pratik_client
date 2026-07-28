import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, TagsController, UserSettingsController } from './users.controller';

@Module({
    controllers: [UsersController, TagsController, UserSettingsController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }

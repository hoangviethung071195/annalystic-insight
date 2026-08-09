import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('api/groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const group = await this.groupsService.findOne(id, user.id);
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    return group;
  }

  @Post()
  async create(
    @Body('name') name: string,
    @Body('url') url: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!name || !url) {
      return { success: false, message: 'Name and url are required' };
    }
    const existing = await this.groupsService.findByUrl(user.id, url);
    if (existing) {
      return { success: false, message: 'Group with this URL already exists', group: existing };
    }
    const group = await this.groupsService.create(user.id, name, url);
    return { success: true, group };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const deleted = await this.groupsService.remove(id, user.id);
    if (!deleted) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    return { success: true, message: 'Group deleted' };
  }
}

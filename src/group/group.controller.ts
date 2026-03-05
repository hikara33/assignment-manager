import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GroupService } from './group.service';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Authorization()
  @Post('create')
  async create(
    @Authorized('id') userId: string,
    @Body('name') name: string
  ) {
    return this.groupService.createGroup(userId, name);
  }

  @Authorization()
  @Delete(':id')
  async delete(
    @Authorized('id') userId: string,
    @Param('id') groupId: string
  ) {
    return this.groupService.delete(userId, groupId);
  }

  @Authorization()
  @Patch(':id/owner')
  async shareOwner(
    @Authorized('id') userId: string,
    @Param('id') groupId: string,
    @Body('newOwner') newOwner: string
  ) {
    return this.groupService.shareOwnership(userId, newOwner, groupId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { GroupRoleGuard } from './guards/group-role.guard';
import { InviteService } from './invite/invite.service';

@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly inviteService: InviteService
  ) {}

  @Authorization()
  @Post('create')
  async create(
    @Authorized('id') userId: string,
    @Body('name') name: string
  ) {
    return this.groupService.createGroup(userId, name);
  }

  @Authorization()
  @UseGuards(GroupRoleGuard)
  @Delete(':id')
  async delete(
    @Authorized('id') userId: string,
    @Param('id') groupId: string
  ) {
    return this.groupService.delete(userId, groupId);
  }

  @Authorization()
  @UseGuards(GroupRoleGuard)
  @Patch(':id/owner')
  async shareOwner(
    @Authorized('id') userId: string,
    @Param('id') groupId: string,
    @Body('newOwner') newOwner: string
  ) {
    return this.groupService.shareOwnership(userId, newOwner, groupId);
  }

  @Authorization()
  @UseGuards(GroupRoleGuard)
  @Post(':id/invite')
  async inviteUser(
    @Authorized('id') id: string,
    @Param('id') groupId: string,
    @Body('email') email: string
  ) {
    return this.inviteService.inviteUser(email, groupId, id);
  }

  @Authorization()
  @Post("invite/accept")
  async acceptInvite(
    @Authorized('id') id: string,
    @Body('token') token: string
  ) {
    return this.inviteService.acceptInvite(token, id);
  }

  @Authorization()
  @Post("invite/decline")
  async declineInvite(
    @Authorized('id') id: string,
    @Body('token') token: string
  ) {
    return this.inviteService.declineInvite(token, id);
  }
}

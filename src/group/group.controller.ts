import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { GroupRoleGuard } from './guards/group-role.guard';
import { InviteService } from './invite/invite.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { MemberService } from './member/member.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Group')
@ApiBearerAuth()
@Controller('group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly inviteService: InviteService,
    private readonly memberService: MemberService,
  ) {}

  @Authorization()
  @ApiOperation({ summary: 'Создать группу' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { name: { type: 'string', example: 'Math Team' } },
      required: ['name'],
    },
  })
  @Post('create')
  async create(@Authorized('id') userId: string, @Body('name') name: string) {
    return this.groupService.createGroup(userId, name);
  }

  @Authorization()
  @ApiOperation({ summary: 'Принять приглашение в группу' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { token: { type: 'string', example: 'jwt-token' } },
      required: ['token'],
    },
  })
  @Post('invite/accept')
  async acceptInvite(
    @Authorized('id') id: string,
    @Body('token') token: string,
  ) {
    return this.inviteService.acceptInvite(token, id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Отклонить приглашение в группу' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { token: { type: 'string', example: 'jwt-token' } },
      required: ['token'],
    },
  })
  @Post('invite/decline')
  async declineInvite(
    @Authorized('id') id: string,
    @Body('token') token: string,
  ) {
    return this.inviteService.declineInvite(token, id);
  }

  @UseGuards(JwtGuard, GroupRoleGuard)
  @ApiOperation({ summary: 'Удалить группу (только OWNER)' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Delete(':id')
  async delete(@Authorized('id') userId: string, @Param('id') groupId: string) {
    return this.groupService.delete(userId, groupId);
  }

  @UseGuards(JwtGuard, GroupRoleGuard)
  @ApiOperation({ summary: 'Передать владение группой (только OWNER)' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { newOwner: { type: 'string', example: 'user-id' } },
      required: ['newOwner'],
    },
  })
  @Patch(':id/owner')
  async shareOwner(
    @Authorized('id') userId: string,
    @Param('id') groupId: string,
    @Body('newOwner') newOwner: string,
  ) {
    return this.groupService.shareOwnership(userId, newOwner, groupId);
  }

  @UseGuards(JwtGuard, GroupRoleGuard)
  @ApiOperation({ summary: 'Пригласить пользователя в группу (только OWNER)' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string', example: 'invite@example.com' } },
      required: ['email'],
    },
  })
  @Post(':id/invite')
  async inviteUser(
    @Authorized('id') id: string,
    @Param('id') groupId: string,
    @Body('email') email: string,
  ) {
    return this.inviteService.inviteUser(email, groupId, id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Выйти из группы' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Delete(':id/members')
  async leaveGroup(
    @Authorized('id') userId: string,
    @Param('id') groupId: string,
  ) {
    return await this.memberService.leaveGroup(userId, groupId);
  }

  @UseGuards(JwtGuard, GroupRoleGuard)
  @ApiOperation({ summary: 'Удалить участника из группы (только OWNER)' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @ApiParam({ name: 'memberId', description: 'ID участника' })
  @Delete(':id/members/:memberId')
  async removeMember(
    @Authorized('id') userId: string,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return await this.memberService.removeMember(userId, memberId, groupId);
  }

  @Authorization()
  @ApiOperation({ summary: 'Получить список участников группы' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Get(':id/members')
  async getMembers(@Param('id') groupId: string) {
    return await this.memberService.getUsersGroup(groupId);
  }
}

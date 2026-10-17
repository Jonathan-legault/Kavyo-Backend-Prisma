import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.sub,
      updateProfileDto,
    );
  }

  @UseGuards(JwtAuthGuard)
@Get('me/preferences')
getPreferences(@Req() req: AuthenticatedRequest) {
  return this.usersService.getPreferences(req.user.sub);
}

@UseGuards(JwtAuthGuard)
@Patch('me/preferences')
updatePreferences(
  @Req() req: AuthenticatedRequest,
  @Body() updatePreferencesDto: UpdatePreferencesDto,
) {
  return this.usersService.updatePreferences(
    req.user.sub,
    updatePreferencesDto,
  );
}
}
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map((userRole) => userRole.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        firstName: updateProfileDto.firstName?.trim(),
        lastName: updateProfileDto.lastName?.trim(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.userPreference.findUnique({
      where: {
        userId,
      },
      include: {
        usualStore: {
          include: {
            retailer: true,
          },
        },
      },
    });
  }

  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    if (updatePreferencesDto.usualStoreId) {
      const store = await this.prisma.store.findUnique({
        where: {
          id: updatePreferencesDto.usualStoreId,
        },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }
    }

    return this.prisma.userPreference.upsert({
      where: {
        userId,
      },
      update: {
        usualStoreId: updatePreferencesDto.usualStoreId,
        maxTravelDistanceKm:
          updatePreferencesDto.maxTravelDistanceKm,
        maxExtraTravelMinutes:
          updatePreferencesDto.maxExtraTravelMinutes,
      },
      create: {
        userId,
        usualStoreId: updatePreferencesDto.usualStoreId,
        maxTravelDistanceKm:
          updatePreferencesDto.maxTravelDistanceKm,
        maxExtraTravelMinutes:
          updatePreferencesDto.maxExtraTravelMinutes,
      },
      include: {
        usualStore: {
          include: {
            retailer: true,
          },
        },
      },
    });
  }
}
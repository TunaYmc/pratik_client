import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const records = await this.prisma.systemSettings.findMany();
    const settings = {
      baseOfficeEur: 50,
      baseComputeEur: 150,
      baseStorageEur: 15,
    };
    for (const record of records) {
      if (record.key === 'baseOfficeEur') settings.baseOfficeEur = parseFloat(record.value);
      if (record.key === 'baseComputeEur') settings.baseComputeEur = parseFloat(record.value);
      if (record.key === 'baseStorageEur') settings.baseStorageEur = parseFloat(record.value);
    }
    return settings;
  }

  async updateSettings(data: { baseOfficeEur?: number, baseComputeEur?: number, baseStorageEur?: number }) {
    if (data.baseOfficeEur !== undefined) {
      await this.prisma.systemSettings.upsert({
        where: { key: 'baseOfficeEur' },
        update: { value: data.baseOfficeEur.toString() },
        create: { key: 'baseOfficeEur', value: data.baseOfficeEur.toString() },
      });
    }
    if (data.baseComputeEur !== undefined) {
      await this.prisma.systemSettings.upsert({
        where: { key: 'baseComputeEur' },
        update: { value: data.baseComputeEur.toString() },
        create: { key: 'baseComputeEur', value: data.baseComputeEur.toString() },
      });
    }
    if (data.baseStorageEur !== undefined) {
      await this.prisma.systemSettings.upsert({
        where: { key: 'baseStorageEur' },
        update: { value: data.baseStorageEur.toString() },
        create: { key: 'baseStorageEur', value: data.baseStorageEur.toString() },
      });
    }
    return { success: true };
  }
}

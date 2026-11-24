import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Kavyo Staging API — GitHub deployment test successful';
  }
}

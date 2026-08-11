import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';

@Module({
  providers: [CommunicationsService],
  controllers: [CommunicationsController],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}

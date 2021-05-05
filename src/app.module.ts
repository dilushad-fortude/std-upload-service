import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { StudentProcessor } from './student/student.processor';
import { StudentService } from './student/student.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
    })
  ],
  controllers: [AppController],
  providers: [AppService, StudentService, StudentProcessor, NotificationGateway],
})
export class AppModule {}

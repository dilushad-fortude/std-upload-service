import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';
import { StudentService } from './student/student.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly studentService: StudentService) {}

  // @Get()
  @MessagePattern({cmd: "upload-multiple-students"})
  uploadStudnets(data: any) {
    this.studentService.addStudentJob(data).then(data => console.log(data));
    //return this.appService.getHello();
  }

  @MessagePattern({cmd: "student-batch-upload"})
  studentBatchUpdate(data: any) {
    this.studentService.addStudentBatchJob(data).then(data => console.log(data));
  }
}

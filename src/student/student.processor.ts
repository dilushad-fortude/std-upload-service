import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { Student } from "src/entity/student.entity";
import { StudentService } from "./student.service";
import axios from 'axios';
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "http";
import readXlsxFile from 'read-excel-file'
import { NotificationGateway } from "src/gateways/notification.gateway";
import { Socket } from 'socket.io';

const POSTGRAPHILE_URL = "http://localhost:3001/graphql";

@Processor("audio")
export class StudentProcessor {
  constructor(
    private readonly studentService: StudentService,
    private readonly notificationGateway: NotificationGateway
  ) { }

  private readonly logger = new Logger(this.constructor.name)
  @OnQueueActive()
  onActive(job: Job) {

    this.logger.debug(`Processing job ${job.id} of type ${job.name}.`)
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {

    this.logger.debug(`Completed job ${job.id} of type ${job.name}. Result: ${JSON.stringify(result)}`);
    if (job.name === 'add-students') {
      this.notificationGateway.sendNotification(result);
    }
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`, error.stack)
  }

  @Process('add-students')
  async saveMultipleStudents(job: Job<{ obj: any }>): Promise<any> {
    this.logger.log(`Processing job '${JSON.stringify(job.name)}'`);

    return await readXlsxFile(job.data['stdExeclFile'].buffer.data).then(async (rows) => {
      let nameIndex = rows[0].indexOf("name");
      let emailIndex = rows[0].indexOf("email");
      let birthdayIndex = rows[0].indexOf("dob");
      for (let i = 1; i < rows.length; i++) {
        rows[i][nameIndex]
        this.saveStudent(rows, i, nameIndex, emailIndex, birthdayIndex)
          .then(res => { console.log(res.data.data); })
          .catch(function (error) {
            console.log(error);
            return error;
          });;
      }

      return rows.length;
    }).then(data => data);
  }

  saveStudent(rows: any, i: number, nameIndex: any, emailIndex: any, birthdayIndex: any) {
    return axios.post(POSTGRAPHILE_URL, {
      query: `mutation createStudent {
                createStudent(input:{student:{
                    name: "${rows[i][nameIndex]}", 
                    email: "${rows[i][emailIndex]}", 
                    dob: "${rows[i][birthdayIndex]}"}}) {
                  student{
                    id, name
                  }
                }
              }`
    });
  }
}



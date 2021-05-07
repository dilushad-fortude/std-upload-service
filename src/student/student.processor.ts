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
import { Observable, of } from "rxjs";
import { createWriteStream } from "fs";
import { ReadStream } from "node:fs";

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
    if (job.name === 'add-students' || job.name === 'student-batch-upload-job') {
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
      let dob = rows[0].indexOf("dob");

      this.batchCreation(rows, nameIndex, emailIndex, dob);

      return rows.length;
    }).then(data => data);
  }

  @Process('student-batch-upload-job')
  async studentBatchUpload(job: Job<{ obj: any}>): Promise<any> {
    return await readXlsxFile(job.data['file']['data']).then(async (rows) => {
      let nameIndex = rows[0].indexOf("name");
      let emailIndex = rows[0].indexOf("email");
      let dob = rows[0].indexOf("dob");

      this.batchCreation(rows, nameIndex, emailIndex, dob);

      return rows.length;
    }).then(data => data);
  }

  generateQuery(students: [Student], nameIndex: any, emailIndex: any, birthdayIndex: any): string {
    let str = "";
    for (let x = 0; x < students.length; x++) {
      str += `
      std${x} : createStudent(input:{student:{
        name: "${students[x][nameIndex]}", 
        email: "${students[x][emailIndex]}", 
        dob: "${students[x][birthdayIndex]}"}}) {
        student{
          id, name
        }
      }
      `;
    }

    return str;
  }

  batchCreation(reqBody: [Student], nameIndex, emailIndex, birthdayIndex) {
    return axios.post(POSTGRAPHILE_URL, {
      query: `mutation createStudent {
        ${this.generateQuery(reqBody, nameIndex, emailIndex, birthdayIndex)}
      }`
    }).then(res => res.data)
      .catch(e => e);
  }
}



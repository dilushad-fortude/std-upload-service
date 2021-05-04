import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { Student } from "src/entity/student.entity";
import { StudentService } from "./student.service";
import axios from 'axios';
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "http";
import readXlsxFile from 'read-excel-file'

const POSTGRAPHILE_URL = "http://localhost:5000/graphql";

@Processor("audio")
@WebSocketGateway(80,{ namespace: 'events'})
export class StudentProcessor {
  constructor(private readonly studentService: StudentService) { }

  @WebSocketServer() notificationServer: Server;

  private readonly logger = new Logger(this.constructor.name)
  @OnQueueActive()
  onActive(job: Job) {

    this.logger.debug(`Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(job.data)}`)
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {

    this.logger.debug(`Completed job ${job.id} of type ${job.name}. Result: ${JSON.stringify(result)}`);
    if(job.name === 'add-students') {
      this.notificationServer.emit('updateCompletionMessage');
    }
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {

    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`, error.stack)
  }

  @Process('add-students')
  async sendWelcomeEmail(job: Job<{ obj: any }>): Promise<any> {
    this.logger.log(`Processing job '${JSON.stringify(job.data)}'`);
    await readXlsxFile(job.data['stdExeclFile'].buffer.data).then(async (rows) => {
      console.log(rows);
      let nameIndex = rows[0].indexOf("name");
      let emailIndex = rows[0].indexOf("email");
      let birthdayIndex = rows[0].indexOf("dob");
      for (let i = 1; i < rows.length; i++) {
          rows[i][nameIndex]
          axios.post(POSTGRAPHILE_URL, {
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
          }).then(res => { console.log(res.data.data); })
            .catch(function (error) {
              return error;
            });
      }
  })
  }
}
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class StudentService {
    constructor(@InjectQueue('audio') private audioQueue: Queue) { }

    async addStudentJob(data: any): Promise<boolean> {
        try{
            await this.audioQueue.add('add-students', data);
            return true;
        } catch(error) {
            console.log("error occured", error);
            return false;
        }
    }

    async addStudentBatchJob(data: any): Promise<boolean> {
        try{
            await this.audioQueue.add('student-batch-upload-job', data);
            return true;
        } catch(error) {
            console.log("error occured", error);
            return false;
        }
    }
}

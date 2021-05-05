import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const socketClusterClient = require('socketcluster-client');

export class NotificationGateway {

    private socket = null;

    constructor() {
        this.socket = socketClusterClient.create({
            hostname: 'localhost',
            port: 8000
        });

        (async () => {

            let myChannel = this.socket.channel('notification');
            //console.log(myChannel);

            // Can subscribe to the channel later as a separate step.
            myChannel.subscribe();
            await myChannel.listener('subscribe').once();
            // myChannel.state is now 'subscribed'.
            for await (let data of myChannel) {
                console.log("data from channe", data);
            }
        })();
    }

    sendNotification(count: number) {
        this.socket.transmit('notification', JSON.stringify({ action: 'upload-students', count: count }));
    }
}
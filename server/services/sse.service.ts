import { Response } from 'express';

class SSEService {
  private clients: Map<string, Set<Response>> = new Map();

  subscribe(roomId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, new Set());
    }
    this.clients.get(roomId)!.add(res);

    console.log(`[SSE] Client subscribed to room ${roomId}. Total: ${this.clients.get(roomId)!.size}`);

    res.on('close', () => {
      this.clients.get(roomId)?.delete(res);
      console.log(`[SSE] Client unsubscribed from room ${roomId}`);
    });
  }

  broadcast(roomId: string, event: string, data: any) {
    const clients = this.clients.get(roomId);
    if (!clients) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
      client.write(payload);
    });
  }
}

export const sseService = new SSEService();

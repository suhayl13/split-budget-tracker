import fs from 'fs';
import path from 'path';
import { JournalTx } from '../domain/journal';

const DATA_FILE = path.join(process.cwd(), 'data.json');

export class MemoryRepo {
  private journal: JournalTx[] = [];

  constructor() {
    this.loadFromFile();
  }

  getAll(): JournalTx[] {
    return this.journal;
  }

  add(tx: JournalTx) {
    this.journal.push(tx);
    this.saveToFile();
  }

  clear() {
    this.journal = [];
    this.saveToFile();
  }

  private saveToFile() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.journal, null, 2), 'utf-8');
  }

  private loadFromFile() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        this.journal = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      } catch {
        this.journal = [];
      }
    }
  }
}

export const repo = new MemoryRepo();

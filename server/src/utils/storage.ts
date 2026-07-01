import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

/**
 * Camada de abstração para armazenamento de arquivos.
 * Atualmente usa armazenamento local.
 * Para migrar para S3, basta implementar a interface IStorageProvider
 * e trocar a instância no container de DI.
 */

export interface IStorageProvider {
  save(file: Express.Multer.File, folder: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(file: Express.Multer.File, folder: string): Promise<string> {
    const folderPath = path.join(this.baseDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return path.join(folder, fileName);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}

// Para migrar para S3, crie S3StorageProvider implementando IStorageProvider
// e troque aqui:
export const storageProvider: IStorageProvider = new LocalStorageProvider();

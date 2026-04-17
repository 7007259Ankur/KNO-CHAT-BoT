/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface UploadedFile {
  name: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
}

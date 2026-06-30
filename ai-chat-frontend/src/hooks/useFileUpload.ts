import { useState, useCallback } from 'react';
import type { FileInfo } from '../types';
import { useChatStore } from '../store';

export interface UploadFileItem {
  fileInfo: FileInfo;
  progress: number;
  uploading: boolean;
  _tmpId?: number;
}

let _nextId = 0;

interface UseFileUploadReturn {
  files: UploadFileItem[];
  addFiles: (fileList: FileList) => Promise<void>;
  addFile: (file: File) => Promise<void>;
  removeFile: (id: number) => void;
  uploading: boolean;
}

async function uploadFile(file: File, onProgress: (pct: number) => void): Promise<FileInfo> {
  const formData = new FormData();
  formData.append('file', file);
  const token = useChatStore.getState().token;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json.data as FileInfo);
        else reject(new Error(json.message || '上传失败'));
      } catch { reject(new Error('上传失败')); }
    });
    xhr.addEventListener('error', () => reject(new Error('网络异常')));
    xhr.open('POST', '/api/files/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const addFile = useCallback(async (file: File) => {
    const tempId = Date.now() + Math.random();
    const entry: UploadFileItem = { fileInfo: { id: 0, originalName: file.name, mimeType: file.type, size: file.size, tempId }, progress: 0, uploading: true, _tmpId: ++_nextId };
    setFiles((prev) => [...prev, entry]);
    try {
      const info = await uploadFile(file, (pct) => {
        setFiles((prev) => prev.map((f) =>
          f._tmpId === entry._tmpId && f.uploading ? { ...f, progress: pct } : f
        ));
      });
      setFiles((prev) => prev.map((f) =>
        f._tmpId === entry._tmpId && f.uploading ? { fileInfo: info, progress: 100, uploading: false } : f
      ));
    } catch (err) {
      setFiles((prev) => prev.filter((f) => f._tmpId !== entry._tmpId));
      throw err;
    }
  }, []);

  const addFiles = useCallback(async (fileList: FileList) => {
    await Promise.all(Array.from(fileList).map((f) => addFile(f)));
  }, [addFile]);

  const removeFile = useCallback((id: number) => {
    setFiles((prev) => prev.filter((f) => f.fileInfo.id !== id));
  }, []);

  return { files, addFiles, addFile, removeFile, uploading: files.some((f) => f.uploading) };
}

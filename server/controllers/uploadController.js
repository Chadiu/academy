import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUploadDir = () => process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;
    
    let baseUrl;
    if (process.env.BASE_URL) {
      baseUrl = process.env.BASE_URL;
    } else if (process.env.NODE_ENV === 'production') {
      
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      baseUrl = `${protocol}://${host}`;
    } else {
      baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    }

    const uploadDir = getUploadDir();
    const relativePath = path.relative(uploadDir, file.destination);
    const fileUrl = `${baseUrl}/uploads/${relativePath}/${file.filename}`;

    res.json({
      message: 'File uploaded successfully',
      file: {
        originalName: file.originalname,
        fileName: file.filename,
        fileUrl: fileUrl,
        mimeType: file.mimetype,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
};

export const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    let baseUrl;
    if (process.env.BASE_URL) {
      baseUrl = process.env.BASE_URL;
    } else if (process.env.NODE_ENV === 'production') {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      baseUrl = `${protocol}://${host}`;
    } else {
      baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    }

    const uploadDir = getUploadDir();
    const files = req.files.map(file => {
      const relativePath = path.relative(uploadDir, file.destination);
      const fileUrl = `${baseUrl}/uploads/${relativePath}/${file.filename}`;
      return {
        originalName: file.originalname,
        fileName: file.filename,
        fileUrl: fileUrl,
        mimeType: file.mimetype,
        size: file.size
      };
    });

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { fileName, folder } = req.body;

    if (!fileName || !folder) {
      return res.status(400).json({ error: 'File name and folder are required.' });
    }

    const allowedFolders = ['videos', 'documents', 'images', 'presentations'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder.' });
    }

    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ error: 'Invalid file name.' });
    }

    const safeFileName = path.basename(fileName);

    const uploadDir = path.resolve(getUploadDir());
    const filePath = path.join(uploadDir, folder, safeFileName);

    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadDir)) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    fs.unlinkSync(resolvedPath);

    res.json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file.' });
  }
};

export const getUploadStats = async (req, res) => {
  try {
    const uploadDir = getUploadDir();
    const folders = ['videos', 'documents', 'images', 'presentations'];

    const stats = {};
    let totalSize = 0;
    let totalFiles = 0;

    for (const folder of folders) {
      const folderPath = path.join(uploadDir, folder);

      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        let folderSize = 0;

        files.forEach(file => {
          try {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            folderSize += stat.size;
          } catch (err) {
            
            console.warn(`Could not stat file ${file}:`, err.message);
          }
        });

        stats[folder] = {
          count: files.length,
          size: folderSize,
          sizeFormatted: formatBytes(folderSize)
        };

        totalSize += folderSize;
        totalFiles += files.length;
      } else {
        stats[folder] = { count: 0, size: 0, sizeFormatted: '0 B' };
      }
    }

    res.json({
      stats,
      total: {
        files: totalFiles,
        size: totalSize,
        sizeFormatted: formatBytes(totalSize)
      }
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({ error: 'Failed to get upload stats.' });
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

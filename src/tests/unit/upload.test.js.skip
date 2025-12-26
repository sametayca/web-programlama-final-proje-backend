const multer = require('multer');
const path = require('path');

// Mock fs before requiring upload
const mockExistsSync = jest.fn(() => true);
const mockMkdirSync = jest.fn(() => {});

jest.mock('fs', () => ({
  existsSync: () => mockExistsSync(),
  mkdirSync: () => mockMkdirSync()
}));

const fs = require('fs');

describe('Upload Middleware', () => {
  let upload;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset modules to get fresh upload instance
    jest.resetModules();
    mockExistsSync.mockReturnValue(true);
    mockMkdirSync.mockImplementation(() => {});
    
    upload = require('../../middleware/upload');
    
    mockReq = {
      file: null,
      files: null
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('Storage configuration', () => {
    it('should configure storage with correct destination', () => {
      const storage = upload.storage;
      expect(storage).toBeDefined();
      expect(typeof storage.getDestination).toBe('function');
      
      const cb = jest.fn();
      storage.getDestination(mockReq, null, cb);
      
      expect(cb).toHaveBeenCalledWith(null, 'uploads/profile-pictures');
    });

    it('should generate unique filenames', () => {
      const storage = upload.storage;
      const file = {
        originalname: 'profile.jpg'
      };
      const cb = jest.fn();
      
      storage.getFilename(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalled();
      const filename = cb.mock.calls[0][1];
      expect(filename).toMatch(/^profile-\d+-\d+\.jpg$/);
    });

    it('should preserve file extension', () => {
      const storage = upload.storage;
      const file = {
        originalname: 'my-photo.png'
      };
      const cb = jest.fn();
      
      storage.getFilename(mockReq, file, cb);
      
      const filename = cb.mock.calls[0][1];
      expect(filename).toMatch(/\.png$/);
    });
  });

  describe('File size limits', () => {
    it('should have default file size limit', () => {
      expect(upload.limits).toBeDefined();
      expect(upload.limits.fileSize).toBe(5242880); // 5MB
    });

    it('should use environment variable for file size limit', () => {
      process.env.MAX_FILE_SIZE = '10485760'; // 10MB
      
      // Reload module to pick up new env var
      jest.resetModules();
      const newUpload = require('../../middleware/upload');
      
      expect(newUpload.limits.fileSize).toBe(10485760);
      
      // Clean up
      delete process.env.MAX_FILE_SIZE;
      jest.resetModules();
    });
  });

  describe('File filter', () => {
    it('should accept valid image files (jpeg)', () => {
      const file = {
        originalname: 'test.jpeg',
        mimetype: 'image/jpeg'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept valid image files (jpg)', () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept valid image files (png)', () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept valid image files (gif)', () => {
      const file = {
        originalname: 'test.gif',
        mimetype: 'image/gif'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject non-image files', () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalled();
      const error = cb.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Only image files');
    });

    it('should reject files with invalid extension', () => {
      const file = {
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalled();
      const error = cb.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });

    it('should reject files with invalid mimetype', () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'application/pdf'
      };
      const cb = jest.fn();
      
      upload.fileFilter(mockReq, file, cb);
      
      expect(cb).toHaveBeenCalled();
      const error = cb.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });
  });
});

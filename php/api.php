<?php
// Web桌面系统 PHP API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class WebOSAPI {
    private $baseDir;
    private $allowedExtensions = ['txt', 'json', 'md', 'html', 'css', 'js', 'php'];
    
    public function __construct() {
        $this->baseDir = __DIR__ . '/files/';
        if (!is_dir($this->baseDir)) {
            mkdir($this->baseDir, 0755, true);
        }
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'list':
                    return $this->listFiles();
                case 'read':
                    return $this->readFile();
                case 'write':
                    return $this->writeFile();
                case 'delete':
                    return $this->deleteFile();
                case 'mkdir':
                    return $this->createDirectory();
                case 'upload':
                    return $this->uploadFile();
                case 'info':
                    return $this->getFileInfo();
                case 'system':
                    return $this->getSystemInfo();
                default:
                    throw new Exception('未知的操作');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function listFiles() {
        $path = $_GET['path'] ?? '';
        $fullPath = $this->getFullPath($path);
        
        if (!is_dir($fullPath)) {
            throw new Exception('目录不存在');
        }
        
        $files = [];
        $items = scandir($fullPath);
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            
            $itemPath = $fullPath . DIRECTORY_SEPARATOR . $item;
            $isDir = is_dir($itemPath);
            
            $files[] = [
                'name' => $item,
                'type' => $isDir ? 'directory' : 'file',
                'size' => $isDir ? null : $this->formatSize(filesize($itemPath)),
                'modified' => date('Y-m-d H:i:s', filemtime($itemPath)),
                'permissions' => substr(sprintf('%o', fileperms($itemPath)), -4)
            ];
        }
        
        return $this->successResponse($files);
    }
    
    private function readFile() {
        $path = $_GET['path'] ?? '';
        $fullPath = $this->getFullPath($path);
        
        if (!file_exists($fullPath) || is_dir($fullPath)) {
            throw new Exception('文件不存在');
        }
        
        if (!$this->isAllowedFile($fullPath)) {
            throw new Exception('不支持的文件类型');
        }
        
        $content = file_get_contents($fullPath);
        if ($content === false) {
            throw new Exception('无法读取文件');
        }
        
        return $this->successResponse([
            'content' => $content,
            'size' => filesize($fullPath),
            'modified' => date('Y-m-d H:i:s', filemtime($fullPath))
        ]);
    }
    
    private function writeFile() {
        $data = json_decode(file_get_contents('php://input'), true);
        $path = $data['path'] ?? '';
        $content = $data['content'] ?? '';
        
        $fullPath = $this->getFullPath($path);
        
        if (!$this->isAllowedFile($fullPath)) {
            throw new Exception('不支持的文件类型');
        }
        
        // 确保目录存在
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (file_put_contents($fullPath, $content) === false) {
            throw new Exception('无法写入文件');
        }
        
        return $this->successResponse(['message' => '文件保存成功']);
    }
    
    private function deleteFile() {
        $path = $_GET['path'] ?? '';
        $fullPath = $this->getFullPath($path);
        
        if (!file_exists($fullPath)) {
            throw new Exception('文件不存在');
        }
        
        if (is_dir($fullPath)) {
            if (!$this->deleteDirectory($fullPath)) {
                throw new Exception('无法删除目录');
            }
        } else {
            if (!unlink($fullPath)) {
                throw new Exception('无法删除文件');
            }
        }
        
        return $this->successResponse(['message' => '删除成功']);
    }
    
    private function createDirectory() {
        $data = json_decode(file_get_contents('php://input'), true);
        $path = $data['path'] ?? '';
        
        $fullPath = $this->getFullPath($path);
        
        if (file_exists($fullPath)) {
            throw new Exception('目录已存在');
        }
        
        if (!mkdir($fullPath, 0755, true)) {
            throw new Exception('无法创建目录');
        }
        
        return $this->successResponse(['message' => '目录创建成功']);
    }
    
    private function uploadFile() {
        if (!isset($_FILES['file'])) {
            throw new Exception('没有上传文件');
        }
        
        $file = $_FILES['file'];
        $path = $_POST['path'] ?? '';
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('文件上传失败');
        }
        
        $fileName = basename($file['name']);
        $fullPath = $this->getFullPath($path . '/' . $fileName);
        
        if (!$this->isAllowedFile($fullPath)) {
            throw new Exception('不支持的文件类型');
        }
        
        // 确保目录存在
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            throw new Exception('无法保存上传的文件');
        }
        
        return $this->successResponse(['message' => '文件上传成功']);
    }
    
    private function getFileInfo() {
        $path = $_GET['path'] ?? '';
        $fullPath = $this->getFullPath($path);
        
        if (!file_exists($fullPath)) {
            throw new Exception('文件不存在');
        }
        
        $isDir = is_dir($fullPath);
        $info = [
            'name' => basename($fullPath),
            'path' => $path,
            'type' => $isDir ? 'directory' : 'file',
            'size' => $isDir ? null : $this->formatSize(filesize($fullPath)),
            'modified' => date('Y-m-d H:i:s', filemtime($fullPath)),
            'permissions' => substr(sprintf('%o', fileperms($fullPath)), -4),
            'readable' => is_readable($fullPath),
            'writable' => is_writable($fullPath)
        ];
        
        if (!$isDir) {
            $info['extension'] = pathinfo($fullPath, PATHINFO_EXTENSION);
            $info['mime_type'] = mime_content_type($fullPath);
        }
        
        return $this->successResponse($info);
    }
    
    private function getSystemInfo() {
        $info = [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
            'current_time' => date('Y-m-d H:i:s'),
            'timezone' => date_default_timezone_get(),
            'disk_free_space' => $this->formatSize(disk_free_space('.')),
            'disk_total_space' => $this->formatSize(disk_total_space('.')),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size')
        ];
        
        return $this->successResponse($info);
    }
    
    private function getFullPath($path) {
        // 移除开头的斜杠
        $path = ltrim($path, '/');
        
        // 规范化路径，防止目录遍历攻击
        $realPath = realpath($this->baseDir . $path);
        
        if ($realPath === false) {
            $realPath = $this->baseDir . $path;
        }
        
        // 确保路径在基础目录内
        if (strpos($realPath, realpath($this->baseDir)) !== 0) {
            throw new Exception('无效的路径');
        }
        
        return $realPath;
    }
    
    private function isAllowedFile($path) {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return in_array($extension, $this->allowedExtensions);
    }
    
    private function deleteDirectory($dir) {
        if (!is_dir($dir)) {
            return false;
        }
        
        $files = array_diff(scandir($dir), ['.', '..']);
        
        foreach ($files as $file) {
            $filePath = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($filePath)) {
                $this->deleteDirectory($filePath);
            } else {
                unlink($filePath);
            }
        }
        
        return rmdir($dir);
    }
    
    private function formatSize($bytes) {
        if ($bytes === false || $bytes === null) {
            return '0 B';
        }
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
    
    private function successResponse($data) {
        return [
            'success' => true,
            'data' => $data
        ];
    }
    
    private function errorResponse($message) {
        return [
            'success' => false,
            'error' => $message
        ];
    }
}

// 处理请求
$api = new WebOSAPI();
echo json_encode($api->handleRequest());
?> 
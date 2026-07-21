<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
$config = file_exists($configPath) ? require $configPath : require __DIR__ . '/config.example.php';

function upload_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    upload_fail(405, 'Метод не поддерживается');
}

if (!empty($_POST['website'] ?? '') || trim((string)($_POST['phone'] ?? '')) === '' || !isset($_POST['consent'])) {
    upload_fail(422, 'Проверьте обязательные поля');
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
    upload_fail(500, 'Не удалось подготовить загрузку');
}

file_put_contents($uploadDir . '.htaccess', "Options -Indexes\nphp_flag engine off\nRemoveHandler .php .phtml .php3 .php4 .php5 .phar\n");

$allowedMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$saved = [];

foreach ($_FILES['photos']['tmp_name'] ?? [] as $index => $tmpName) {
    if (!is_uploaded_file($tmpName)) {
        continue;
    }
    if ((int)($_FILES['photos']['size'][$index] ?? 0) > (int)$config['max_upload_size']) {
        upload_fail(413, 'Файл слишком большой');
    }
    $mime = mime_content_type($tmpName);
    if (!isset($allowedMime[$mime])) {
        upload_fail(415, 'Недопустимый тип файла');
    }
    $name = bin2hex(random_bytes(16)) . '.' . $allowedMime[$mime];
    if (!move_uploaded_file($tmpName, $uploadDir . $name)) {
        upload_fail(500, 'Не удалось сохранить файл');
    }
    $saved[] = $name;
}

require __DIR__ . '/send-lead.php';

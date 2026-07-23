<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
$config = file_exists($configPath) ? require $configPath : require __DIR__ . '/config.example.php';

function fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function normalized_uploads(array $files): array {
    $result = [];
    if (empty($files['name']) || !is_array($files['name'])) {
        return $result;
    }

    foreach ($files['name'] as $index => $name) {
        if ((int)($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $result[] = [
            'name' => (string)$name,
            'type' => (string)($files['type'][$index] ?? ''),
            'tmp_name' => (string)($files['tmp_name'][$index] ?? ''),
            'error' => (int)($files['error'][$index] ?? UPLOAD_ERR_NO_FILE),
            'size' => (int)($files['size'][$index] ?? 0),
        ];
    }

    return $result;
}

function save_uploaded_photos(array $uploads, array $config): array {
    if (!$uploads) {
        return [];
    }

    $maxFiles = (int)($config['max_upload_files'] ?? 5);
    if (count($uploads) > $maxFiles) {
        fail(413, 'Можно приложить не больше ' . $maxFiles . ' фотографий');
    }

    $maxSize = (int)($config['max_upload_size'] ?? 8 * 1024 * 1024);
    $maxTotal = (int)($config['max_total_upload_size'] ?? 12 * 1024 * 1024);
    $total = 0;
    foreach ($uploads as $upload) {
        if ($upload['error'] !== UPLOAD_ERR_OK) {
            fail(400, 'Не удалось получить один из файлов');
        }
        if ($upload['size'] > $maxSize) {
            fail(413, 'Один из файлов слишком большой');
        }
        $total += $upload['size'];
    }
    if ($total > $maxTotal) {
        fail(413, 'Фотографии слишком большие');
    }

    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        fail(500, 'Не удалось подготовить загрузку');
    }

    file_put_contents(
        $uploadDir . '.htaccess',
        "Options -Indexes\nphp_flag engine off\nRemoveHandler .php .phtml .php3 .php4 .php5 .phar\n"
    );

    $allowedMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $saved = [];
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    foreach ($uploads as $upload) {
        $tmpName = $upload['tmp_name'];
        if (!is_uploaded_file($tmpName)) {
            fail(400, 'Некорректная загрузка файла');
        }

        $mime = $finfo->file($tmpName) ?: '';
        if (!isset($allowedMime[$mime])) {
            fail(415, 'Недопустимый тип файла');
        }

        $fileName = bin2hex(random_bytes(16)) . '.' . $allowedMime[$mime];
        if (!move_uploaded_file($tmpName, $uploadDir . $fileName)) {
            fail(500, 'Не удалось сохранить файл');
        }

        $saved[] = $fileName;
    }

    return $saved;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Метод не поддерживается');
}

session_start();
$now = time();
$last = $_SESSION['last_lead_at'] ?? 0;
if ($now - (int)$last < (int)$config['rate_limit_seconds']) {
    fail(429, 'Слишком частая отправка');
}

if (!empty($_POST['website'] ?? '')) {
    fail(400, 'Некорректная заявка');
}

$phone = trim((string)($_POST['phone'] ?? ''));
$consent = isset($_POST['consent']);
if ($phone === '' || !$consent) {
    fail(422, 'Заполните телефон и согласие на обработку данных');
}

$allowed = ['formType', 'pageTitle', 'service', 'name', 'phone', 'selectedService', 'location', 'mkadDistance', 'urgent', 'comment', 'utm'];
$lines = [];
foreach ($allowed as $key) {
    $value = trim((string)($_POST[$key] ?? ''));
    if ($value !== '') {
        $lines[] = htmlspecialchars($key, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ': ' . htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

$savedPhotos = save_uploaded_photos(normalized_uploads($_FILES['photos'] ?? []), $config);
if ($savedPhotos) {
    $lines[] = 'photos: ' . htmlspecialchars(implode(', ', $savedPhotos), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$subject = 'Заявка CleanPlanet';
$body = implode("\n", $lines);
$headers = 'From: ' . $config['from_email'];

if (!empty($config['lead_email'])) {
    @mail($config['lead_email'], $subject, $body, $headers);
}

if (!empty($config['telegram_bot_token']) && !empty($config['telegram_chat_id'])) {
    $url = 'https://api.telegram.org/bot' . $config['telegram_bot_token'] . '/sendMessage';
    $payload = http_build_query(['chat_id' => $config['telegram_chat_id'], 'text' => $subject . "\n" . $body]);
    $context = stream_context_create(['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $payload]]);
    @file_get_contents($url, false, $context);
}

$_SESSION['last_lead_at'] = $now;
echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);

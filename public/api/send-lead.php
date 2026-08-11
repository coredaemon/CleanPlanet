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

    // Без php_flag: на хостингах с PHP-FPM/CGI эта директива в .htaccess
    // приводит к 500 Internal Server Error для всей папки.
    if (!file_exists($uploadDir . '.htaccess')) {
        $uploadRules = <<<'HTACCESS'
Options -Indexes
RemoveHandler .php .phtml .php3 .php4 .php5 .phar
AddType text/plain .php .phtml .php3 .php4 .php5 .phar
<FilesMatch "\.(php|phtml|php3|php4|php5|phar)$">
  Require all denied
</FilesMatch>
HTACCESS;
        file_put_contents($uploadDir . '.htaccess', $uploadRules . "\n");
    }

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

$labels = [
    'name' => 'Имя',
    'phone' => 'Телефон',
    'selectedService' => 'Услуга',
    'location' => 'Где убираться',
    'mkadDistance' => 'Расстояние от МКАД, км',
    'urgent' => 'Срочная уборка',
    'comment' => 'Комментарий',
    'service' => 'Со страницы услуги',
    'pageTitle' => 'Страница',
    'utm' => 'UTM',
    'formType' => 'Тип формы',
];

// Письмо уходит как text/plain, поэтому HTML-экранирование здесь не нужно
// (иначе «кухня & ванная» превратится в «кухня &amp; ванная»).
// Достаточно убрать управляющие символы и переводы строк из значений.
function clean_value(string $value): string {
    $value = str_replace(["\r", "\n"], ' ', $value);
    return trim(preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '');
}

$lines = [];
foreach ($labels as $key => $label) {
    $value = clean_value(trim((string)($_POST[$key] ?? '')));
    if ($value !== '') {
        $lines[] = $label . ': ' . $value;
    }
}

$savedPhotos = save_uploaded_photos(normalized_uploads($_FILES['photos'] ?? []), $config);
if ($savedPhotos) {
    $lines[] = 'Фотографии: ' . implode(', ', $savedPhotos);
}

$subject = 'Заявка CleanPlanet';
$body = implode("\n", $lines);

// Резервная запись заявки в защищённый лог — чтобы лид не потерялся,
// даже если и почта, и Telegram недоступны.
$logDir = __DIR__ . '/leads/';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
if (is_dir($logDir)) {
    if (!file_exists($logDir . '.htaccess')) {
        @file_put_contents($logDir . '.htaccess', "Require all denied\nOrder allow,deny\nDeny from all\n");
    }
    @file_put_contents(
        $logDir . 'leads.log',
        '[' . date('Y-m-d H:i:s') . "]\n" . $body . "\n\n",
        FILE_APPEND | LOCK_EX
    );
}

$mailSent = false;
if (!empty($config['lead_email'])) {
    // Кириллица требует MIME-заголовков: без них тема и тело придут кракозябрами.
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = implode("\r\n", [
        'From: ' . $config['from_email'],
        'Reply-To: ' . $config['from_email'],
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    $mailSent = @mail($config['lead_email'], $encodedSubject, $body, $headers);
}

$telegramSent = false;
if (!empty($config['telegram_bot_token']) && !empty($config['telegram_chat_id'])) {
    $url = 'https://api.telegram.org/bot' . $config['telegram_bot_token'] . '/sendMessage';
    $payload = http_build_query(['chat_id' => $config['telegram_chat_id'], 'text' => $subject . "\n" . $body]);
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $payload,
            'timeout' => 8,
            'ignore_errors' => true,
        ],
    ]);
    $telegramSent = @file_get_contents($url, false, $context) !== false;
}

// Если ни один канал доставки не сработал — честно говорим об этом,
// иначе клиент увидит «успешно», а заявку никто не получит.
if (!$mailSent && !$telegramSent) {
    fail(502, 'Не удалось отправить заявку. Позвоните нам или напишите в WhatsApp.');
}

$_SESSION['last_lead_at'] = $now;
echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);

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

$allowed = ['formType', 'pageTitle', 'service', 'name', 'phone', 'company', 'selectedService', 'objectDetails', 'comment', 'utm'];
$lines = [];
foreach ($allowed as $key) {
    $value = trim((string)($_POST[$key] ?? ''));
    if ($value !== '') {
        $lines[] = htmlspecialchars($key, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ': ' . htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
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

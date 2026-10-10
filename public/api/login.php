<?php
require __DIR__ . '/config.php';

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$pw = isset($body['password']) ? $body['password'] : '';

if (hash_equals(ADMIN_PASSWORD, (string) $pw)) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Şifre hatalı']);
}

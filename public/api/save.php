<?php
require __DIR__ . '/config.php';
require_auth();

$type = isset($_GET['type']) ? $_GET['type'] : '';
if (!in_array($type, ['carousel', 'carouselMobile', 'archive', 'hero', 'about'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz veri tipi']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if ($data === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz JSON verisi']);
    exit;
}

if (!is_dir(DATA_DIR) && !mkdir(DATA_DIR, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'data klasörü oluşturulamadı']);
    exit;
}

$file = DATA_DIR . '/' . $type . '.json';
$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if (file_put_contents($file, $json) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Dosya yazılamadı. Klasör izinlerini kontrol edin.']);
    exit;
}

echo json_encode(['ok' => true]);

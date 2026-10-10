<?php
/**
 * Yönetim panelinden kaldırılan medya dosyasını sunucudan siler.
 *
 * Silme uç noktası, keyfi yol kabul ederse tüm siteyi silmeye açık hale gelir.
 * Bu yüzden istek üç ayrı aşamada doğrulanır: yol biçimi, izin verilen klasör ve
 * uzantı, son olarak da realpath ile sembolik bağ kaçışına karşı kök kontrolü.
 */
require __DIR__ . '/config.php';
require_auth();

// Yalnızca panelin kendi yüklediği medya klasörleri. data/, api/ ve site kökü
// bilinçli olarak dışarıda — oradan hiçbir şey silinemez.
$ALLOWED_PREFIXES = ['images/archive/', 'carousel/', 'about/'];
$ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'webm', 'mov'];

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$path = is_array($body) && isset($body['path']) ? (string) $body['path'] : '';

$rel = ltrim($path, '/');

// 1) Yol biçimi. Null bayt ve ".." reddedilir; karakter kümesi dar tutulur.
if (
    $rel === ''
    || strpos($rel, "\0") !== false
    || strpos($rel, '..') !== false
    || !preg_match('#^[a-zA-Z0-9/._-]+$#', $rel)
) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz yol']);
    exit;
}

// 2) İzin verilen klasör ve uzantı.
$allowed = false;
foreach ($ALLOWED_PREFIXES as $prefix) {
    if (strncmp($rel, $prefix, strlen($prefix)) === 0) {
        $allowed = true;
        break;
    }
}
if (!$allowed) {
    http_response_code(403);
    echo json_encode(['error' => 'Bu klasörden silme yetkisi yok']);
    exit;
}

$ext = strtolower(pathinfo($rel, PATHINFO_EXTENSION));
if (!in_array($ext, $ALLOWED_EXT, true)) {
    http_response_code(403);
    echo json_encode(['error' => 'Bu dosya türü silinemez: .' . $ext]);
    exit;
}

// 3) Gerçek yol kök dizinin içinde mi? realpath sembolik bağları çözer, böylece
// izin verilen klasörden dışarı işaret eden bir bağ da yakalanır.
$root = realpath(SITE_ROOT);
$real = realpath(SITE_ROOT . '/' . $rel);

if ($real === false) {
    // Dosya zaten yok. Panelde kaldırma işlemi tekrar denendiğinde hata
    // göstermemek için bu durum başarı sayılır.
    echo json_encode(['ok' => true, 'missing' => true]);
    exit;
}

if ($root === false || strncmp($real, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) !== 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Yol site kökünün dışında']);
    exit;
}

if (!is_file($real)) {
    http_response_code(400);
    echo json_encode(['error' => 'Hedef bir dosya değil']);
    exit;
}

if (!unlink($real)) {
    http_response_code(500);
    echo json_encode(['error' => 'Dosya silinemedi. Klasör izinlerini kontrol edin.']);
    exit;
}

echo json_encode(['ok' => true]);

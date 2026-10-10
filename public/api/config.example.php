<?php
/**
 * BE/OND yönetim paneli — ortak ayarlar.
 *
 * >>> ÖNEMLİ: Aşağıdaki şifreyi kendi güçlü şifrenizle değiştirin. <<<
 * Bu şifre olmadan kimse değişiklik kaydedemez veya dosya yükleyemez.
 */

define('ADMIN_PASSWORD', 'BURAYA-KENDI-SIFRENIZI-YAZIN');

// Klasör yolları — genelde dokunmaya gerek yok.
define('SITE_ROOT', realpath(__DIR__ . '/..'));   // .../public_html
define('DATA_DIR', SITE_ROOT . '/data');          // .../public_html/data

header('Content-Type: application/json; charset=utf-8');

/**
 * İstek yetkili mi kontrol eder. Değilse 401 döner ve durur.
 */
function require_auth() {
    $pw = '';
    if (isset($_SERVER['HTTP_X_ADMIN_PASSWORD'])) {
        $pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'];
    } elseif (isset($_POST['password'])) {
        $pw = $_POST['password'];
    }
    if (!hash_equals(ADMIN_PASSWORD, (string) $pw)) {
        http_response_code(401);
        echo json_encode(['error' => 'Yetkisiz. Şifre hatalı.']);
        exit;
    }
}

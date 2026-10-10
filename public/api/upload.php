<?php
require __DIR__ . '/config.php';
require_auth();

// "M" / "G" gibi ini değerlerini bayta çevirir.
function ini_bytes($value) {
    $value = trim((string) $value);
    if ($value === '') return 0;
    $unit = strtolower($value[strlen($value) - 1]);
    $num = (float) $value;
    switch ($unit) {
        case 'g': $num *= 1024; // fallthrough
        case 'm': $num *= 1024; // fallthrough
        case 'k': $num *= 1024;
    }
    return (int) $num;
}

// post_max_size aşıldığında PHP gövdenin tamamını atar: $_POST ve $_FILES boş
// gelir, dolayısıyla "dosya yok" gibi görünür. Gerçek sebebi ayırt et, yoksa
// sınır hatası "Dosya bulunamadı" olarak raporlanır ve teşhis edilemez.
if (!isset($_FILES['file'])) {
    $postMax = ini_bytes(ini_get('post_max_size'));
    $sent = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($postMax > 0 && $sent > $postMax) {
        http_response_code(413);
        echo json_encode(['error' => sprintf(
            'Dosya çok büyük: %.1f MB gönderildi, sunucu sınırı %.1f MB (post_max_size). '
            . 'cPanel > MultiPHP INI Editor bölümünden post_max_size ve upload_max_filesize değerlerini yükseltin.',
            $sent / 1048576,
            $postMax / 1048576
        )]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'Dosya bulunamadı (istek gövdesi boş geldi)']);
    exit;
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $uploadMax = ini_get('upload_max_filesize');
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'Dosya upload_max_filesize sınırını aşıyor (şu an ' . $uploadMax
            . '). cPanel > MultiPHP INI Editor bölümünden yükseltin.',
        UPLOAD_ERR_FORM_SIZE => 'Dosya form sınırını aşıyor.',
        UPLOAD_ERR_PARTIAL => 'Yükleme yarıda kesildi, tekrar deneyin.',
        UPLOAD_ERR_NO_FILE => 'Dosya seçilmedi.',
        UPLOAD_ERR_NO_TMP_DIR => 'Sunucuda geçici klasör yok. Hosting desteğine bildirin.',
        UPLOAD_ERR_CANT_WRITE => 'Sunucu diske yazamadı. Klasör izinlerini kontrol edin.',
        UPLOAD_ERR_EXTENSION => 'Bir PHP eklentisi yüklemeyi durdurdu.',
    ];
    $msg = isset($messages[$file['error']])
        ? $messages[$file['error']]
        : 'Yükleme hatası (kod ' . $file['error'] . ')';
    http_response_code(400);
    echo json_encode(['error' => $msg]);
    exit;
}

// Hedef klasör, ör: "carousel" veya "images/archive/ilkbahar-yaz-2024"
$folder = isset($_POST['folder']) ? trim($_POST['folder'], '/') : '';
if ($folder === '' || strpos($folder, '..') !== false || !preg_match('#^[a-zA-Z0-9/_-]+$#', $folder)) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz klasör']);
    exit;
}

// Dosya adı ve uzantı güvenliği
$origName = isset($_POST['filename']) ? $_POST['filename'] : $file['name'];
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
$allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'webm', 'mov'];
if (!in_array($ext, $allowedExt, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'İzin verilmeyen dosya türü: .' . $ext]);
    exit;
}

$imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
$convertToWebp = in_array($ext, $imageExts, true) && function_exists('imagewebp');

$base = pathinfo($origName, PATHINFO_FILENAME);
$base = preg_replace('#[^a-zA-Z0-9_-]#', '-', $base);
if ($base === '') $base = 'dosya';
$finalExt = $convertToWebp ? 'webp' : $ext;
$name = $base . '.' . $finalExt;

$targetDir = SITE_ROOT . '/' . $folder;
if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'Klasör oluşturulamadı. İzinleri kontrol edin.']);
    exit;
}

$dest = $targetDir . '/' . $name;

// A half-width image in the gallery grid needs about 2420 real pixels on a 2x
// display, so 2560 keeps it sharp there while staying well short of the file
// sizes a full 4K cap produces. Covers only ever render as small grid
// thumbnails and do not need detail-page resolution.
$isCover = (bool) preg_match('/^cover\./i', $origName);
$maxWidth = $isCover ? 1280 : 2560;
$quality = $isCover ? 78 : 82;

// The source is decoded in full before any resizing: a 24MP original is ~96MB in
// memory regardless of how small the result will be. That alone can exceed a 128M
// limit, so ask for more headroom. Hosts may refuse this; see .user.ini.
@ini_set('memory_limit', '512M');

if ($convertToWebp) {
    $src = imagecreatefromstring(file_get_contents($file['tmp_name']));
    if ($src === false) {
        $name = $base . '.' . $ext;
        $dest = $targetDir . '/' . $name;
        move_uploaded_file($file['tmp_name'], $dest);
    } else {
        // Maksimum genişliğe küçült
        $origW = imagesx($src);
        $origH = imagesy($src);
        if ($origW > $maxWidth) {
            $newW = $maxWidth;
            $newH = (int) round($origH * $maxWidth / $origW);
            $resized = imagecreatetruecolor($newW, $newH);
            imagecopyresampled($resized, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
            imagedestroy($src);
            $src = $resized;
        }
        if (!imagewebp($src, $dest, $quality)) {
            $name = $base . '.' . $ext;
            $dest = $targetDir . '/' . $name;
            move_uploaded_file($file['tmp_name'], $dest);
        }
        imagedestroy($src);
    }
} else {
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Dosya kaydedilemedi. İzinleri kontrol edin.']);
        exit;
    }
}

echo json_encode(['ok' => true, 'url' => '/' . $folder . '/' . $name]);

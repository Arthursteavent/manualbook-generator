<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metode tidak didukung. Gunakan POST.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data) || !isset($data['project_name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap.']);
    exit;
}

$projectName = trim($data['project_name']);
if ($projectName === '') $projectName = 'Manual Book Project';

// Accept either full html_content (legacy) or the new minimal payload (saved_edits + added_pages)
$htmlContent = isset($data['html_content']) ? trim($data['html_content']) : null;
$savedEdits = isset($data['saved_edits']) ? $data['saved_edits'] : null;
$addedPages = isset($data['added_pages']) ? $data['added_pages'] : null;

if ($htmlContent === null && $savedEdits === null && $addedPages === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Konten kosong.']);
    exit;
}

// Save project to filesystem instead of database
$baseDir = __DIR__ . DIRECTORY_SEPARATOR . 'projects';
if (!is_dir($baseDir)) {
    if (!mkdir($baseDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal membuat folder projects.']);
        exit;
    }
}

// Create a safe folder name
// Support updates to an existing project folder if project_id is provided.
$folderName = null;
if (isset($data['project_id']) && is_string($data['project_id'])) {
    $candidate = trim($data['project_id']);
    $candidate = preg_replace('/[^a-zA-Z0-9-_\.]/', '_', $candidate);
    if ($candidate !== '' && is_dir($baseDir . DIRECTORY_SEPARATOR . $candidate)) {
        $folderName = $candidate;
    }
}

if ($folderName === null) {
    $safeName = preg_replace('/[^a-zA-Z0-9-_\. ]+/', '_', $projectName);
    $safeName = trim($safeName);
    if ($safeName === '') {
        $safeName = 'project';
    }
    $folderName = $safeName . '_' . date('Ymd_His') . '_' . substr(md5(uniqid('', true)), 0, 6);
}
$projectDir = $baseDir . DIRECTORY_SEPARATOR . $folderName;

if (!is_dir($projectDir) && !mkdir($projectDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal membuat folder project.']);
    exit;
}

$indexPath = $projectDir . DIRECTORY_SEPARATOR . 'index.html';
$metaPath = $projectDir . DIRECTORY_SEPARATOR . 'meta.json';

// If full HTML content provided, write it as index.html (legacy)
if ($htmlContent !== null && $htmlContent !== '') {
    if (file_put_contents($indexPath, $htmlContent) === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal menulis file HTML.']);
        exit;
    }
} else {
    // Otherwise, copy the current template as index.html so template stays pristine
    $templateType = isset($data['template_type']) && $data['template_type'] === 'landscape' ? 'landscape' : 'new';
    $templatePath = __DIR__ . DIRECTORY_SEPARATOR . ($templateType === 'landscape' ? 'landscape.html' : 'new.html');
    if (file_exists($templatePath)) {
        $tpl = file_get_contents($templatePath);
        file_put_contents($indexPath, $tpl !== false ? $tpl : "");
    } else {
        file_put_contents($indexPath, "");
    }
}

// Save project_data.json with minimal payload plus optional full HTML snapshot
$projectData = [
    'project_name' => $projectName,
    'saved_edits' => $savedEdits ?: new stdClass(),
    'added_pages' => $addedPages ?: [],
    'html_content' => $htmlContent !== null ? $htmlContent : ''
];
$pdPath = $projectDir . DIRECTORY_SEPARATOR . 'project_data.json';
if (file_put_contents($pdPath, json_encode($projectData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    // continue but warn in response
}


$meta = [
    'project_name' => $projectName,
    'folder' => 'projects/' . $folderName,
    'index' => 'projects/' . $folderName . '/index.html',
    'created_at' => date('c')
];
file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo json_encode(['success' => true, 'id' => $folderName, 'path' => $meta['index']]);
exit;
